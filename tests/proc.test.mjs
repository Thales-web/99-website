import { test } from "node:test";
import assert from "node:assert/strict";
import { npxSpec } from "../plugins/99-website/scripts/lib/proc.mjs";

test("macOS and Linux: plain npx", () => {
  assert.deepEqual(npxSpec(["-y", "x"], { platform: "linux" }), { cmd: "npx", args: ["-y", "x"] });
  assert.deepEqual(npxSpec(["-y", "x"], { platform: "darwin" }), { cmd: "npx", args: ["-y", "x"] });
});
test("Windows: node runs npx-cli.js directly, no shell, paths with spaces and Hangul untouched", () => {
  const execPath = "C:\\Program Files\\nodejs\\node.exe";
  const r = npxSpec(["-y", "lighthouse@12", "http://localhost:4321/"], { platform: "win32", execPath, exists: () => true });
  assert.equal(r.cmd, execPath);
  assert.ok(r.args[0].endsWith("npx-cli.js") && r.args[0].includes("node_modules"));
  assert.deepEqual(r.args.slice(1), ["-y", "lighthouse@12", "http://localhost:4321/"]);
  assert.equal(r.shell, undefined);
});
test("Windows without npx-cli.js: falls back to npx.cmd through a shell", () => {
  const r = npxSpec(["-y", "x"], { platform: "win32", execPath: "C:\\node.exe", exists: () => false });
  assert.deepEqual(r, { cmd: "npx.cmd", args: ["-y", "x"], shell: true });
});
