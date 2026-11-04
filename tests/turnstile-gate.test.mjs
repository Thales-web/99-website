import { test } from "node:test";
import assert from "node:assert/strict";
import { turnstileFailures } from "../plugins/99-website/scripts/verify-seo.mjs";

const site = (noindex, key) => ({ noindex, business: { turnstile_site_key: key } });

test("staging never fails, test key or not", () => {
  assert.deepEqual(turnstileFailures(site(true, "")), []);
  assert.deepEqual(turnstileFailures(site(true, "1x00000000000000000000AA")), []);
});
test("indexable build with no key fails: the form cannot be submitted", () => {
  const f = turnstileFailures(site(false, ""));
  assert.equal(f.length, 1); assert.match(f[0], /cannot be submitted/);
});
test("indexable build with any Cloudflare test key fails", () => {
  for (const k of ["1x00000000000000000000AA", "2x00000000000000000000AB", "3x00000000000000000000FF"]) assert.equal(turnstileFailures(site(false, k)).length, 1, k);
});
test("indexable build with a real-looking key passes", () => {
  assert.deepEqual(turnstileFailures(site(false, "0x4AAAAAAABkMYinukE8nzYS")), []);
});
