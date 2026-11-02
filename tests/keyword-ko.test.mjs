import { test } from "node:test";
import assert from "node:assert/strict";
import { kwIndex } from "../plugins/99-website/scripts/lib/keyword.mjs";
import { validateSiteMap } from "../plugins/99-website/scripts/validate-sitemap.mjs";

test("Hangul keyword is found in a Korean title", () => {
  assert.equal(kwIndex("송파 방문 시트지 시공 | 방문·문틀·중문 필름", "방문 시트지") >= 0, true);
  assert.equal(kwIndex("개인정보 처리방침", "방문 시트지"), -1);
});
test("English matching is unchanged", () => {
  assert.equal(kwIndex("Door film install Songpa", "door film"), 0);
  assert.equal(kwIndex("Café Résumé", "cafe resume"), 0);
});
test("Korean site map passes the validator", () => {
  const h = "url,slug,page_name,title_tag,page_type,parent,target_keyword,volume,kd,intent,primary_cta,phase,data_source,notes";
  const csv = [h, "/,,홈,송파 인테리어 필름 시공,home,,송파 인테리어 필름,150,,transactional,form,now,manual,",
    "/services/,services,서비스,송파 인테리어 필름 시공 서비스,hub,/,,,,,form,now,manual,",
    "/services/room-door-film/,room-door-film,방문 시트지,송파 방문 시트지 시공,service,/services/,방문 시트지,1990,,transactional,form,now,manual,"].join("\n");
  assert.deepEqual(validateSiteMap(csv).errors, []);
});
