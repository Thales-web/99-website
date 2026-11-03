import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "../plugins/99-website/skills");
const skills = fs.readdirSync(root).filter((d) => fs.existsSync(path.join(root, d, "SKILL.md")));

// A strict YAML parser rejects an unquoted value that contains ": " or " #". Claude Code can then fail to load the skill.
test("every SKILL.md has name and description, and plain values hold no ': ' or ' #'", () => {
  assert.ok(skills.length >= 11);
  for (const d of skills) {
    const text = fs.readFileSync(path.join(root, d, "SKILL.md"), "utf8");
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    assert.ok(m, `${d}: no frontmatter`);
    const kv = Object.fromEntries(m[1].split(/\r?\n/).map((l) => l.match(/^([a-z-]+):\s*(.*)$/)).filter(Boolean).map((x) => [x[1], x[2]]));
    assert.equal(kv.name, d, `${d}: name must match the folder`);
    assert.ok(kv.description, `${d}: description missing`);
    for (const [k, v] of Object.entries(kv)) {
      if (/^["'>|]/.test(v)) continue;
      assert.ok(!/: | #/.test(v), `${d}: unquoted ${k} contains ": " or " #": ${v.slice(0, 60)}`);
    }
  }
});
test("the seo-foundation regression: description is quoted", () => {
  const t = fs.readFileSync(path.join(root, "seo-foundation/SKILL.md"), "utf8");
  assert.match(t, /^description: ".+"$/m);
});
