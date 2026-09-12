import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, History, LogOut, RefreshCw } from "lucide-react";
import { useAniListViewer, useAniListLogout } from "@/lib/anilist-auth";
import { getAniListAuthUrl } from "@/lib/anilist-config";
import { useWishlist } from "@/lib/wishlist";
import { useWatchHistory } from "@/lib/watched";
import { fetchViewerList } from "@/lib/anilist-sync";
import { FALLBACK_COVER } from "@/lib/anilist";
import { SmartImage } from "@/components/smart-image";
import { FALLBACK_EP_IMAGE } from "@/components/player";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — Zen Stream" },
      {
        name: "description",
        content:
          "Your AniList profile, watch history and wishlist — synced across sessions.",
      },
    ],
  }),
});

function ProfilePage() {
  const { viewer, isLoading, hasToken } = useAniListViewer();
  const logout = useAniListLogout();
  const { items: wishlistItems } = useWishlist();
  const { items: history } = useWatchHistory(6);
  const authUrl = getAniListAuthUrl();

  const list = useQuery({
    queryKey: ["anilist", "viewer-list", viewer?.id],
    queryFn: () => fetchViewerList(viewer!.id, "CURRENT"),
    enabled: !!viewer?.id,
    staleTime: 2 * 60_000,
  });

  if (isLoading && hasToken) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="h-40 w-full shimmer border border-border" />
      </div>
    );
  }

  if (!viewer) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center font-mono">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          ~$ whoami
        </div>
        <h1 className="mt-3 text-2xl font-medium">not signed in</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Sign in with AniList to sync your watch progress across devices.
          Local wishlist and history keep working without an account
          ({wishlistItems.length} saved · {history.length} watched).
        </p>
        {authUrl ? (
          <a
            href={authUrl}
            className="mt-5 border border-foreground bg-foreground px-4 py-2 text-[0.7rem] uppercase tracking-widest text-background"
          >
            login with anilist
          </a>
        ) : (
          <div className="mt-5 border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
            set <span className="text-foreground">VITE_ANILIST_CLIENT_ID</span> to enable login
          </div>
        )}
      </div>
    );
  }

  const stats = viewer.statistics?.anime;
  const banner = viewer.bannerImage;

  return (
    <div>
      {/* Banner */}
      <div className="relative border-b border-border">
        {banner && (
          <div className="absolute inset-0">
            <img
              src={banner}
              alt=""
              className="h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
        )}
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-6 py-10">
          {viewer.avatar?.large ? (
            <img
              src={viewer.avatar.large}
              alt={viewer.name}
              className="h-20 w-20 border border-border object-cover sm:h-24 sm:w-24"
            />
          ) : (
            <div className="h-20 w-20 border border-border bg-muted sm:h-24 sm:w-24" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              ~$ whoami · <span className="text-chart-1">anilist_sync=on</span>
            </div>
            <h1 className="mt-1 text-2xl font-medium sm:text-3xl">
              {viewer.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-widest">
              <a
                href={`https://anilist.co/user/${viewer.name}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 border border-border bg-background/70 px-2 py-1 text-muted-foreground hover:text-foreground"
              >
                anilist profile <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={() => list.refetch()}
                className="inline-flex items-center gap-1 border border-border bg-background/70 px-2 py-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw
                  className={`h-3 w-3 ${list.isFetching ? "animate-spin" : ""}`}
                />{" "}
                sync
              </button>
            </div>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 border border-border px-3 py-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" /> logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto grid max-w-5xl gap-3 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="anime watched" value={stats?.count ?? 0} />
        <Stat label="episodes" value={stats?.episodesWatched ?? 0} />
        <Stat
          label="hours"
          value={stats ? Math.round(stats.minutesWatched / 60) : 0}
        />
        <Stat
          label="mean score"
          value={stats ? stats.meanScore.toFixed(1) : "—"}
        />
      </div>

      {/* About */}
      {viewer.about && (
        <div className="mx-auto max-w-5xl px-6 pb-4">
          <div className="border border-dashed border-border bg-card p-4">
            <div className="mb-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              ~$ cat about.md
            </div>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-card-foreground">
              {stripHtml(viewer.about)}
            </p>
          </div>
        </div>
      )}

      {/* Currently watching (AniList list) */}
      <div className="mx-auto max-w-5xl px-6 pb-6">
        <div className="mb-2 flex items-baseline justify-between border-b border-border pb-2">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            ~$ ls anilist/current/
          </h2>
          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
            {list.data?.length ?? 0} entries
          </span>
        </div>
        {list.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 shimmer border border-border" />
            ))}
          </div>
        ) : (list.data ?? []).length === 0 ? (
          <p className="border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
            no entries in your CURRENT list — start watching to sync progress.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(list.data ?? []).map((e) => {
              const total = e.media.episodes ?? 0;
              const pct = total
                ? Math.min(100, ((e.progress ?? 0) / total) * 100)
                : 0;
              return (
                <Link
                  key={e.id}
                  to="/watch/$id"
                  params={{ id: String(e.media.id) }}
                  className="group flex gap-3 border border-border bg-card p-2 hover:bg-accent"
                >
                  <SmartImage
                    src={e.media.coverImage.large || FALLBACK_COVER}
                    fallback={FALLBACK_COVER}
                    alt={e.media.title.userPreferred ?? ""}
                    className="h-20 w-14 shrink-0 border border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold text-foreground">
                      {e.media.title.userPreferred}
                    </p>
                    <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                      ep {e.progress ?? 0}
                      {total ? ` / ${total}` : ""}
                    </p>
                    <div className="mt-2 h-1 w-full bg-muted">
                      <div
                        className="h-full bg-chart-1"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Local: wishlist + recent watches */}
      <div className="mx-auto grid max-w-5xl gap-3 px-6 pb-10 md:grid-cols-2">
        <div className="border border-border bg-card p-4">
          <div className="mb-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            ~$ cat local/wishlist.log
          </div>
          <p className="text-sm text-card-foreground">
            {wishlistItems.length} entries saved locally.
          </p>
          <Link
            to="/wishlist"
            className="mt-3 inline-block border border-border px-3 py-1.5 text-[0.65rem] uppercase tracking-widest hover:bg-accent"
          >
            open wishlist
          </Link>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            <History className="h-3 w-3" /> local/watch-history.log
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              no episodes watched yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {history.slice(0, 4).map((h) => (
                <li key={`${h.animeId}-${h.episode}`} className="flex gap-2">
                  <SmartImage
                    src={
                      h.episodeImage ||
                      h.animeCover ||
                      h.animePoster ||
                      FALLBACK_EP_IMAGE
                    }
                    fallback={h.animePoster || h.animeCover || FALLBACK_COVER}
                    alt={h.episodeTitle}
                    className="h-10 w-16 shrink-0 border border-border"
                  />
                  <Link
                    to="/watch/$id"
                    params={{ id: String(h.animeId) }}
                    search={{ ep: h.episode }}
                    className="min-w-0 flex-1 text-xs hover:text-foreground"
                  >
                    <p className="line-clamp-1 font-medium text-foreground">
                      {h.animeTitle}
                    </p>
                    <p className="line-clamp-1 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                      ep {h.episode} · {h.episodeTitle}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/history"
            className="mt-3 inline-block border border-border px-3 py-1.5 text-[0.65rem] uppercase tracking-widest hover:bg-accent"
          >
            open history
          </Link>
        </div>
      </div>
    </div>
  );
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+\n/g, "\n").trim();
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-border bg-card px-4 py-3">
      <div className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl text-foreground">{value}</div>
    </div>
  );
}
