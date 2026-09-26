## Goal
Turn Aniora into a best-in-class SEO surface: install the new brand icons, wire a rich OG image, generate dynamic per-anime metadata + JSON-LD, and ship a proper multi-sitemap index driven by AniList data — so every info/watch page is individually indexable and share-preview-ready.

## 1. Brand assets (icons + manifest)
Copy uploaded files into `public/`:
- `favicon.ico`, `favicon.svg`, `favicon-96x96.png`, `apple-touch-icon.png`
- `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`
- `site.webmanifest` (fix `theme_color` to `#000` matching dark UI, `background_color` `#0a0a0a`)
- `og.png` → `public/og.png` (default share image, 1200×630)

Update `src/routes/__root.tsx` `head().links`:
- `icon` (svg), `icon` (96 png), `shortcut icon` (ico), `apple-touch-icon`, `manifest` → `/site.webmanifest`
- `theme-color` meta = `#000000`
Delete old default `favicon.ico` before writing new one.

## 2. Root-level SEO defaults (`__root.tsx`)
- Title template: `Aniora — Watch Anime Free Online in HD` (home) + child routes override.
- Meta: description, keywords (anime, watch anime, sub, dub, free anime streaming, aniora), robots `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`, `googlebot` same, `format-detection`, `application-name`, `apple-mobile-web-app-title`, `og:site_name=Aniora`, `og:locale=en_US`, `og:type=website`, default `og:image=https://aniora.qzz.io/og.png` (1200×630, with alt), `twitter:card=summary_large_image`, `twitter:site`, hreflang self.
- JSON-LD scripts on root: `WebSite` (with `SearchAction` → `/search?q={query}`) + `Organization` (logo=apple-touch-icon).
- **Move default `og:image` off root** — per rules it belongs on leaves. Keep only `og:site_name` etc. at root; set default og:image on each leaf that lacks a specific one (home, anime index, movies, search, wishlist, history, profile, blog).

## 3. Per-route static metadata
Add `head()` to every route with proper title (≤60), description (≤160), canonical, og:url, og:image (default site og for non-media pages), og:type:
- `/` (WebSite JSON-LD already at root; add ItemList of trending later if useful)
- `/anime` — "Browse Anime — Aniora"
- `/movies` — "Anime Movies — Aniora"
- `/search` — "Search Anime — Aniora", `noindex` when `?q=` present (avoid thin duplicate)
- `/wishlist`, `/history`, `/profile`, `/auth/callback` → `noindex,nofollow`
- `/blog/best-anime-websites` — Article JSON-LD, dedicated cover og:image

## 4. Dynamic per-anime SEO (`/anime/$id`)
Already partial — upgrade:
- Loader already primes AniList; extend `head()`:
  - Title: `${english||romaji} (${year}) — Watch on Aniora`
  - Description: cleaned synopsis 150–158 chars + ellipsis, fallback templated line.
  - Keywords: title variants + genres + `watch <title> online`.
  - og:image = `bannerImage || coverImage.extraLarge`, plus `og:image:width/height/alt`.
  - og:type: `video.tv_show` / `video.movie`.
  - `video:release_date`, `video:duration`, `video:series` when applicable.
  - Canonical + og:url absolute.
  - JSON-LD: `TVSeries`/`Movie` (already partial) + `BreadcrumbList` (Home → Anime → title) + `VideoObject` when trailer exists.
  - Alt title tags via `og:title:alternate` skipped; use `alternateName` in JSON-LD.

## 5. Dynamic per-watch SEO (`/watch/$id`)
- `noindex` the watch route (streaming pages hurt SEO + robots.txt already disallows). Keep rich metadata for social shares only: title `Watch ${title} — Aniora`, description, og:image=banner, og:type=video.episode when `?ep=` present, canonical → info page (`/anime/$id`) to consolidate ranking signal.

## 6. Sitemap overhaul (`/sitemap.xml` → sitemap index)
Replace the static list with a **sitemap index** and multiple child sitemaps, all as TanStack server routes:
- `/sitemap.xml` → `<sitemapindex>` referencing:
  - `/sitemap-pages.xml` — static routes (home, anime, movies, search, blog).
  - `/sitemap-anime.xml` — top ~5000 AniList entries (paginated by AniList `Page(perPage:50)` — fetch top by popularity, TRENDING + POPULARITY sort). Include `<lastmod>`, `<changefreq>weekly`, `<priority>0.7`, and `<image:image>` with cover URL (image sitemap namespace).
  - `/sitemap-movies.xml` — same filtered `format:MOVIE`.
  - `/sitemap-blog.xml` — blog posts.
- Cache with `Cache-Control: public, max-age=21600, s-maxage=86400`.
- Fetch AniList via GraphQL server-side; guard with try/catch → empty urlset on failure (never 500).
- Exclude `/watch/*`, `/profile`, `/wishlist`, `/history`, `/auth/*`.

## 7. `robots.txt`
- Keep `Disallow: /auth/`, `/watch/`; add `/profile`, `/wishlist`, `/history`, `/search?`.
- `Allow: /anime/`, `/movies`, `/blog/`.
- Update `Sitemap:` → `https://aniora.qzz.io/sitemap.xml` (index).
- Add specific bot allowlist (Googlebot, Bingbot, DuckDuckBot, Applebot, GPTBot allow; keep OAI-SearchBot allow).

## 8. Domain constant
The codebase currently mixes `aniora.qzz.io` (correct user domain) and the platform's `anilist-dream-stream.lovable.app` (in project URL notes). Standardize on `https://aniora.qzz.io` everywhere (already done in most files). Add a single `SITE_URL` const in `src/lib/seo.ts` and re-use in all `head()`s, sitemaps, JSON-LD.

## 9. Small perf/SEO wins
- Preconnect to `s4.anilist.co`, `img.anili.st`, `megaplay.buzz` in root head.
- Add `<link rel="alternate" type="application/rss+xml">` for blog (optional, skip if no feed).
- Add `<meta name="rating" content="general">`, `referrer=strict-origin-when-cross-origin`.
- `humans.txt` and update `llms.txt` for AI crawlers with site overview.

## Technical files touched
- `public/*` (new icons, manifest, og.png, robots.txt, llms.txt)
- `src/routes/__root.tsx`
- `src/routes/index.tsx`, `anime.index.tsx`, `movies.tsx`, `search.tsx`, `wishlist.tsx`, `history.tsx`, `profile.tsx`, `auth.callback.tsx`, `blog.best-anime-websites.tsx`, `anime.$id.tsx`, `watch.$id.tsx`
- `src/routes/sitemap[.]xml.ts` (rewrite → index)
- New: `src/routes/sitemap-pages[.]xml.ts`, `sitemap-anime[.]xml.ts`, `sitemap-movies[.]xml.ts`, `sitemap-blog[.]xml.ts`
- New: `src/lib/seo.ts` (SITE_URL, helpers: `buildMeta`, `truncate`, `stripHtml`, `absoluteUrl`)

## Out of scope (ask if needed)
- Submitting to Google Search Console (I can trigger verification via the connector if you want).
- Generating fresh per-anime OG images server-side (heavy; using AniList banner is enough).

Confirm and I'll build it.
