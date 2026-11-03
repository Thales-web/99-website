import { test } from "node:test";
import assert from "node:assert/strict";
import { similarity, neverHit, checkContent } from "../plugins/99-website/scripts/check-content.mjs";

const A = "송파 싱크대 시트지 시공은 문짝과 상판을 교체 없이 필름으로 바꾸는 작업입니다 프라이머를 먼저 바릅니다 모서리와 절단면에는 두 번 바릅니다";
const B = "방문 시트지 시공은 문짝과 문틀을 교체 없이 필름으로 바꿉니다 화장실문은 습기가 많아 들뜰 수 있습니다 ABS 도어 교체도 비교합니다";

test("Korean similarity: identical text is 1, different pages are low", () => {
  assert.equal(similarity(A, A), 1);
  assert.ok(similarity(A, B) < 0.2);
});
test("Korean never-say phrases are found, with particles attached", () => {
  assert.equal(neverHit("이 업체는 최저가로 시공합니다", "최저가"), true);
  assert.equal(neverHit("무료 견적을 드립니다", "무료 견적"), true);
  assert.equal(neverHit("100% 보장 시공", "100% 보장"), true);
  assert.equal(neverHit("차분한 설명체로 씁니다", "최저가"), false);
});
test("Latin never-say stays whole-word", () => {
  assert.equal(neverHit("we recommend it", "eco"), false);
  assert.equal(neverHit("an eco choice", "eco"), true);
});
test("checkContent flags a Korean never-say phrase and near-duplicate Korean services", () => {
  const mk = (slug, body) => ({ h1: "테스트", description: "가".repeat(80), intro: body, sections: [{ h2: "범위", paragraphs: [body] }], steps: [{}, {}, {}, {}], faqs: [{}, {}, {}], price: "p" });
  const site = { pages: [{ url: "/services/a/", slug: "a", type: "service", keyword: "" }, { url: "/services/b/", slug: "b", type: "service", keyword: "" }] };
  const r = checkContent({ site, contents: { a: mk("a", A + " 최저가"), b: mk("b", A) }, never: ["최저가"] });
  assert.ok(r.errors.some((e) => /never-say/.test(e.message)));
  assert.ok(r.errors.some((e) => /similar/.test(e.message)));
});
