// Cloudflare Pages Function: POST /api/contact. Honeypot, required fields, consents, Turnstile, then one email through Resend.
// Consents (separate checkboxes): consent_collect and consent_provide are required, consent_marketing is optional.
// Env: TURNSTILE_SECRET, RESEND_API_KEY, LEAD_TO, LEAD_FROM, PHONE, LOG_ONLY ("1" = no email, for demos), LANG ("en" for English messages; Korean by default).
// Photos (optional): up to 3 images, 5 MB each, sent as email attachments.
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const TEXT = {
  ko: {
    bad: "요청을 처리할 수 없습니다.", needFields: "이름, 휴대전화 번호, 시공할 동네를 입력해 주세요.", needConsent: "필수 동의 항목(개인정보 수집·이용, 시공 업체 제공)에 모두 동의해 주세요.",
    needCheck: "보안 확인을 완료한 뒤 다시 시도해 주세요.", tooMany: `사진은 최대 ${MAX_PHOTOS}장까지 보낼 수 있습니다.`,
    tooBig: "사진은 장당 5MB 이하만 보낼 수 있습니다.", notImage: "사진 파일(이미지)만 첨부할 수 있습니다.",
    failed: (p) => `죄송합니다. 문의가 전송되지 않았습니다. 잠시 뒤 다시 시도해 주세요.${p ? ` 전화: ${p}` : ""}`,
    subject: (s) => `새 견적 문의: ${s || "웹사이트"}`,
    labels: { name: "이름", phone: "휴대전화 번호", email: "이메일", town: "시공할 동네", housing: "주거 형태", building: "단지·건물 이름", service: "시공 부위", timing: "희망 시공 시기", message: "문의 내용" },
    consentLine: (m, at) => `수집·이용 동의: 예 / 시공 업체 제공 동의: 예 / 홍보 문자 수신 동의: ${m ? "예" : "아니오"} / 동의 일시: ${at}`, consentLabel: "동의 기록",
    photos: (n) => `첨부 사진: ${n}장`,
  },
  en: {
    bad: "Bad request", needFields: "Please add your name, phone number and area.", needConsent: "Please agree to both required consents (collection and use, and providing to an installer).",
    needCheck: "Please complete the check and try again.", tooMany: `You can send up to ${MAX_PHOTOS} photos.`,
    tooBig: "Each photo must be 5 MB or smaller.", notImage: "Only image files can be attached.",
    failed: (p) => `Sorry, the form did not send. Please call us${p ? ` on ${p}` : ""}.`,
    subject: (s) => `New estimate request: ${s || "website"}`,
    labels: { name: "name", phone: "phone", email: "email", town: "town", housing: "home type", building: "building", service: "service", timing: "timing", message: "message" },
    consentLine: (m, at) => `Collection and use: yes / Provided to installer: yes / Marketing texts: ${m ? "yes" : "no"} / Consented at: ${at}`, consentLabel: "consent record",
    photos: (n) => `Attached photos: ${n}`,
  },
};

// Chunked so a 5 MB file does not overflow the call stack. Works in Workers and Node.
async function toBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export async function handleContact({ form, env, fetchFn = fetch, ip = "" }) {
  const M = TEXT[env.LANG === "en" ? "en" : "ko"];
  const get = (k) => String(form.get(k) ?? "").trim();
  if (get("company_website")) return { status: 400, body: M.bad };
  if (!get("name") || !get("phone") || !get("town")) return { status: 400, body: M.needFields };
  if (get("consent_collect") !== "yes" || get("consent_provide") !== "yes") return { status: 400, body: M.needConsent };
  const marketing = get("consent_marketing") === "yes";

  const photos = (typeof form.getAll === "function" ? form.getAll("photos") : []).filter((f) => typeof f === "object" && f && f.size > 0);
  if (photos.length > MAX_PHOTOS) return { status: 400, body: M.tooMany };
  for (const p of photos) {
    if (!String(p.type).startsWith("image/")) return { status: 400, body: M.notImage };
    if (p.size > MAX_PHOTO_BYTES) return { status: 400, body: M.tooBig };
  }

  const token = get("cf-turnstile-response");
  if (!token) return { status: 400, body: M.needCheck };
  const ts = await fetchFn("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
  });
  if (!(await ts.json()).success) return { status: 400, body: M.needCheck };

  const keys = ["name", "phone", "email", "town", "housing", "building", "service", "timing", "message"];
  const consentedAt = new Date().toISOString();
  const lead = keys.map((k) => `<p><b>${esc(M.labels[k])}</b>: ${esc(get(k))}</p>`).join("") + (photos.length ? `<p>${esc(M.photos(photos.length))}</p>` : "") + `<p><b>${esc(M.consentLabel)}</b>: ${esc(M.consentLine(marketing, consentedAt))}</p>`;
  if (env.LOG_ONLY === "1") { console.log("lead (LOG_ONLY)", get("service"), `photos=${photos.length}`); return { status: 303, location: "/thanks/" }; }

  const attachments = [];
  for (const p of photos) attachments.push({ filename: String(p.name || "photo").replace(/[^\w.\-가-힣]+/g, "_"), content: await toBase64(p) });

  const r = await fetchFn("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.LEAD_FROM, to: env.LEAD_TO, reply_to: get("email") || undefined, subject: M.subject(get("service")), html: lead, ...(attachments.length && { attachments }) }),
  });
  if (!r.ok) return { status: 502, body: M.failed(env.PHONE) };
  return { status: 303, location: "/thanks/" };
}

export async function onRequestPost({ request, env }) {
  const r = await handleContact({ form: await request.formData(), env, ip: request.headers.get("CF-Connecting-IP") ?? "" });
  return r.location ? Response.redirect(new URL(r.location, request.url), 303) : new Response(r.body, { status: r.status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
