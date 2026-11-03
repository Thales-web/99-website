import { test } from "node:test";
import assert from "node:assert/strict";
import { handleContact } from "../plugins/99-website/templates/astro-starter/functions/api/contact.js";

const fd = (o = {}) => { const f = new FormData(); for (const [k, v] of Object.entries({ name: "김하나", phone: "010-0000-0000", email: "", town: "잠실동", housing: "아파트", building: "", service: "싱크대 필름 시공", message: "상판이 들떴어요", consent_collect: "yes", consent_provide: "yes", timing: "다음 달", "cf-turnstile-response": "tok", company_website: "", ...o })) if (v !== undefined) f.append(k, v); return f; };
const env = { TURNSTILE_SECRET: "s", RESEND_API_KEY: "k", LEAD_TO: "to@x.example", LEAD_FROM: "site@x.example" };
const fetchOk = (calls) => async (url, init) => { calls.push({ url, body: String(init.body) }); return new Response(JSON.stringify({ success: true, id: "1" }), { status: 200 }); };
const img = (name, bytes = 10, type = "image/jpeg") => new File([new Uint8Array(bytes)], name, { type });

test("정상 문의: 보안 확인 후 메일 1통, /thanks/로 이동", async () => {
  const calls = [];
  const r = await handleContact({ form: fd(), env, fetchFn: fetchOk(calls), ip: "1.1.1.1" });
  assert.equal(r.status, 303); assert.equal(r.location, "/thanks/");
  assert.equal(calls.length, 2); assert.match(calls[1].url, /api\.resend\.com/);
  const mail = JSON.parse(calls[1].body);
  assert.match(mail.subject, /새 견적 문의: 싱크대 필름 시공/);
  assert.match(mail.html, /주거 형태/); assert.match(mail.html, /아파트/); assert.match(mail.html, /잠실동/);
  assert.equal(mail.attachments, undefined);
});
test("수집·이용 동의 없음: 400, 아무것도 보내지 않음", async () => {
  const calls = [];
  const r = await handleContact({ form: fd({ consent_collect: undefined }), env, fetchFn: fetchOk(calls) });
  assert.equal(r.status, 400); assert.match(r.body, /동의/); assert.equal(calls.length, 0);
});
test("시공 업체 제공 동의 없음: 400, 아무것도 보내지 않음", async () => {
  const calls = [];
  const r = await handleContact({ form: fd({ consent_provide: undefined }), env, fetchFn: fetchOk(calls) });
  assert.equal(r.status, 400); assert.match(r.body, /필수 동의/); assert.equal(calls.length, 0);
});
test("홍보 문자 동의는 선택: 없어도 접수, 메일에 아니오로 기록", async () => {
  const calls = [];
  const r = await handleContact({ form: fd(), env, fetchFn: fetchOk(calls) });
  assert.equal(r.status, 303);
  const html = JSON.parse(calls[1].body).html;
  assert.match(html, /홍보 문자 수신 동의: 아니오/);
  assert.match(html, /수집·이용 동의: 예 \/ 시공 업체 제공 동의: 예/);
  assert.match(html, /동의 일시: \d{4}-\d{2}-\d{2}T/);
});
test("홍보 문자 동의 체크: 메일에 예로 기록", async () => {
  const calls = [];
  await handleContact({ form: fd({ consent_marketing: "yes" }), env, fetchFn: fetchOk(calls) });
  assert.match(JSON.parse(calls[1].body).html, /홍보 문자 수신 동의: 예/);
});
test("시공할 동네 없음: 400", async () => {
  const r = await handleContact({ form: fd({ town: "" }), env, fetchFn: fetchOk([]) });
  assert.equal(r.status, 400); assert.match(r.body, /시공할 동네/);
});
test("시공 시기가 메일에 들어간다", async () => {
  const calls = [];
  await handleContact({ form: fd(), env, fetchFn: fetchOk(calls) });
  assert.match(JSON.parse(calls[1].body).html, /희망 시공 시기<\/b>: 다음 달/);
});
test("honeypot 입력: 400", async () => {
  const calls = [];
  assert.equal((await handleContact({ form: fd({ company_website: "spam.com" }), env, fetchFn: fetchOk(calls) })).status, 400);
  assert.equal(calls.length, 0);
});
test("이름 또는 연락처 없음: 400, 한국어 안내", async () => {
  const r = await handleContact({ form: fd({ phone: "" }), env, fetchFn: fetchOk([]) });
  assert.equal(r.status, 400); assert.match(r.body, /이름, 휴대전화 번호/);
});
test("Turnstile 토큰 없음: 400", async () => {
  assert.equal((await handleContact({ form: fd({ "cf-turnstile-response": "" }), env, fetchFn: fetchOk([]) })).status, 400);
});
test("사진 2장: 첨부로 전송", async () => {
  const f = fd(); f.append("photos", img("a.jpg")); f.append("photos", img("b.png", 20, "image/png"));
  const calls = [];
  const r = await handleContact({ form: f, env, fetchFn: fetchOk(calls) });
  assert.equal(r.status, 303);
  const mail = JSON.parse(calls[1].body);
  assert.equal(mail.attachments.length, 2); assert.equal(mail.attachments[0].filename, "a.jpg"); assert.ok(mail.attachments[0].content.length > 0);
  assert.match(mail.html, /첨부 사진: 2장/);
});
test("사진 4장: 400", async () => {
  const f = fd(); for (let i = 0; i < 4; i++) f.append("photos", img(`${i}.jpg`));
  const calls = [];
  const r = await handleContact({ form: f, env, fetchFn: fetchOk(calls) });
  assert.equal(r.status, 400); assert.match(r.body, /최대 3장/); assert.equal(calls.length, 0);
});
test("5MB 초과 사진: 400", async () => {
  const f = fd(); f.append("photos", img("big.jpg", 5 * 1024 * 1024 + 1));
  const r = await handleContact({ form: f, env, fetchFn: fetchOk([]) });
  assert.equal(r.status, 400); assert.match(r.body, /5MB/);
});
test("이미지가 아닌 파일: 400", async () => {
  const f = fd(); f.append("photos", img("x.pdf", 10, "application/pdf"));
  assert.equal((await handleContact({ form: f, env, fetchFn: fetchOk([]) })).status, 400);
});
test("빈 파일 입력(사진 선택 안 함): 첨부 없이 정상", async () => {
  const f = fd(); f.append("photos", new File([], "", { type: "application/octet-stream" }));
  const calls = [];
  assert.equal((await handleContact({ form: f, env, fetchFn: fetchOk(calls) })).status, 303);
  assert.equal(JSON.parse(calls[1].body).attachments, undefined);
});
test("Resend 장애: 502, 전화 안내 포함", async () => {
  let n = 0;
  const f = async () => (++n === 1 ? new Response(JSON.stringify({ success: true })) : new Response("x", { status: 500 }));
  const r = await handleContact({ form: fd(), env: { ...env, PHONE: "02-000-0000" }, fetchFn: f });
  assert.equal(r.status, 502); assert.match(r.body, /02-000-0000/);
});
test("LOG_ONLY: 메일 없이 이동", async () => {
  const calls = [];
  const r = await handleContact({ form: fd(), env: { ...env, LOG_ONLY: "1" }, fetchFn: fetchOk(calls) });
  assert.equal(r.status, 303); assert.equal(calls.length, 1);
});
test("LANG=en: 영어 메시지", async () => {
  const r = await handleContact({ form: fd({ consent_provide: undefined }), env: { ...env, LANG: "en" }, fetchFn: fetchOk([]) });
  assert.match(r.body, /both required consents/);
});
test("Map 형태 폼(getAll 없음)도 동작", async () => {
  const m = new Map(Object.entries({ name: "A", phone: "1", town: "잠실동", consent_collect: "yes", consent_provide: "yes", "cf-turnstile-response": "t" }));
  assert.equal((await handleContact({ form: m, env, fetchFn: fetchOk([]) })).status, 303);
});
