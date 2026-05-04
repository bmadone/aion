# Plan: SEO — Organic Discoverability & Metadata

> Source PRD: https://github.com/bmadone/Aion/issues/2

## Architectural decisions

- **Single entry point**: All SEO metadata lives in `index.html` — there is no SSR, no routing, no per-page head management.
- **Canonical URL**: Injected via `VITE_CANONICAL_URL` environment variable so it survives a domain migration without touching HTML.
- **Static files**: `robots.txt` and `sitemap.xml` are plain files under `/public/` — Vite copies them to `dist/` as-is.
- **No OG image**: Deferred to a future iteration; social cards will render text-only previews.

---

## Phase 1: Search foundation

**User stories**: 1, 2, 3, 4, 5, 9, 10, 11, 13, 14

### What to build

Wire up the env variable for the canonical URL and use it in a `<link rel="canonical">` tag. Rewrite the `<title>` to lead with keywords and communicate the no-ads/no-tracking positioning (~60 chars). Rewrite `<meta name="description">` to ~155 characters covering HIIT, Tabata, EMOM, AMRAP, and the "just train" angle. Add `robots.txt` that permits all crawlers and references the sitemap. Add `sitemap.xml` with a single entry pointing to the canonical URL.

### Acceptance criteria

- [ ] `VITE_CANONICAL_URL` env var is documented (e.g. in `.env.example`) and set in Vercel project settings
- [ ] `<link rel="canonical">` is present in `dist/index.html` with the production URL
- [ ] `<title>` is ~60 chars, leads with "Aion", includes "interval timer" and the no-ads positioning
- [ ] `<meta name="description">` is ~155 chars and mentions HIIT, Tabata, EMOM, AMRAP
- [ ] `dist/robots.txt` exists, allows all crawlers, and references the sitemap URL
- [ ] `dist/sitemap.xml` exists and contains a valid `<url>` entry with the canonical URL
- [ ] Google Search Console can fetch and render the page without errors

---

## Phase 2: Social sharing

**User stories**: 6, 7, 8

### What to build

Add Open Graph and Twitter Card meta tags to `index.html` so that pasting the link into Discord, Slack, Twitter/X, or iMessage renders a named, described card rather than a blank unfurl. Tags reuse the same title and description from Phase 1; `og:url` uses the canonical URL env var.

### Acceptance criteria

- [ ] `og:title`, `og:description`, `og:type` (website), `og:url` are present in `dist/index.html`
- [ ] `twitter:card` (summary), `twitter:title`, `twitter:description` are present in `dist/index.html`
- [ ] Meta Sharing Debugger (Facebook) shows correct title and description for the production URL
- [ ] Pasting the link in Discord/Slack renders a named card with the description

---

## Phase 3: Structured data

**User stories**: 12

### What to build

Add a `<script type="application/ld+json">` block to `index.html` describing Aion as a `WebApplication`. Include `name`, `description`, `url` (canonical), `applicationCategory: "HealthApplication"`, `operatingSystem: "Web Browser"`, and `offers` with `price: "0"` to signal it is free.

### Acceptance criteria

- [ ] JSON-LD block is present and valid in `dist/index.html`
- [ ] Google's Rich Results Test reports no errors for the production URL
- [ ] `@type` is `WebApplication`, `applicationCategory` is `HealthApplication`, price is `0`
