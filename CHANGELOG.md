# Changelog

## 0.1.7 (2026-11-04, launch gates)

- **verify-seo.mjs**: an indexable build now fails when `turnstile_site_key` is empty (the form cannot be submitted) or is a Cloudflare test key (it passes or blocks everything). Staging stays free to use the test pair.
- **Skills**: site-design notes for Windows screenshot paths and for checking which site a preview port serves; deploy-and-connect explains why staging needs the Turnstile test pair.
- Tests: turnstile gate.

## 0.1.6 (2026-11-03, skill frontmatter)

- **seo-foundation**: the description held an unquoted `: ` ("production build: titles, ..."), which a strict YAML parser rejects, so the skill could fail to load in Claude Code. The description is now quoted. The bug was in the first release.
- Test: every `SKILL.md` frontmatter value that contains `: ` or ` #` must be quoted or a block scalar.

## 0.1.5 (2026-11-03, Windows support)

- **doctor.mjs and lighthouse-gate.mjs**: `npx` is started through `lib/proc.mjs` (node runs npx-cli.js directly on Windows). Before, Windows reported "Lighthouse could not run" and a false "wrangler not logged in" on a working machine, and the Lighthouse gate could not start.
- **optimize-images.mjs**: no longer macOS only. It uses cwebp and sips when both exist, otherwise the `sharp` package that `npm install` in `site/` already installs. `optimize()` is now async; `--engine native|sharp` forces one. Fails with a clear message when neither is available.
- **astro-starter**: `npm run build:partial` (cross-env) replaces `PARTIAL=1 npm run build`, which does not work in PowerShell. site-design and site-images skills updated; setup-check has a Windows note.
- Tests: npx helper, sharp engine (run with `SHARP_FROM=<folder with node_modules/sharp>`), missing-sharp message.

## 0.1.4 (2026-11-03, taste-skill v2)

- **site-design**: a section that maps the 99-website overrides onto taste-skill v2 (no dials, scroll scenes off, dealt fonts and photographs ignored, no `assets.mjs`, inspect the production build).

## 0.1.3 (2026-11-03, three consents)

- **Estimate form (Korean law)**: three separate consent checkboxes: collection and use (required), providing to the installer (required, names the recipient), marketing text messages (optional). Each shows purpose, items, retention and the consequence of refusing. New fields: desired timing, home type is optional, area is required.
- **functions/api/contact.js**: requires both required consents and the area, and writes the consent record (three answers and a timestamp) into the lead email.
- **client.md / site.json**: `lead_recipient` and `retention_period` feed the consent text. `verify-seo.mjs` fails an indexable Korean build until both are set (staging stays noindex).
- Tests: contact function, consent gate, site-data keys.

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
