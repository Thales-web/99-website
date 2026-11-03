#!/usr/bin/env node
// Masters (PNG/JPG) -> WebP at 640/768/960/1600 + images.json for the starter's Img component.
//   node optimize-images.mjs --in design/masters --out site/public/img [--budget-kb 90] [--engine auto|native|sharp]
// Engines: "native" = cwebp (brew install webp) + sips, macOS only. "sharp" = the sharp package that `npm install`
// in site/ already brings (Astro depends on it), so it works on macOS, Linux and Windows with nothing extra.
// auto (default) uses native when both tools exist, otherwise sharp. Quality steps down to 40 until the 960w file fits.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const hasCmd = (cmd, arg) => { const r = spawnSync(cmd, [arg], { stdio: "ignore" }); return !(r.error && r.error.code === "ENOENT"); };

// Find sharp: next to the output folder (sites/<slug>/site/node_modules), or inside the plugin scripts folder.
export function loadSharp(startDirs) {
  for (const start of startDirs) {
    for (let d = path.resolve(start); ; d = path.dirname(d)) {
      if (fs.existsSync(path.join(d, "node_modules", "sharp"))) return createRequire(path.join(d, "package.json"))("sharp");
      if (path.dirname(d) === d) break;
    }
  }
  throw new Error("Image conversion needs sharp, or cwebp and sips on macOS. Run `npm install` in sites/<slug>/site (it installs sharp), then run this again.");
}

function nativeEngine() {
  return {
    name: "native",
    dims(file) {
      const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", "-g", "hasAlpha", file]).toString();
      return { w: +out.match(/pixelWidth: (\d+)/)[1], h: +out.match(/pixelHeight: (\d+)/)[1], alpha: /hasAlpha: yes/.test(out) };
    },
    encode(src, dst, w, q, alpha) {
      const a = ["-quiet", "-q", String(q), "-m", "6", "-resize", String(w), "0", "-metadata", "none"];
      if (alpha) a.push("-alpha_q", "60", "-exact");
      execFileSync("cwebp", [...a, src, "-o", dst]);
      return fs.statSync(dst).size;
    },
  };
}

function sharpEngine(sharp) {
  return {
    name: "sharp",
    async dims(file) {
      const m = await sharp(file).metadata();
      return { w: m.width, h: m.height, alpha: Boolean(m.hasAlpha) };
    },
    async encode(src, dst, w, q, alpha) {
      const img = sharp(src).resize({ width: w, withoutEnlargement: true });
      await img.webp(alpha ? { quality: q, alphaQuality: 60, effort: 6 } : { quality: q, effort: 6 }).toFile(dst);
      return fs.statSync(dst).size;
    },
  };
}

export function pickEngine({ engine = "auto", outDir, sharpFrom }) {
  const native = () => nativeEngine();
  const viaSharp = () => sharpEngine(loadSharp([...(sharpFrom ? [sharpFrom] : []), outDir, path.dirname(fileURLToPath(import.meta.url))]));
  if (engine === "native") return native();
  if (engine === "sharp") return viaSharp();
  return hasCmd("cwebp", "-version") && hasCmd("sips", "--version") ? native() : viaSharp();
}

export async function optimize({ inDir, outDir, widths = [640, 768, 960, 1600], q = 72, budgetKb = 90, engine = "auto", sharpFrom }) {
  fs.mkdirSync(outDir, { recursive: true });
  const eng = pickEngine({ engine, outDir, sharpFrom });
  const reportFile = path.join(outDir, "images.json");
  const report = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, "utf8")) : {};
  const failed = [];
  for (const f of fs.readdirSync(inDir).filter((x) => /\.(png|jpe?g)$/i.test(x)).sort()) {
    const name = path.basename(f, path.extname(f));
    const src = path.join(inDir, f);
    const d = await eng.dims(src);
    const ws = widths.filter((w) => w <= d.w);
    const use = ws.length ? ws : [d.w];
    const bw = use.includes(960) ? 960 : use[use.length - 1];
    let quality = q;
    let size;
    for (;;) {
      size = await eng.encode(src, path.join(outDir, `${name}-${bw}.webp`), bw, quality, d.alpha);
      if (size / 1024 <= budgetKb || quality <= 40) break;
      quality -= 4;
    }
    for (const w of use) if (w !== bw) await eng.encode(src, path.join(outDir, `${name}-${w}.webp`), w, quality, d.alpha);
    if (size / 1024 > budgetKb) failed.push(name);
    report[name] = { srcset: use.map((w) => ({ file: `${name}-${w}.webp`, w })), w: d.w, h: d.h, alpha: d.alpha, q: quality };
    console.log(`${size / 1024 <= budgetKb ? "ok  " : "FAIL"} ${name}: ${bw}w ${(size / 1024).toFixed(0)} KB (budget ${budgetKb}), q${quality} [${eng.name}]`);
  }
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  if (failed.length) throw new Error(`${failed.length} image(s) over budget: ${failed.join(", ")}`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
  try { await optimize({ inDir: opt("--in", "design/masters"), outDir: opt("--out", "site/public/img"), budgetKb: +opt("--budget-kb", 90), engine: opt("--engine", "auto") }); }
  catch (e) { console.error(e.message); process.exit(1); }
}
