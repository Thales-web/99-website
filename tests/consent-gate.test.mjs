import { test } from "node:test";
import assert from "node:assert/strict";
import { consentFailures } from "../plugins/99-website/scripts/verify-seo.mjs";

const site = (noindex, b) => ({ noindex, business: { language: "ko", ...b } });

test("indexable Korean build without recipient and retention fails twice", () => {
  assert.equal(consentFailures(site(false, {})).length, 2);
});
test("indexable Korean build with both set passes", () => {
  assert.deepEqual(consentFailures(site(false, { lead_recipient: "테스트시공", retention_period: "1년" })), []);
});
test("staging (noindex) never fails", () => {
  assert.deepEqual(consentFailures(site(true, {})), []);
});
test("English sites are not affected", () => {
  assert.deepEqual(consentFailures({ noindex: false, business: { language: "en" } }), []);
});
