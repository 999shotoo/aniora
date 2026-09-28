# Aniora — Free Indexing & Growth Plan

Goal: get **aniora.qzz.io** indexed by Google/Bing/DuckDuckGo and pull steady free traffic **without ongoing effort**. Set it once, forget it.

## Timeline (realistic)

| Phase | When | What happens |
| --- | --- | --- |
| Discovery | 3 – 14 days | Bots find the sitemap via `robots.txt`, start crawling. |
| Partial indexing | 2 – 4 weeks | Homepage + a handful of anime/movie pages appear for brand searches. |
| Full indexing | 1 – 3 months | Long-tail queries ("watch <anime> sub aniora") start ranking. |
| Compounding | 3 – 6 months+ | Backlinks + repeat visitors push authority; traffic snowballs. |

Skipping Search Console **does not stop indexing** — it only removes the "submit + inspect" shortcut. Everything below still works.

---

## One-time setup (already done ✅)

- `robots.txt` allows all crawlers and points to sitemap
- `/sitemap.xml` served dynamically with anime/movies/blog/pages
- Canonical URLs on every route
- Dynamic OG image (`img.anili.st/media/{id}`) + JSON-LD (`TVSeries`, `Movie`, `BreadcrumbList`)
- LCP-optimized hero, WCAG-AA contrast
- PWA manifest + full icon set
- SSR head metadata (crawlers see per-page titles)

---

## Zero-effort growth (do once, walk away)

1. **Post the domain in 4 places**, then never touch it again. One backlink from each is enough for Google to discover you within days:
   - Your own social bio (Twitter/X, Bluesky, Discord "About Me")
   - A Reddit comment on r/anime / r/AnimePiracy where someone asks for a site (be honest, don't spam)
   - One post on r/SideProject or Hacker News "Show HN"
   - A single reply on an existing MyAnimeList / AniList forum thread

2. **Ping IndexNow** (Bing + Yandex index within hours, free, no account):
   Add one fetch call in the sitemap route or a GitHub Action:
   ```
   https://api.indexnow.org/indexnow?url=https://aniora.qzz.io/&key=<random-uuid>
   ```
   Host `<uuid>.txt` at the site root containing the same UUID. That's it — Bing crawls within 24 h.

3. **Submit sitemap to Bing Webmaster Tools once** (2 min, no ongoing work). Bing shares its index with DuckDuckGo, Yahoo, Ecosia → covers ~10 % of search share automatically.

4. **Let AniList do the work.** Every time a user connects their AniList account, their public profile links back to their activity — those are real backlinks from a DA-90 domain.

---

## What NOT to do (waste of time or actively harmful)

- ❌ Don't buy backlinks / "SEO packages" — Google penalizes.
- ❌ Don't submit to 500 "free directories" — all deindexed years ago.
- ❌ Don't add auto-generated blog posts / AI spam pages — triggers Helpful Content update.
- ❌ Don't add the sponsor ad script to more slots than currently — Safe Browsing already flagged it once; more triggers = domain-level penalty = zero traffic forever.
- ❌ Don't rename the domain again. Every rename resets the indexing clock.
- ❌ Don't hide content behind login (crawlers can't see /profile, /wishlist — already `noindex`, good).

---

## What compounds passively (bonus — optional)

- **1 blog post per month** on `/blog` targeting a real query ("best sites to watch <seasonal anime>", "sub vs dub"). Even 3 posts = long-tail traffic for years.
- **Structured data on blog posts** (`Article` JSON-LD) — already scaffolded in `src/lib/seo.ts`.
- **Discord server** in footer — users linking your Discord = social signals + referral traffic.

---

## How to check progress (no tools needed)

Every ~2 weeks, Google these:

- `site:aniora.qzz.io` → shows every indexed page. Should grow from 1 → 10 → 100+.
- `aniora anime` → checks brand ranking.
- `intitle:"Aniora"` → confirms title tags are picked up.

If `site:` still shows 0 pages after 21 days, the only thing that will fix it is submitting the sitemap once at [bing.com/webmasters](https://www.bing.com/webmasters). That's the single manual escape hatch — takes 2 minutes, then never again.

---

## TL;DR

Publish. Drop the link in 4 places. Add IndexNow. Done. Indexing happens on its own within 2–8 weeks, and traffic grows on its own from there as long as the site stays online and clean.
