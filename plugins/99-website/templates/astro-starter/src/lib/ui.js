// Every visitor-facing string of the starter lives here, in English and Korean.
// The language comes from client.md `language_code` (site-data.mjs writes it to site.business.language).
// Phone is optional: when it is blank, every call button and call line is hidden.
import site from "../data/site.json";

const b = site.business;
export const lang = String(b.language || "en").toLowerCase().startsWith("ko") ? "ko" : "en";

const en = {
  htmlLang: "en", locale: "en",
  skip: "Skip to content", menu: "Menu",
  navServices: "Services", navAreas: "Areas", navAbout: "About", navContact: "Contact",
  estimateCta: "Get a free estimate", orCall: "or call",
  call: (p) => `Call ${p}`,
  footerServices: "Services", footerAreas: "Areas we serve", privacy: "Privacy policy", terms: "Terms",
  demo: (n) => `Demo business for a tutorial. ${n} is fictional.`,
  crumbs: "Breadcrumb", mobileNav: "Mobile", mainNav: "Main",
  glance: "At a glance", price: "Price", cover: "Cover", estimateLabel: "Estimate", estimateValue: "Free and on site",
  ctaBandHeading: "Ready when you are", ctaBandText: "Tell us about your project and we will come to you.",
  faqHeading: "Questions", faqPre: "Something else on your mind? Call ", faqPost: ".",
  stepsHeading: "How it works", processHeading: "How the job runs", step: (n) => `Step ${n}`,
  relatedHeading: "Often built together", alsoIn: "Also in",
  testimonialsHeading: "What customers say",
  homeServices: "What we build", homeAreas: "Where we work",
  homeAreasText: (c) => `${c} and towns within about 30 miles.`,
  areaServices: (n) => `Services in ${n}`,
  blogBy: (a) => `By ${a}`, blogNeed: "Need this done?", blogSeePre: "See our ", blogSeePost: " service.",
  serviceProcess: "How we do it, step by step", serviceFaq: (n) => `${n}: common questions`,
  serviceFormText: (n) => `Tell us about your ${n.toLowerCase()} project. We call you back within one business day to book a time on site.`,
  contactHeading: "Send us your project",
  notFoundTitle: (n) => `Page not found | ${n}`, notFoundDesc: (n) => `That page does not exist. Go back to the ${n} home page or see our services.`,
  notFoundH1: "Page not found", nf: ["That page does not exist. Try the ", "home page", " or our ", "services", "."],
  thanksTitle: (n) => `Thanks, we got your request | ${n}`, thanksDesc: (n) => `Thanks for your estimate request. ${n} will call you back within one business day.`,
  thanksH1: "Thanks, we got your request", thanksLead: "We call you back within one business day.", thanksPre: "We call you back within one business day. In a hurry? Call ", thanksPost: ".", thanksBack: "Back to the home page",
  llmsLead: (c, p) => `> Serving ${c}.${p ? ` Phone ${p}.` : ""}`, llmsServices: "Services", llmsAreas: "Areas", llmsGuides: "Guides",
  socialOn: (n, l) => `${n} on ${l}`,
  form: {
    heading: "Get a free estimate", text: "Tell us about your yard. We call you back within one business day to book a time on site.",
    call: "Call", email: "Email", hours: "Hours",
    name: "Name", phone: "Phone", emailField: "Email (optional)", town: "Town or neighborhood", housing: "Home type (optional)", none: "Not specified", housingOptions: ["Apartment", "Villa or multi-unit", "House", "Shop or office", "Other"],
    building: "Complex or building name (optional)", service: "What do you need?", other: "Something else", message: "Tell us about the project",
    timing: "When do you want the work done? (optional)", timingOptions: ["This month", "Next month", "In 2 to 3 months", "Not decided yet"],
    photos: "Photos (optional)", photosHelp: "Up to 3 photos, 5 MB each.",
    privacyLink: "Read the full privacy policy",
    consents: ({ recipient, retention }) => [
      { name: "consent_collect", required: true, label: "[Required] I agree to the collection and use of my personal information.",
        rows: [["Purpose", "Receiving this estimate request and connecting you with an installer"], ["Items", "Name, phone, area, service / (optional) email, home type, building name, photos, timing, message"], ["Kept for", retention ? `${retention} from the request date` : "As stated in the privacy policy"]],
        refuse: "You may refuse. If you refuse, we cannot accept the request." },
      { name: "consent_provide", required: true, label: "[Required] I agree to my personal information being provided to an installer.",
        rows: [["Recipient", recipient], ["Purpose of use", "Estimate talks, site check, contract guidance"], ["Items", "Name, phone, area, service / (if entered) email, home type, building name, photos, timing, message"], ["Kept by recipient for", retention ? `${retention} from the date provided` : "As stated in the privacy policy"]],
        refuse: "You may refuse. If you refuse, we cannot connect you with an installer and you cannot receive an estimate." },
      { name: "consent_marketing", required: false, label: "[Optional] I agree to receive text messages about installation news.",
        rows: [["Purpose", "Installation news by text message"], ["Items", "Name, phone"], ["Kept for", retention ? `Until you withdraw, at most ${retention} from the request date` : "Until you withdraw"]],
        refuse: "You can still request an estimate if you do not agree." },
    ],
    submit: "Get a free estimate", honeypot: "Leave empty",
  },
};

const ko = {
  htmlLang: "ko", locale: "ko_KR",
  skip: "본문 바로가기", menu: "메뉴",
  navServices: "서비스", navAreas: "시공 지역", navAbout: "소개", navContact: "견적 문의",
  estimateCta: "사진으로 견적 받기", orCall: "전화",
  call: (p) => `전화 ${p}`,
  footerServices: "서비스", footerAreas: "시공 지역", privacy: "개인정보 처리방침", terms: "이용 안내",
  demo: (n) => `튜토리얼용 데모 사업체입니다. ${n}은(는) 가상의 업체입니다.`,
  crumbs: "현재 위치", mobileNav: "모바일 메뉴", mainNav: "주 메뉴",
  glance: "한눈에 보기", price: "가격", cover: "시공 범위", estimateLabel: "견적", estimateValue: "사진을 보내 주시면 확인 후 안내",
  ctaBandHeading: "견적이 필요하신가요", ctaBandText: "시공할 곳의 사진과 상황을 보내 주시면 확인 후 안내드립니다.",
  faqHeading: "자주 묻는 질문", faqPre: "다른 궁금한 점은 전화로 문의해 주세요: ", faqPost: "",
  stepsHeading: "진행 순서", processHeading: "시공 과정", step: (n) => `${n}단계`,
  relatedHeading: "함께 많이 하는 시공", alsoIn: "다른 지역",
  testimonialsHeading: "고객 후기",
  homeServices: "시공 서비스", homeAreas: "시공 지역",
  homeAreasText: (c) => `${c} 안에서 시공합니다. 생활권별 안내를 확인해 보세요.`,
  areaServices: (n) => `${n} 시공 서비스`,
  blogBy: (a) => `작성: ${a}`, blogNeed: "시공이 필요하신가요?", blogSeePre: "", blogSeePost: " 서비스 안내 보기",
  serviceProcess: "시공 순서", serviceFaq: (n) => `${n} 자주 묻는 질문`,
  serviceFormText: (n) => `${n} 시공할 곳의 상황을 알려 주세요. 사진과 함께 보내 주시면 확인 후 연락드립니다.`,
  contactHeading: "견적 신청",
  notFoundTitle: (n) => `페이지를 찾을 수 없습니다 | ${n}`, notFoundDesc: (n) => `요청하신 페이지가 없습니다. ${n} 홈 또는 서비스 안내로 이동해 주세요.`,
  notFoundH1: "페이지를 찾을 수 없습니다", nf: ["요청하신 페이지가 없습니다. ", "홈", " 또는 ", "서비스", " 안내에서 찾아보세요."],
  thanksTitle: (n) => `견적 문의가 접수되었습니다 | ${n}`, thanksDesc: (n) => `견적 문의가 접수되었습니다. ${n}에서 확인 후 연락드립니다.`,
  thanksH1: "견적 문의가 접수되었습니다", thanksLead: "확인 후 연락드리겠습니다.", thanksPre: "확인 후 연락드리겠습니다. 급하신 경우 전화: ", thanksPost: "", thanksBack: "홈으로 돌아가기",
  llmsLead: (c, p) => `> 서비스 지역: ${c}.${p ? ` 전화 ${p}.` : ""}`, llmsServices: "서비스", llmsAreas: "시공 지역", llmsGuides: "가이드",
  socialOn: (n, l) => `${n} ${l}`,
  form: {
    heading: "사진으로 견적 받기", text: "시공할 곳의 상황과 사진을 보내 주세요. 확인 후 연락드립니다.",
    call: "전화", email: "이메일", hours: "운영 시간",
    name: "이름", phone: "휴대전화 번호", emailField: "이메일 (선택)", town: "시공할 동네 (동 이름)", housing: "주거 형태 (선택)", none: "선택 안 함", housingOptions: ["아파트", "빌라·다세대·연립", "단독·다가구주택", "상가·사무실", "기타"],
    building: "단지 또는 건물 이름 (선택)", service: "어떤 시공이 필요하세요?", other: "그 외 또는 잘 모르겠음", message: "시공 상황을 알려 주세요",
    timing: "희망 시공 시기 (선택)", timingOptions: ["이번 달", "다음 달", "2~3개월 뒤", "아직 정하지 않음"],
    photos: "사진 (선택)", photosHelp: "시공할 부위를 정면과 모서리까지 찍어 주세요. 최대 3장, 장당 5MB.",
    privacyLink: "개인정보 처리방침 전문 보기",
    consents: ({ recipient, retention }) => [
      { name: "consent_collect", required: true, label: "[필수] 개인정보 수집·이용에 동의합니다.",
        rows: [["목적", "견적 문의 접수와 시공 업체 연결"], ["항목", "이름, 휴대전화 번호, 시공할 동네, 시공 부위 / (선택) 이메일, 주거 형태, 단지·건물 이름, 사진, 시공 시기, 문의 내용"], ["보유 기간", retention ? `문의 접수일부터 ${retention}` : "개인정보 처리방침에 따름"]],
        refuse: "동의를 거부할 수 있습니다. 거부하면 견적 문의를 접수할 수 없습니다." },
      { name: "consent_provide", required: true, label: "[필수] 개인정보를 시공 업체에 제공하는 것에 동의합니다.",
        rows: [["제공받는 자", recipient], ["이용 목적", "견적 상담, 현장 확인, 시공 계약 안내"], ["제공 항목", "이름, 휴대전화 번호, 시공할 동네, 시공 부위 / (입력한 경우) 이메일, 주거 형태, 단지·건물 이름, 사진, 시공 시기, 문의 내용"], ["제공받는 자의 보유 기간", retention ? `제공일부터 ${retention}` : "개인정보 처리방침에 따름"]],
        refuse: "동의를 거부할 수 있습니다. 거부하면 시공 업체에 연결할 수 없어 견적을 받을 수 없습니다." },
      { name: "consent_marketing", required: false, label: "[선택] 시공 관련 소식 문자 수신에 동의합니다.",
        rows: [["목적", "시공 관련 소식 안내(문자)"], ["항목", "이름, 휴대전화 번호"], ["보유 기간", retention ? `동의를 철회할 때까지, 길어도 문의 접수일부터 ${retention}` : "동의를 철회할 때까지"]],
        refuse: "동의하지 않아도 견적 문의를 할 수 있습니다." },
    ],
    submit: "견적 문의 보내기", honeypot: "비워 두세요",
  },
};

export const t = lang === "ko" ? ko : en;

// Who receives the lead and how long data is kept: both come from client.md (lead_recipient, retention_period).
// With no recipient yet, the consent text names no company ("the installer we connect you with"), and verify-seo
// refuses an indexable Korean build until lead_recipient and retention_period are set.
export const consentContext = {
  recipient: b.lead_recipient || (lang === "ko" ? "연결되는 송파 지역 시공 업체" : "the installer we connect you with"),
  retention: b.retention_period || "",
};

// "tel:" link, or "" when there is no phone number.
export const telHref = (p) => (p && String(p).replace(/[^+\d]/g, "") ? `tel:${String(p).replace(/[^+\d]/g, "")}` : "");

// Template links follow the site map, not fixed paths: /estimate/ may be the contact page, /about/ may not exist.
const find = (type) => site.pages.find((p) => p.type === type);
export const contactUrl = find("contact")?.url ?? "/contact/";
export const aboutUrl = find("about")?.url;
export const servicesHubUrl = site.pages.find((p) => p.type === "hub" && p.url === "/services/")?.url;
export const areasHubUrl = site.pages.find((p) => p.type === "hub" && p.url === "/areas-served/")?.url ?? "/areas-served/";
export const privacyUrl = site.pages.find((p) => p.type === "legal" && /privacy/.test(p.url))?.url ?? "/privacy-policy/";
export const termsUrl = site.pages.find((p) => p.type === "legal" && /terms/.test(p.url))?.url;
