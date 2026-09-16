import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Activity,
  Award,
  Calendar,
  Clock,
  ExternalLink,
  Film,
  Globe,
  Hash,
  Heart,
  History,
  LogOut,
  RefreshCw,
  Star,
  Tag,
  Tv,
  User,
  Users,
} from "lucide-react";
import { useAniListViewer, useAniListLogout } from "@/lib/anilist-auth";
import { getAniListAuthUrl } from "@/lib/anilist-config";
import { useWishlist } from "@/lib/wishlist";
import { useWatchHistory } from "@/lib/watched";
import {
  fetchViewerActivity,
  fetchViewerList,
  type AniListListStatus,
} from "@/lib/anilist-sync";
import { FALLBACK_COVER, pickTitle } from "@/lib/anilist";
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
          "Your full AniList profile: stats, favourites, activity, lists — synced live.",
      },
    ],
  }),
});

const LIST_STATUSES: {
  key: AniListListStatus;
  label: string;
}[] = [
  { key: "CURRENT", label: "watching" },
  { key: "PLANNING", label: "planning" },
  { key: "COMPLETED", label: "completed" },
  { key: "PAUSED", label: "paused" },
  { key: "DROPPED", label: "dropped" },
  { key: "REPEATING", label: "rewatching" },
];

function ProfilePage() {
  const { viewer, isLoading, hasToken } = useAniListViewer();
  const logout = useAniListLogout();
  const { items: wishlistItems } = useWishlist();
  const { items: history } = useWatchHistory(8);
  const authUrl = getAniListAuthUrl();

  const listsById = useQueries({
    queries: LIST_STATUSES.map((s) => ({
      queryKey: ["anilist", "viewer-list", viewer?.id, s.key],
      queryFn: () => fetchViewerList(viewer!.id, s.key),
      enabled: !!viewer?.id,
      staleTime: 2 * 60_000,
    })),
  });

  const activity = useQuery({
    queryKey: ["anilist", "viewer-activity", viewer?.id],
    queryFn: () => fetchViewerActivity(viewer!.id),
    enabled: !!viewer?.id,
    staleTime: 60_000,
  });

  if (isLoading && hasToken) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="h-40 w-full shimmer border border-border" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 shimmer border border-border" />
          ))}
        </div>
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
  const days = stats ? Math.round((stats.minutesWatched / 60 / 24) * 10) / 10 : 0;

  return (
    <div className="pb-16">
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
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-10 sm:px-6">
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
            <div className="flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              ~$ whoami · <span className="text-chart-1">anilist_sync=on</span>
              {viewer.donatorTier ? (
                <span className="border border-chart-2 px-1.5 py-0.5 text-chart-2">
                  {viewer.donatorBadge || `tier ${viewer.donatorTier}`}
                </span>
              ) : null}
            </div>
            <h1 className="mt-1 text-2xl font-medium sm:text-3xl">
              {viewer.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-widest">
              <a
                href={viewer.siteUrl || `https://anilist.co/user/${viewer.name}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 border border-border bg-background/70 px-2 py-1 text-muted-foreground hover:text-foreground"
              >
                anilist profile <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={() => {
                  activity.refetch();
                  listsById.forEach((q) => q.refetch());
                }}
                className="inline-flex items-center gap-1 border border-border bg-background/70 px-2 py-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw
                  className={`h-3 w-3 ${activity.isFetching ? "animate-spin" : ""}`}
                />{" "}
                sync
              </button>
              {viewer.createdAt ? (
                <span className="inline-flex items-center gap-1 border border-border bg-background/70 px-2 py-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  joined {new Date(viewer.createdAt * 1000).toLocaleDateString()}
                </span>
              ) : null}
              {viewer.options?.timezone ? (
                <span className="inline-flex items-center gap-1 border border-border bg-background/70 px-2 py-1 text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  {viewer.options.timezone}
                </span>
              ) : null}
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

      {/* Top stats grid */}
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-6">
        <Stat icon={Tv} label="anime" value={stats?.count ?? 0} />
        <Stat icon={Hash} label="episodes" value={stats?.episodesWatched ?? 0} />
        <Stat
          icon={Clock}
          label="hours"
          value={stats ? Math.round(stats.minutesWatched / 60) : 0}
        />
        <Stat icon={Calendar} label="days" value={days} />
        <Stat
          icon={Star}
          label="mean score"
          value={stats ? stats.meanScore.toFixed(1) : "—"}
        />
        <Stat
          icon={Activity}
          label="std dev"
          value={stats ? stats.standardDeviation.toFixed(2) : "—"}
        />
      </div>

      {/* About */}
      {viewer.about && (
        <Section title="~$ cat about.md" className="max-w-6xl">
          <div className="border border-dashed border-border bg-card p-4">
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-card-foreground">
              {stripHtml(viewer.about)}
            </p>
          </div>
        </Section>
      )}

      {/* Status breakdown */}
      {stats?.statuses?.length ? (
        <Section title="~$ stat --by=status" className="max-w-6xl">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {stats.statuses.map((s) => (
              <div
                key={s.status}
                className="border border-border bg-card px-3 py-2"
              >
                <div className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                  {s.status.toLowerCase()}
                </div>
                <div className="mt-1 font-mono text-lg text-foreground">
                  {s.count}
                </div>
                <div className="mt-0.5 text-[0.55rem] text-muted-foreground/70">
                  ⌀ {s.meanScore.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Score distribution */}
      {stats?.scores?.length ? (
        <Section title="~$ stat --histogram=scores" className="max-w-6xl">
          <ScoreHistogram data={stats.scores} />
        </Section>
      ) : null}

      {/* Genres + Tags */}
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-6 sm:px-6 md:grid-cols-2">
        {stats?.genres?.length ? (
          <BarList
            icon={Tag}
            title="top genres"
            items={stats.genres.slice(0, 10).map((g) => ({
              label: g.genre,
              value: g.count,
              meta: `⌀ ${g.meanScore.toFixed(1)}`,
            }))}
          />
        ) : null}
        {stats?.tags?.length ? (
          <BarList
            icon={Tag}
            title="top tags"
            items={stats.tags.slice(0, 10).map((t) => ({
              label: t.tag.name,
              value: t.count,
              meta: `⌀ ${t.meanScore.toFixed(1)}`,
            }))}
          />
        ) : null}
        {stats?.studios?.length ? (
          <BarList
            icon={Film}
            title="top studios"
            items={stats.studios.slice(0, 10).map((s) => ({
              label: s.studio.name,
              value: s.count,
              meta: `⌀ ${s.meanScore.toFixed(1)}`,
            }))}
          />
        ) : null}
        {stats?.voiceActors?.length ? (
          <BarList
            icon={Users}
            title="top voice actors"
            items={stats.voiceActors.slice(0, 8).map((v) => ({
              label: v.voiceActor.name.full,
              value: v.count,
              meta: `⌀ ${v.meanScore.toFixed(1)}`,
            }))}
          />
        ) : null}
        {stats?.formats?.length ? (
          <BarList
            icon={Tv}
            title="by format"
            items={stats.formats.map((f) => ({
              label: f.format,
              value: f.count,
              meta: `⌀ ${f.meanScore.toFixed(1)}`,
            }))}
          />
        ) : null}
        {stats?.countries?.length ? (
          <BarList
            icon={Globe}
            title="by country"
            items={stats.countries.map((c) => ({
              label: c.country,
              value: c.count,
              meta: `⌀ ${c.meanScore.toFixed(1)}`,
            }))}
          />
        ) : null}
      </div>

      {/* Release / Start year timeline */}
      {stats?.releaseYears?.length ? (
        <Section title="~$ timeline --release-year" className="max-w-6xl">
          <YearBars
            data={stats.releaseYears.map((y) => ({
              year: y.releaseYear,
              count: y.count,
            }))}
          />
        </Section>
      ) : null}

      {/* Favourites */}
      {viewer.favourites?.anime?.nodes?.length ? (
        <Section title="~$ ls favourites/anime/" className="max-w-6xl">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {viewer.favourites.anime.nodes.map((a) => (
              <Link
                key={a.id}
                to="/anime/$id"
                params={{ id: String(a.id) }}
                className="group"
              >
                <SmartImage
                  src={a.coverImage.large || FALLBACK_COVER}
                  fallback={FALLBACK_COVER}
                  alt={pickTitle(a.title)}
                  className="aspect-[2/3] w-full border border-border group-hover:border-foreground"
                />
                <p className="mt-1 line-clamp-2 text-[0.65rem] leading-tight text-muted-foreground group-hover:text-foreground">
                  {pickTitle(a.title)}
                </p>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {viewer.favourites?.characters?.nodes?.length ? (
        <Section title="~$ ls favourites/characters/" className="max-w-6xl">
          <PersonGrid
            items={viewer.favourites.characters.nodes.map((c) => ({
              id: c.id,
              name: c.name.full,
              image: c.image.large,
            }))}
          />
        </Section>
      ) : null}

      {viewer.favourites?.staff?.nodes?.length ? (
        <Section title="~$ ls favourites/staff/" className="max-w-6xl">
          <PersonGrid
            items={viewer.favourites.staff.nodes.map((c) => ({
              id: c.id,
              name: c.name.full,
              image: c.image.large,
            }))}
          />
        </Section>
      ) : null}

      {viewer.favourites?.studios?.nodes?.length ? (
        <Section title="~$ ls favourites/studios/" className="max-w-6xl">
          <div className="flex flex-wrap gap-2">
            {viewer.favourites.studios.nodes.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 border border-border bg-card px-2 py-1 text-xs text-card-foreground"
              >
                <Film className="h-3 w-3 text-muted-foreground" />
                {s.name}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Lists by status */}
      {LIST_STATUSES.map((s, i) => {
        const q = listsById[i];
        const entries = q.data ?? [];
        if (!q.isLoading && entries.length === 0) return null;
        return (
          <Section
            key={s.key}
            title={`~$ ls anilist/${s.label}/`}
            meta={`${entries.length} entries`}
            className="max-w-6xl"
          >
            {q.isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, k) => (
                  <div key={k} className="h-24 shimmer border border-border" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {entries.map((e) => {
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
                          {e.score ? ` · ★ ${e.score}` : ""}
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
          </Section>
        );
      })}

      {/* Activity feed */}
      {activity.data && activity.data.length > 0 && (
        <Section title="~$ tail -n 25 activity.log" className="max-w-6xl">
          <ul className="divide-y divide-border border border-border bg-card">
            {activity.data.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-3 py-2">
                {a.media?.coverImage.large ? (
                  <SmartImage
                    src={a.media.coverImage.large}
                    fallback={FALLBACK_COVER}
                    alt=""
                    className="h-10 w-8 shrink-0 border border-border"
                  />
                ) : (
                  <div className="h-10 w-8 shrink-0 border border-border bg-muted" />
                )}
                <div className="min-w-0 flex-1 text-xs">
                  <p className="line-clamp-1 text-foreground">
                    <span className="text-muted-foreground">
                      {a.status ?? "updated"}
                    </span>{" "}
                    {a.progress ? (
                      <span className="text-chart-1">{a.progress}</span>
                    ) : null}{" "}
                    <span className="text-foreground/80">of</span>{" "}
                    {a.media?.title.userPreferred ?? "unknown"}
                  </p>
                  <p className="mt-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/70">
                    {new Date(a.createdAt * 1000).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Local storage summary */}
      <Section title="~$ cat local/*.log" className="max-w-6xl">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              <Heart className="h-3 w-3" /> local/wishlist.log
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
                {history.slice(0, 5).map((h) => (
                  <li key={`${h.animeId}-${h.episode}`} className="flex gap-2">
                    <SmartImage
                      src={
                        h.episodeImage ||
                        h.animeCover ||
                        h.animePoster ||
                        FALLBACK_EP_IMAGE
                      }
                      fallback={
                        h.animePoster || h.animeCover || FALLBACK_COVER
                      }
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
      </Section>

      {/* Account / options footer */}
      <Section title="~$ env --user" className="max-w-6xl">
        <div className="grid grid-cols-2 gap-2 border border-dashed border-border bg-card p-3 text-[0.65rem] font-mono md:grid-cols-4">
          <KV k="uid" v={String(viewer.id)} />
          <KV k="title_lang" v={viewer.options?.titleLanguage ?? "—"} />
          <KV k="score_fmt" v={viewer.mediaListOptions?.scoreFormat ?? "—"} />
          <KV
            k="adult"
            v={viewer.options?.displayAdultContent ? "true" : "false"}
          />
          <KV
            k="color"
            v={viewer.options?.profileColor ?? "—"}
          />
          <KV
            k="updated"
            v={
              viewer.updatedAt
                ? new Date(viewer.updatedAt * 1000).toLocaleDateString()
                : "—"
            }
          />
          <KV k="donator" v={viewer.donatorTier ? `tier ${viewer.donatorTier}` : "no"} />
          <KV k="user" v={viewer.name} icon={User} />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  meta,
  className,
  children,
}: {
  title: string;
  meta?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`mx-auto px-4 pt-8 sm:px-6 ${className ?? ""}`}>
      <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {meta && (
          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
            {meta}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 text-[0.55rem] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl text-foreground">{value}</div>
    </div>
  );
}

function BarList({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { label: string; value: number; meta?: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" /> {title}
      </div>
      <ul className="divide-y divide-border/70">
        {items.map((it) => (
          <li key={it.label} className="px-3 py-2">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="line-clamp-1 text-foreground">{it.label}</span>
              <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground">
                {it.value}
                {it.meta ? ` · ${it.meta}` : ""}
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full bg-muted">
              <div
                className="h-full bg-chart-1"
                style={{ width: `${(it.value / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreHistogram({
  data,
}: {
  data: { score: number; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-1 border border-border bg-card p-3">
      {data.map((d) => (
        <div key={d.score} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-24 w-full items-end">
            <div
              className="w-full bg-chart-1"
              style={{ height: `${(d.count / max) * 100}%` }}
              title={`${d.count}`}
            />
          </div>
          <div className="font-mono text-[0.55rem] text-muted-foreground">
            {d.score}
          </div>
        </div>
      ))}
    </div>
  );
}

function YearBars({ data }: { data: { year: number; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-0.5 overflow-x-auto border border-border bg-card p-3">
      {data.map((d) => (
        <div
          key={d.year}
          className="flex min-w-[22px] flex-col items-center gap-1"
        >
          <div className="flex h-20 w-full items-end">
            <div
              className="w-full bg-chart-2"
              style={{ height: `${(d.count / max) * 100}%` }}
              title={`${d.year}: ${d.count}`}
            />
          </div>
          <div className="font-mono text-[0.5rem] text-muted-foreground">
            {String(d.year).slice(-2)}
          </div>
        </div>
      ))}
    </div>
  );
}

function PersonGrid({
  items,
}: {
  items: { id: number; name: string; image: string | null }[];
}) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
      {items.map((p) => (
        <div key={p.id} className="text-center">
          <SmartImage
            src={p.image || FALLBACK_COVER}
            fallback={FALLBACK_COVER}
            alt={p.name}
            className="aspect-square w-full border border-border"
          />
          <p className="mt-1 line-clamp-2 text-[0.6rem] text-muted-foreground">
            {p.name}
          </p>
        </div>
      ))}
    </div>
  );
}

function KV({
  k,
  v,
  icon: Icon,
}: {
  k: string;
  v: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-1.5 border-b border-border/50 py-1 sm:border-none">
      {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
      <span className="text-muted-foreground">{k}=</span>
      <span className="truncate text-foreground">{v}</span>
    </div>
  );
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+\n/g, "\n").trim();
}
