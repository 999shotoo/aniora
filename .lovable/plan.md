# Plan

## 1. Multi-server player
- New `src/lib/servers.ts` — fetches `https://aniora-iframe.vercel.app/api/servers?id={anilistId}&ep_id={episode}` with react-query, returns `{ sub: Server[], dub: Server[] }`.
- `Player` (`src/components/player.tsx`):
  - Drop hardcoded megaplay URL builder.
  - Use servers hook. Show sub/dub toggle (existing) + a **compact server dropdown** to pick server, defaulting to `default: true` or first.
  - Persist last selected server in `settings` (`defaultServer`) so it sticks across episodes.
  - Iframe `src` comes from selected server's `url`. Keep skeleton, autoplay, retry, fullscreen, reload behavior unchanged.
  - If a server URL already includes `?`, append `&autoplay=1` correctly.

## 2. Compact AniList tracker (anime info page)
Rewrite `src/components/anilist-tracker.tsx` into a **single-row minimal control bar**:
- Row: `[Status dropdown ▾] [Progress − N + / total] [Score select ▾] [♥ fav] [Save] [⋯ menu with Remove / Mark completed]`
- No large card/header/progress bar/status-pills grid. One thin bordered strip, ~40-44px tall, wraps on mobile.
- Same mutations/queries, no logic changes.

## 3. Fix login loop
Bug: after logout → login attempt, viewer query "stuck retrying and never logs in."
Root cause candidates in `src/lib/anilist-auth.tsx`:
- `useAniListLogout` sets viewer to `null` but leaves `hasToken=false → enabled=false`, so the next login (which sets token in localStorage) doesn't automatically enable the query — `useHydrated`/gate misses the storage write until a full refresh.
Fix:
- After login (`auth.callback.tsx`), dispatch a `storage`-like event and `qc.invalidateQueries(['anilist','viewer'])` + `qc.resetQueries`.
- In `useAniListViewer`, subscribe to a `window` `aniora:anilist:token` event to re-read the token and re-enable.
- On logout, also `qc.removeQueries({ queryKey: ['anilist'] })` (not just setQueryData) so a stale `null` doesn't block refetch, and dispatch the same event.
- Add `retry: false` already exists; ensure `enabled` recomputes by using a `useState`+listener rather than direct localStorage read.

## 4. Profile redesign (AniList/MAL-style) with edit
Rewrite `src/routes/profile.tsx`:
- **Header**: banner + avatar overlap (MAL/AniList layout), name, tier badge, joined date, external link, sync, logout. Compact stat strip inline (anime count, episodes, days, mean score).
- **Tabs**: Overview / Anime List / Favourites / Stats / Activity / Settings (new).
- **Overview**: about + top genres + recent activity preview + currently watching row.
- **Anime List**: filterable table-style rows (status filter chips, search input), per-row quick edit (progress ± , score) using existing mutations — like AniList list view.
- **Settings tab** (new) — edit AniList profile fields via existing AniList API:
  - about (bio, textarea)
  - titleLanguage, displayAdultContent, airingNotifications, timezone, scoreFormat
  - Uses `UpdateUser` mutation. Add `updateViewerSettings()` in `src/lib/anilist-sync.ts`.
- Keep existing sections (favourites grid, stats genres/tags/studios, activity feed, local wishlist/history) but restyle to card grid closer to AniList.

## 5. Files touched
- new: `src/lib/servers.ts`
- edit: `src/components/player.tsx`, `src/lib/settings.tsx` (add `defaultServer`), `src/components/anilist-tracker.tsx`, `src/lib/anilist-auth.tsx`, `src/routes/auth.callback.tsx`, `src/lib/anilist-sync.ts` (UpdateUser mutation), `src/routes/profile.tsx`

## Out of scope
- No changes to watch route logic beyond passing through Player.
- No new backend/server functions.
- No AniList review/social-post editing (API supports it but adds noise).

Confirm and I'll implement in one pass.
