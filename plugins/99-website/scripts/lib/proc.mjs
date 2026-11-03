// Run Node tools the same way on macOS, Linux and Windows.
// On Windows "npx" is npx.cmd, and Node refuses to start a .cmd file without a shell (error EINVAL or ENOENT),
// so doctor and the Lighthouse gate reported "could not run" on a working machine. Start npx's own JS file with
// the running node instead; no shell, so paths with spaces or Hangul stay intact.
import fs from "node:fs";
import path from "node:path";

export function npxSpec(args, { platform = process.platform, execPath = process.execPath, exists = fs.existsSync } = {}) {
  if (platform !== "win32") return { cmd: "npx", args };
  const cli = path.join(path.dirname(execPath), "node_modules", "npm", "bin", "npx-cli.js");
  if (exists(cli)) return { cmd: execPath, args: [cli, ...args] };
  return { cmd: "npx.cmd", args, shell: true };
}
