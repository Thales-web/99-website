# Changelog

## 0.1.2 (2026-11-03, Korean checks)

- **check-content.mjs**: the 50% similarity check now reads Hangul (it was always 0 for Korean text), and never-say phrases with non-ASCII letters match as substrings (`\b` is ASCII-only, so Korean phrases were never found). Latin phrases keep whole-word matching.
- **astro-starter**: Open Graph tags, optional `naver_site_verification` meta, system Hangul font stack (no web font), blog Article author type from `author_type` (Person or Organization).
- **site-data.mjs**: writes `naver_site_verification` and `author_type` to `site.json`. `client.md` template gets both keys.
- **Skills**: a "Korean sites" section in site-design, site-images, astro-build, auto-fix, seo-foundation, deploy-and-connect and gbp-sync (fonts, line length, 어절 counts, legal pages, Naver Search Advisor, Naver Place).
- Tests: Hangul similarity and never-say, site-data and schema keys.

## 0.1.1 (2026-11-03, Korean localization)

- **astro-starter**: every visitor-facing string moved to `src/lib/ui.js` (English and Korean). The language follows `language_code` in `client.md`; `site-data.mjs` now writes it to `site.json` as `business.language` (default `en`, so existing English sites do not change).
- **Estimate form**: new fields (home type, building name, photos up to 3 x 5 MB) and a required privacy consent checkbox. `functions/api/contact.js` checks consent, validates and attaches photos, and answers in Korean unless `LANG=en`.
- **Layout and links**: `<html lang>`, `og:locale`, schema `inLanguage`, Hangul font stack and word-based line breaks. Header and CTA links follow the site map (contact page may be `/estimate/`). Call buttons and call lines are hidden when `phone` is blank.
- **keyword.mjs**: keyword matching now works for non-Latin text (Hangul), so `validate-sitemap.mjs` no longer rejects every Korean title. English matching is unchanged.
- Tests: Korean form and keyword tests added; the English contact test now sends `consent`.

## 0.1.0 (2026-09-29, Stage 1)

Tested end to end on two sites: a real rebuild (myinclusion.com.au, NDIS, Australia) and a fictional new build (Cedar & Stone Landscapes, Charlotte NC).

- **setup-check**: local checks (Node, Cloudflare login, Lighthouse, Chrome, keys, design skills) plus DataWise, DataForSEO, kie.ai key and treg connection checks. Picks the keyword data path (DataWise, DataForSEO or manual) and saves `.99-website/setup.json`.
- **business-intake**: new build (one-question-at-a-time interview) or rebuild (crawl the old site, pull Search Console through DataWise, ask only the gaps in one list). Treats old site copy and notes as claims, flags testimonials, ratings and years claims, sensitive-niche rules (NDIS), demo-business mode. Ends at Checkpoint 1.
- **keyword-sitemap**: seeds from services and GSC queries, DataWise `suggestions` + metrics, live SERP reads, a 4-part publication gate, one keyword per page, rebuilds keep URLs that already rank, blog plan, redirect map. Ends at Checkpoint 2.
- Scripts (zero dependencies, `node:test`): `doctor.mjs`, `site-init.mjs`, `confirm-count.mjs`, `crawl.mjs`, `validate-sitemap.mjs` (with `--crawl` for rebuilds), `validate-redirects.mjs`, `lib/csv.mjs`.
