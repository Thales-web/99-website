import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSiteData } from "../plugins/99-website/scripts/site-data.mjs";
import { graphFor } from "../plugins/99-website/templates/astro-starter/src/lib/schema.js";

const csv = "url,slug,page_name,title_tag,page_type,parent,target_keyword,volume,kd,intent,primary_cta,phase,data_source,notes\n/,,홈,송파 인테리어 필름 시공,home,,송파 인테리어 필름,150,,transactional,form,now,manual,\n";
const md = (extra) => `---\nbusiness_name: 테스트\nlanguage_code: ko\nhome_city: 서울 송파구\n${extra}---\n`;

test("language_code, naver verification and author type reach site.json", () => {
  const d = buildSiteData({ siteMapCsv: csv, clientMd: md("naver_site_verification: abc123   # from Search Advisor\nauthor_type: Organization\n"), siteUrl: "https://x.example" });
  assert.equal(d.business.language, "ko");
  assert.equal(d.business.naver_site_verification, "abc123");
  assert.equal(d.business.author_type, "Organization");
});
test("defaults: English, no verification, Person author", () => {
  const d = buildSiteData({ siteMapCsv: csv, clientMd: "---\nbusiness_name: X\n---\n", siteUrl: "https://x.example" });
  assert.equal(d.business.language, "en");
  assert.equal(d.business.naver_site_verification, "");
  assert.equal(d.business.author_type, "Person");
});
test("blog Article author follows author_type", () => {
  const mk = (author_type) => {
    const site = { site_url: "https://x.example", business: { name: "테스트", language: "ko", author_type, home_city: "서울 송파구" }, nav: { areas: [] } };
    const page = { url: "/blog/a/", slug: "a", type: "blog", page_name: "글", title: "글 | 테스트", parent: "/blog/" };
    const pages = [{ url: "/blog/", page_name: "블로그", parent: "/" }, { url: "/", page_name: "홈" }, page];
    const g = graphFor({ site, page, content: { h1: "글", author: "송파 인테리어 필름 편집팀", date: "2026-11-03" }, pages });
    return g["@graph"].find((n) => n["@type"] === "Article");
  };
  assert.equal(mk("Organization").author["@type"], "Organization");
  assert.equal(mk("Person").author["@type"], "Person");
  assert.equal(mk("Organization").author.name, "송파 인테리어 필름 편집팀");
});
test("schema inLanguage follows the language", () => {
  const site = { site_url: "https://x.example", business: { name: "테스트", language: "ko" }, nav: { areas: [] } };
  const page = { url: "/", type: "home", page_name: "홈", title: "홈" };
  const g = graphFor({ site, page, content: {}, pages: [page] });
  assert.equal(g["@graph"].find((n) => n["@type"] === "WebSite").inLanguage, "ko-KR");
});
