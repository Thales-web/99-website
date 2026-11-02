import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateImage, runBatch, sizeToKie } from "../plugins/99-website/scripts/kie-image.mjs";

const png = () => { const b = Buffer.alloc(32); Buffer.from([0x89, 0x50, 0x4e, 0x47]).copy(b); b.writeUInt32BE(1024, 16); b.writeUInt32BE(768, 20); return new Uint8Array(b); };

test("sizeToKie maps named and WxH sizes", () => {
  assert.deepEqual(sizeToKie("landscape_4_3"), { aspect_ratio: "4:3", resolution: "2K" });
  assert.deepEqual(sizeToKie("portrait_4_3"), { aspect_ratio: "3:4", resolution: "2K" });
  assert.deepEqual(sizeToKie("landscape_16_9"), { aspect_ratio: "16:9", resolution: "2K" });
  assert.deepEqual(sizeToKie("1920x1080"), { aspect_ratio: "16:9", resolution: "2K" });
  assert.deepEqual(sizeToKie("1024x1024"), { aspect_ratio: "1:1", resolution: "1K" });
});

test("saves the kie JSON before downloading, then logs the manifest", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kie-"));
  const out = path.join(dir, "masters/hero.png");
  const calls = [];
  let body, auth, jsonExistedAtDownload = false;
  const fetchImpl = async (url, opts = {}) => {
    calls.push(url);
    if (opts.method === "POST") { body = JSON.parse(opts.body); auth = opts.headers.Authorization; return new Response(JSON.stringify({ code: 200, data: { taskId: "t1" } })); }
    if (url.includes("recordInfo")) return new Response(JSON.stringify({ data: { state: "success", resultJson: JSON.stringify({ resultUrls: ["https://cdn/img.png"] }) } }));
    if (url === "https://cdn/img.png") { jsonExistedAtDownload = fs.existsSync(path.join(dir, "masters/hero.kie.json")); return new Response(png()); }
    throw new Error(`unexpected ${url}`);
  };
  const r = await generateImage({ prompt: "a patio", out, id: "hero", manifest: path.join(dir, "m.json"), key: "k", fetchImpl, pollMs: 0 });
  assert.ok(jsonExistedAtDownload, "kie JSON must be on disk before the image download starts");
  assert.equal(auth, "Bearer k");
  assert.equal(body.model, "gpt-image-2-text-to-image");
  assert.deepEqual(body.input, { prompt: "a patio", aspect_ratio: "4:3", resolution: "2K" });
  assert.equal(calls[0], "https://api.kie.ai/api/v1/jobs/createTask");
  const m = JSON.parse(fs.readFileSync(path.join(dir, "m.json"), "utf8"));
  assert.equal(m[0].id, "hero");
  assert.equal(m[0].task_id, "t1");
  assert.equal(r.width, 1024);
  assert.equal(r.height, 768);
});

test("a failed generation throws and writes no image", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kie-"));
  const fetchImpl = async (url, opts = {}) => {
    if (opts.method === "POST") return new Response(JSON.stringify({ data: { taskId: "t2" } }));
    return new Response(JSON.stringify({ data: { state: "fail", failMsg: "nsfw" } }));
  };
  await assert.rejects(generateImage({ prompt: "x", out: path.join(dir, "a.png"), id: "a", manifest: path.join(dir, "m.json"), key: "k", fetchImpl, pollMs: 0 }), /failed/);
  assert.ok(!fs.existsSync(path.join(dir, "a.png")));
});

test("batch: generates every slot and writes the manifest once with no lost rows", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kieb-"));
  let n = 0;
  const fetchImpl = async (url, opts = {}) => {
    if (opts.method === "POST") { n++; return new Response(JSON.stringify({ data: { taskId: `t${n}` } })); }
    if (url.includes("recordInfo")) return new Response(JSON.stringify({ data: { state: "success", resultJson: JSON.stringify({ resultUrls: ["https://cdn/x.png"] }) } }));
    return new Response(png());
  };
  const slots = "a|landscape_4_3|Scene A.\nb|landscape_16_9|Scene B.\nc|1920x1080|Scene C.\n";
  const manifest = path.join(dir, "m.json");
  fs.writeFileSync(manifest, JSON.stringify([{ id: "a", old: true }, { id: "keep" }]));
  const r = await runBatch({ slotsText: slots, style: "STYLE.", outDir: path.join(dir, "masters"), manifest, key: "k", fetchImpl, pollMs: 0 });
  assert.equal(r.ok, 3);
  const m = JSON.parse(fs.readFileSync(manifest, "utf8"));
  assert.deepEqual(m.map((x) => x.id).sort(), ["a", "b", "c", "keep"]);
  assert.ok(!m.find((x) => x.id === "a").old);
  assert.equal(m.find((x) => x.id === "b").prompt, "Scene B. STYLE.");
  for (const id of ["a", "b", "c"]) assert.ok(fs.existsSync(path.join(dir, "masters", `${id}.png`)));
});
