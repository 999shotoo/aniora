import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  Calendar,
  Play,
  Bookmark,
  BookmarkCheck,
  Clock,
  Users,
  Film,
  Tv,
  ExternalLink,
} from "lucide-react";
import {
  getAnimeById,
  FALLBACK_BANNER,
  FALLBACK_COVER,
  pickTitle,
} from "@/lib/anilist";
import { useWishlist } from "@/lib/wishlist";
import { EmptyState, BackHomeAction } from "@/components/empty-state";
import { InfoHeaderSkeleton, Skeleton } from "@/components/skeleton";


export const Route = createFileRoute("/anime/$id")({
  component: AnimeInfoPage,
  loader: async ({ params, context }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;
    try {
      return await context.queryClient.ensureQueryData({
        queryKey: ["anime", id],
        queryFn: () => getAnimeById(id),
        staleTime: 10 * 60_000,
      });
    } catch {
      return null;
    }
  },
  head: ({ params, loaderData }) => {
    const url = `https://aniora.qzz.io/anime/${params.id}`;
    const media = loaderData ?? null;
    const title = media ? pickTitle(media.title) : "Anime";
    const rawDesc = media?.description
      ? media.description.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      : "";
    const desc = rawDesc
      ? rawDesc.slice(0, 155) + (rawDesc.length > 155 ? "…" : "")
      : `Watch ${title} on Aniora — dub or sub, episode guide, and streaming info.`;
    const pageTitle = `${title} — Aniora`.slice(0, 60);
    const image = media?.coverImage?.extraLarge || media?.coverImage?.large || undefined;
    const scripts = media
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": media.format === "MOVIE" ? "Movie" : "TVSeries",
              name: title,
              alternateName: [media.title.english, media.title.native].filter(Boolean),
              description: rawDesc || undefined,
              image: image || undefined,
              genre: media.genres,
              numberOfEpisodes: media.episodes ?? undefined,
              aggregateRating:
                media.averageScore != null
                  ? {
                      "@type": "AggregateRating",
                      ratingValue: (media.averageScore / 10).toFixed(2),
                      bestRating: "10",
                      ratingCount: media.popularity ?? 1,
                    }
                  : undefined,
            }),
          },
        ]
      : undefined;
    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: desc },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: desc },
        { property: "og:type", content: media?.format === "MOVIE" ? "video.movie" : "video.tv_show" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
});

function formatDate(d?: { year: number | null; month: number | null; day: number | null } | null) {
  if (!d?.year) return null;
  const parts = [d.year, d.month, d.day].filter(Boolean) as number[];
  if (parts.length === 1) return String(parts[0]);
  const iso = `${d.year}-${String(d.month ?? 1).padStart(2, "0")}-${String(d.day ?? 1).padStart(2, "0")}`;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return String(d.year);
  return new Date(t).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCountdown(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-border bg-card px-3 py-3">
      <div className="mb-1 text-[0.55rem] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium text-card-foreground">{value ?? "—"}</div>
    </div>
  );
}

function AnimeInfoPage() {
  const { id } = Route.useParams();
  const anilistId = Number(id);

  const anime = useQuery({
    queryKey: ["anime", anilistId],
    queryFn: () => getAnimeById(anilistId),
    staleTime: 10 * 60_000,
    enabled: Number.isFinite(anilistId),
  });

  const { has, toggle } = useWishlist();

  if (anime.isLoading) {
    return (
      <div className="pb-16">
        <InfoHeaderSkeleton />
        <div className="mx-auto max-w-none px-6 lg:px-10 py-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (anime.isError || !anime.data) {
    return (
      <div className="mx-auto max-w-none px-6 lg:px-10 py-10">
        <EmptyState
          variant="large"
          hint="~$ fetch --error"
          title="Couldn't load this title"
          message={
            (anime.error as Error | null)?.message ??
            "AniList didn't answer. Try again in a moment."
          }
          actions={<BackHomeAction />}
        />
      </div>
    );
  }


  const media = anime.data;
  const title = pickTitle(media.title);
  const banner = media.bannerImage || media.coverImage?.extraLarge || FALLBACK_BANNER;
  const desc = (media.description || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
  const saved = has(media.id);
  const studios = media.studios?.nodes?.map((n) => n.name).filter(Boolean) ?? [];
  const trailerUrl =
    media.trailer?.site === "youtube" && media.trailer.id
      ? `https://www.youtube.com/watch?v=${media.trailer.id}`
      : null;

  return (
    <div className="pb-16">
      {/* header banner */}
      <div className="relative border-b border-border">
        <div className="absolute inset-0">
          <img
            src={banner}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_BANNER;
            }}
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
        </div>
        <div className="relative mx-auto flex max-w-none flex-col gap-6 px-6 lg:px-10 py-10 md:flex-row">
          <img
            src={media.coverImage?.large || FALLBACK_COVER}
            alt={title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_COVER;
            }}
            className="aspect-[2/3] w-32 shrink-0 border border-border object-cover sm:w-40 md:w-48"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              {media.format && <span>{media.format}</span>}
              {media.status && <span>· {media.status.toLowerCase().replace(/_/g, " ")}</span>}
              {media.seasonYear && (
                <span className="inline-flex items-center gap-1">
                  · <Calendar className="h-3 w-3" /> {media.seasonYear}
                </span>
              )}
              {media.averageScore != null && (
                <span className="inline-flex items-center gap-1">
                  · <Star className="h-3 w-3" /> {(media.averageScore / 10).toFixed(1)}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-medium sm:text-3xl md:text-4xl">{title}</h1>
            {media.title.native && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {media.title.native}
              </p>
            )}
            {media.genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {media.genres.slice(0, 8).map((g) => (
                  <span
                    key={g}
                    className="border border-border bg-card px-2 py-0.5 text-[0.55rem] uppercase tracking-widest text-muted-foreground"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/watch/$id"
                params={{ id: String(media.id) }}
                className="inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-2 text-[0.7rem] uppercase tracking-widest text-background hover:bg-foreground/90"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> watch now
              </Link>
              <button
                onClick={() => toggle(media)}
                className="inline-flex items-center gap-2 border border-border bg-background/60 px-5 py-2 text-[0.7rem] uppercase tracking-widest text-foreground hover:bg-accent"
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="h-3.5 w-3.5" /> saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-3.5 w-3.5" /> wishlist
                  </>
                )}
              </button>
              {trailerUrl && (
                <a
                  href={trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-border bg-background/60 px-5 py-2 text-[0.7rem] uppercase tracking-widest text-foreground hover:bg-accent"
                >
                  trailer <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {media.nextAiringEpisode && (
              <div className="mt-4 inline-flex items-center gap-2 border border-dashed border-border bg-card px-3 py-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                <Clock className="h-3 w-3" />
                ep {media.nextAiringEpisode.episode} in{" "}
                <span className="text-foreground">
                  {formatCountdown(media.nextAiringEpisode.timeUntilAiring)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-none px-6 lg:px-10 py-8">
        {/* stat grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="score"
            value={
              media.averageScore != null ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" /> {(media.averageScore / 10).toFixed(2)} / 10
                </span>
              ) : (
                "unrated"
              )
            }
          />
          <Stat
            label="popularity"
            value={
              media.popularity != null ? (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {media.popularity.toLocaleString()}
                </span>
              ) : null
            }
          />
          <Stat
            label="episodes"
            value={
              media.episodes ? (
                <span className="inline-flex items-center gap-1">
                  <Tv className="h-3.5 w-3.5" /> {media.episodes}
                </span>
              ) : (
                "ongoing / tba"
              )
            }
          />
          <Stat
            label="runtime"
            value={media.duration ? `${media.duration} min / ep` : null}
          />
          <Stat label="format" value={media.format ?? null} />
          <Stat
            label="status"
            value={media.status ? media.status.toLowerCase().replace(/_/g, " ") : null}
          />
          <Stat
            label="season"
            value={
              media.season
                ? `${media.season.toLowerCase()} ${media.seasonYear ?? ""}`.trim()
                : media.seasonYear
                  ? String(media.seasonYear)
                  : null
            }
          />
          <Stat
            label="aired"
            value={
              <span className="text-xs">
                {formatDate(media.startDate) ?? "?"} —{" "}
                {formatDate(media.endDate) ?? (media.status === "RELEASING" ? "present" : "?")}
              </span>
            }
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="border border-border bg-card p-4">
              <div className="mb-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                ~$ cat synopsis.md
              </div>
              {desc ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-card-foreground">
                  {desc}
                </p>
              ) : (
                <p className="text-xs italic text-muted-foreground">
                  no synopsis available.
                </p>
              )}
            </div>

            {media.genres.length > 0 && (
              <div className="mt-6 border border-border bg-card p-4">
                <div className="mb-3 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  ~$ tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {media.genres.map((g) => (
                    <span
                      key={g}
                      className="border border-border bg-background px-2 py-0.5 text-[0.6rem] uppercase tracking-widest text-foreground"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-3">
            <div className="border border-border bg-card p-4">
              <div className="mb-3 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                ~$ meta
              </div>
              <dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-xs">
                <dt className="text-muted-foreground">romaji</dt>
                <dd className="text-card-foreground">{media.title.romaji ?? "—"}</dd>
                <dt className="text-muted-foreground">english</dt>
                <dd className="text-card-foreground">{media.title.english ?? "—"}</dd>
                <dt className="text-muted-foreground">native</dt>
                <dd className="font-mono text-card-foreground">
                  {media.title.native ?? "—"}
                </dd>
                <dt className="text-muted-foreground">studio</dt>
                <dd className="text-card-foreground">
                  {studios.length > 0 ? studios.join(", ") : "—"}
                </dd>
                <dt className="text-muted-foreground">anilist</dt>
                <dd className="font-mono text-card-foreground">#{media.id}</dd>
                <dt className="text-muted-foreground">mal</dt>
                <dd className="font-mono text-card-foreground">
                  {media.idMal ? `#${media.idMal}` : "—"}
                </dd>
              </dl>
            </div>

            <Link
              to="/watch/$id"
              params={{ id: String(media.id) }}
              className="group flex items-center justify-between border border-border bg-card p-4 hover:border-foreground"
            >
              <div>
                <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  ready to watch?
                </div>
                <div className="mt-1 text-sm font-medium text-card-foreground">
                  open player
                </div>
              </div>
              <Film className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
