import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { optimize } from "../plugins/99-website/scripts/optimize-images.mjs";

const has = (cmd) => { try { execFileSync("which", [cmd], { stdio: "ignore" }); return true; } catch { return false; } };

test("makes 640/768/960/1600 WebP (768 = a 412px phone at 1.75x) and an images.json the starter can read", { skip: !has("cwebp") || !has("sips") }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "opt-"));
  const inDir = path.join(dir, "in"); fs.mkdirSync(inDir);
  // 2000x1500 solid PNG made with sips from a 1x1 PNG
  const onePx = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  fs.writeFileSync(path.join(inDir, "hero.png"), onePx);
  execFileSync("sips", ["-z", "1500", "2000", path.join(inDir, "hero.png")], { stdio: "ignore" });
  const out = path.join(dir, "out");
  const r = await optimize({ inDir, outDir: out, engine: "native" });
  assert.deepEqual(r.hero.srcset.map((s) => s.w), [640, 768, 960, 1600]);
  assert.equal(r.hero.w, 2000);
  for (const w of [640, 768, 960, 1600]) assert.ok(fs.existsSync(path.join(out, `hero-${w}.webp`)));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out, "images.json"), "utf8")).hero.srcset.length, 4);
});

// The sharp engine needs the sharp package: run with SHARP_FROM=<a folder whose node_modules has sharp>, for example sites/<slug>/site.
test("sharp engine: 640/768/960/1600 WebP, alpha kept, quality steps down to fit the budget", { skip: !process.env.SHARP_FROM }, async () => {
  const sharp = (await import("node:module")).createRequire(path.join(process.env.SHARP_FROM, "package.json"))("sharp");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "opt-sharp-"));
  const inDir = path.join(dir, "in"); fs.mkdirSync(inDir);
  const noise = Buffer.alloc(2000 * 1500 * 3); for (let i = 0; i < noise.length; i++) noise[i] = (i * 2654435761 >>> 24) & 255;
  await sharp(noise, { raw: { width: 2000, height: 1500, channels: 3 } }).png().toFile(path.join(inDir, "hero.png"));
  await sharp({ create: { width: 800, height: 600, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 0.5 } } }).png().toFile(path.join(inDir, "small.png"));
  const out = path.join(dir, "out");
  const r = await optimize({ inDir, outDir: out, engine: "sharp", sharpFrom: process.env.SHARP_FROM, budgetKb: 150 });
  assert.deepEqual(r.hero.srcset.map((s) => s.w), [640, 768, 960, 1600]);
  assert.equal(r.hero.w, 2000);
  assert.deepEqual(r.small.srcset.map((s) => s.w), [640, 768]);
  assert.equal(r.small.alpha, true);
  for (const w of [640, 768, 960, 1600]) assert.ok(fs.existsSync(path.join(out, `hero-${w}.webp`)));
  assert.ok(fs.statSync(path.join(out, "hero-960.webp")).size / 1024 <= 150);
  assert.ok(r.hero.q < 72, "this noise is about 170 KB at q72, so quality must step down to fit 150 KB");
});
test("sharp engine fails with a clear message when sharp is not installed", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "opt-nosharp-")); fs.mkdirSync(path.join(dir, "in"));
  await assert.rejects(optimize({ inDir: path.join(dir, "in"), outDir: path.join(dir, "out"), engine: "sharp" }), /npm install/);
});
