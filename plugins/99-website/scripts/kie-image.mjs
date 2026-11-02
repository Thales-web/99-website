#!/usr/bin/env node
// GPT Image 2 stills through the kie.ai task API. Saves the kie JSON first (lesson 3), then the image.
//   node kie-image.mjs "<prompt>" design/masters/hero.png --id hero --manifest design/images-manifest.json [--size landscape_4_3]
//   node kie-image.mjs --batch slots.txt --style "<style block>" --out design/masters --manifest design/images-manifest.json
// Needs KIE_API_KEY (env var or a .env file). Get one at https://kie.ai
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const API = "https://api.kie.ai/api/v1/jobs";
const MODEL = "gpt-image-2-text-to-image";

function loadKey() {
  if (process.env.KIE_API_KEY) return process.env.KIE_API_KEY;
  for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
    const f = path.join(dir, ".env");
    const m = fs.existsSync(f) && fs.readFileSync(f, "utf8").match(/^KIE_API_KEY=["']?([^"'\n]+)/m);
    if (m) return m[1].trim();
    if (path.dirname(dir) === dir) break;
  }
  throw new Error("KIE_API_KEY not set (setx KIE_API_KEY on Windows, export it in ~/.zshrc on Mac, or add it to a .env)");
}

// Slot sizes are written as named sizes ("landscape_4_3") or "WxH". kie.ai takes an aspect ratio plus 1K/2K/4K.
const RATIOS = { "1:1": 1, "4:3": 4 / 3, "3:4": 3 / 4, "16:9": 16 / 9, "9:16": 9 / 16 };
export function sizeToKie(size) {
  const s = String(size);
  let m = s.match(/^(landscape|portrait)_(\d+)_(\d+)$/);
  if (m) {
    const [a, b] = m[1] === "landscape" ? [m[2], m[3]] : [m[3], m[2]];
    return { aspect_ratio: `${a}:${b}`, resolution: "2K" };
  }
  if (s === "square" || s === "square_hd") return { aspect_ratio: "1:1", resolution: "2K" };
  m = s.match(/^(\d+)x(\d+)$/);
  if (m) {
    const w = +m[1], h = +m[2], r = w / h;
    const aspect_ratio = Object.keys(RATIOS).sort((x, y) => Math.abs(RATIOS[x] - r) - Math.abs(RATIOS[y] - r))[0];
    // 1:1 tops out at 2K; 1K covers 1024px wide, 2K up to 2048, 4K above that.
    const long = Math.max(w, h);
    const resolution = long <= 1024 ? "1K" : long <= 2048 || aspect_ratio === "1:1" ? "2K" : "4K";
    return { aspect_ratio, resolution };
  }
  return { aspect_ratio: "4:3", resolution: "2K" };
}

function resultUrl(record) {
  let r = record.resultJson;
  if (typeof r === "string") { try { r = JSON.parse(r); } catch { r = null; } }
  return r?.resultUrls?.[0] || r?.resultUrl || record.resultUrls?.[0] || record.imageUrl || record.url;
}

function pngSize(buf) {
  return buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47 ? { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) } : {};
}

export async function generateImage({ prompt, out, id, manifest, size = "landscape_4_3", model = MODEL, key = loadKey(), fetchImpl = fetch, pollMs = 8000 }) {
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const input = { prompt, ...sizeToKie(size) };
  const sub = await fetchImpl(`${API}/createTask`, { method: "POST", headers, body: JSON.stringify({ model, input }) });
  if (!sub.ok) throw new Error(`submit ${sub.status}: ${await sub.text()}`);
  const subBody = await sub.json();
  const taskId = subBody.data?.taskId || subBody.taskId;
  if (!taskId) throw new Error(`no taskId in kie response: ${JSON.stringify(subBody).slice(0, 300)}`);
  let record;
  for (const t0 = Date.now(); ;) {
    if (pollMs) await new Promise((r) => setTimeout(r, pollMs));
    const res = await fetchImpl(`${API}/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers });
    if (res.ok) {
      record = (await res.json()).data || {};
      const state = String(record.state || record.status || "").toLowerCase();
      if (["success", "succeeded", "completed", "done"].includes(state)) break;
      if (["fail", "failed", "error"].includes(state)) throw new Error(`kie generation failed: ${JSON.stringify(record).slice(0, 300)}`);
    }
    if (Date.now() - t0 > 600000) throw new Error("kie generation timed out after 10 minutes");
  }
  const url = resultUrl(record);
  if (!url) throw new Error(`no image in kie response: ${JSON.stringify(record).slice(0, 300)}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const jsonFile = out.replace(/\.[a-z]+$/i, ".kie.json");
  // The result URL is temporary, so the JSON goes to disk before the download.
  fs.writeFileSync(jsonFile, JSON.stringify({ task_id: taskId, model, input, response: record }, null, 2));
  const dl = await fetchImpl(url);
  if (!dl.ok) throw new Error(`download ${dl.status}: ${url}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  fs.writeFileSync(out, buf);
  if (manifest) {
    const list = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, "utf8")) : [];
    list.push({ id, file: out, json: jsonFile, model, prompt, size, task_id: taskId, date: new Date().toISOString() });
    fs.mkdirSync(path.dirname(manifest), { recursive: true });
    fs.writeFileSync(manifest, JSON.stringify(list, null, 2));
  }
  return { file: out, jsonFile, url, ...pngSize(buf) };
}

// Batch: one slot per line, "id|size|scene". Runs 4 at a time and writes the manifest once at the end
// (parallel writers to one file lose rows). A re-generated id replaces its old manifest row.
export async function runBatch({ slotsText, style = "", outDir, manifest, concurrency = 4, ...opts }) {
  const slots = slotsText.trim().split(/\r?\n/).filter(Boolean).map((l) => l.split("|").map((s) => s.trim()));
  const rows = [];
  let failed = 0;
  const queue = [...slots];
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const [id, size, scene] = queue.shift();
      const prompt = style ? `${scene} ${style}` : scene;
      try {
        const r = await generateImage({ ...opts, prompt, out: path.join(outDir, `${id}.png`), id, size, manifest: null });
        rows.push({ id, file: r.file, json: r.jsonFile, model: opts.model || MODEL, prompt, size, date: new Date().toISOString() });
        console.log(`ok   ${id} ${r.width ?? "?"}x${r.height ?? "?"}`);
      } catch (e) { failed++; console.log(`FAIL ${id}: ${e.message.slice(0, 160)}`); }
    }
  }));
  const old = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, "utf8")) : [];
  const ids = new Set(rows.map((r) => r.id));
  fs.mkdirSync(path.dirname(manifest), { recursive: true });
  fs.writeFileSync(manifest, JSON.stringify([...old.filter((r) => !ids.has(r.id)), ...rows], null, 2));
  return { ok: rows.length, failed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
  if (a.includes("--batch")) {
    const r = await runBatch({ slotsText: fs.readFileSync(opt("--batch"), "utf8"), style: opt("--style", ""), outDir: opt("--out", "design/masters"), manifest: opt("--manifest", "design/images-manifest.json") });
    console.log(`${r.ok} generated, ${r.failed} failed`);
    process.exit(r.failed ? 1 : 0);
  }
  const [prompt, out] = a.filter((x, i) => !x.startsWith("--") && !a[i - 1]?.startsWith("--"));
  if (!prompt || !out) { console.error('usage: node kie-image.mjs "<prompt>" out.png --id name --manifest file [--size landscape_4_3]'); process.exit(1); }
  try {
    const r = await generateImage({ prompt, out, id: opt("--id", path.basename(out, path.extname(out))), manifest: opt("--manifest"), size: opt("--size", "landscape_4_3") });
    console.log(`saved ${r.file} (${r.width ?? "?"}x${r.height ?? "?"}), kie JSON ${r.jsonFile}`);
  } catch (e) { console.error(e.message); process.exit(1); }
}
