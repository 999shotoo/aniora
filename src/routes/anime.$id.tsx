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
import { AniListTracker } from "@/components/anilist-tracker";


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
    if (!media) {
      return {
        meta: [
          { title: "Anime — Aniora" },
          { name: "description", content: "Watch anime free on Aniora — sub or dub in HD." },
          { property: "og:url", content: url },
          { property: "og:image", content: "https://aniora.qzz.io/og.png" },
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
          { name: "twitter:image", content: "https://aniora.qzz.io/og.png" },
        ],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const title = pickTitle(media.title);
    const year = media.seasonYear ? ` (${media.seasonYear})` : "";
    const isMovie = media.format === "MOVIE";
    const rawDesc = media.description
      ? media.description.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      : "";
    const truncated = rawDesc.length > 158 ? `${rawDesc.slice(0, 157).replace(/[.,;:!?-]+$/, "")}…` : rawDesc;
    const desc =
      truncated ||
      `Watch ${title}${year} online on Aniora — ${isMovie ? "the full movie" : "every episode"} in HD, sub or dub.`;
    const pageTitle = `${title}${year} — Watch on Aniora`.slice(0, 65);
    // AniList's img.anili.st renders a proper 1500x500 landscape social card
    // for every media id (title + characters baked in). Use it as the primary
    // og:image so Discord / Twitter / Facebook get a real branded preview
    // instead of a raw stretched banner image.
    const socialCard = `https://img.anili.st/media/${media.id}`;
    const image = socialCard;
    const cover = media.coverImage?.extraLarge || media.coverImage?.large || undefined;
    const keywords = [
      title,
      media.title.english,
      media.title.romaji,
      `watch ${title} online`,
      `${title} sub`,
      `${title} dub`,
      ...(media.genres ?? []).slice(0, 6).map((g) => `${g} anime`),
      "anime streaming",
      "aniora",
    ]
      .filter(Boolean)
      .join(", ");

    const startISO =
      media.startDate?.year
        ? `${media.startDate.year}-${String(media.startDate.month ?? 1).padStart(2, "0")}-${String(media.startDate.day ?? 1).padStart(2, "0")}`
        : undefined;
    const endISO =
      media.endDate?.year
        ? `${media.endDate.year}-${String(media.endDate.month ?? 1).padStart(2, "0")}-${String(media.endDate.day ?? 1).padStart(2, "0")}`
        : undefined;

    const jsonLdMedia = {
      "@context": "https://schema.org",
      "@type": isMovie ? "Movie" : "TVSeries",
      name: title,
      alternateName: [media.title.english, media.title.romaji, media.title.native]
        .filter((v): v is string => Boolean(v) && v !== title),
      description: rawDesc || undefined,
      image: cover ? [cover, image].filter((v, i, a) => a.indexOf(v) === i) : undefined,
      url,
      genre: media.genres,
      inLanguage: "ja",
      datePublished: startISO,
      dateCreated: startISO,
      numberOfEpisodes: media.episodes ?? undefined,
      timeRequired: media.duration ? `PT${media.duration}M` : undefined,
      productionCompany: media.studios?.nodes?.length
        ? media.studios.nodes.map((n) => ({ "@type": "Organization", name: n.name }))
        : undefined,
      aggregateRating:
        media.averageScore != null
          ? {
              "@type": "AggregateRating",
              ratingValue: (media.averageScore / 10).toFixed(2),
              bestRating: "10",
              worstRating: "1",
              ratingCount: Math.max(media.popularity ?? 1, 1),
            }
          : undefined,
      trailer:
        media.trailer?.site === "youtube" && media.trailer.id
          ? {
              "@type": "VideoObject",
              name: `${title} — Trailer`,
              embedUrl: `https://www.youtube.com/embed/${media.trailer.id}`,
              thumbnailUrl: cover,
              uploadDate: startISO,
            }
          : undefined,
    };

    const jsonLdBreadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://aniora.qzz.io/" },
        {
          "@type": "ListItem",
          position: 2,
          name: isMovie ? "Movies" : "Anime",
          item: `https://aniora.qzz.io${isMovie ? "/movies" : "/anime"}`,
        },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    };

    const meta = [
      { title: pageTitle },
      { name: "description", content: desc },
      { name: "keywords", content: keywords },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: desc },
      { property: "og:type", content: isMovie ? "video.movie" : "video.tv_show" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:secure_url", content: image },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1500" },
      { property: "og:image:height", content: "500" },
      { property: "og:image:alt", content: `${title} — Watch on Aniora` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: desc },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: `${title} — Watch on Aniora` },
      ...(startISO ? [{ property: "video:release_date", content: startISO }] : []),
      ...(endISO ? [{ property: "video:end_date", content: endISO }] : []),
      ...(media.duration
        ? [{ property: "video:duration", content: String(media.duration * 60) }]
        : []),
      ...(media.genres ?? []).map((g) => ({ property: "video:tag", content: g })),
    ];

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(jsonLdMedia) },
        { type: "application/ld+json", children: JSON.stringify(jsonLdBreadcrumb) },
      ],
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
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={banner}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_BANNER;
            }}
            className="h-full w-full object-cover object-[center_25%] opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
        </div>
        <div className="relative mx-auto flex max-w-none flex-col gap-6 px-6 lg:px-10 py-10 md:flex-row">
          <img
            src={media.coverImage?.large || FALLBACK_COVER}
            alt={title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_COVER;
            }}
            className="aspect-[2/3] w-32 shrink-0 self-start border border-border object-cover sm:w-40 md:w-48"
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

            <AniListTracker mediaId={media.id} totalEpisodes={media.episodes} />

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
