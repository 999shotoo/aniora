import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { CalendarClock, Info, TvMinimal } from "lucide-react";
import {
  getAnimeById,
  FALLBACK_COVER,
  pickTitle,
  type AniListMedia,
} from "@/lib/anilist";
import { fetchMapping, splitEpisodes, isAired } from "@/lib/mappings";
import { Player } from "@/components/player";
import { EpisodesPanel } from "@/components/episodes-panel";
import { EmptyState, BackHomeAction } from "@/components/empty-state";
import { EpisodesPanelSkeleton, PlayerSkeleton } from "@/components/skeleton";
import { useWatched } from "@/lib/watched";

export const Route = createFileRoute("/watch/$id")({
  component: WatchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    ep: search.ep != null ? Number(search.ep) : undefined,
  }),
});

function stripHtml(s: string | null): string {
  if (!s) return "";
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function fmtDate(d?: { year: number | null; month: number | null; day: number | null }) {
  if (!d?.year) return "—";
  const parts = [d.year, d.month, d.day].filter(Boolean);
  return parts.join("-");
}

function WatchPage() {
  const { id } = Route.useParams();
  const { ep: epParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const anilistId = Number(id);

  const mapping = useQuery({
    queryKey: ["mapping", anilistId],
    queryFn: () => fetchMapping(anilistId),
    staleTime: 15 * 60_000,
    enabled: Number.isFinite(anilistId),
  });

  const anime = useQuery({
    queryKey: ["anime", anilistId],
    queryFn: () => getAnimeById(anilistId),
    staleTime: 10 * 60_000,
    enabled: Number.isFinite(anilistId),
  });

  const { regular } = useMemo(
    () => splitEpisodes(mapping.data ?? null),
    [mapping.data],
  );

  const airedEpisodes = useMemo(
    () =>
      regular.filter((e) => {
        if (!e.airDate && !e.airdate) return true;
        return isAired(e);
      }),
    [regular],
  );

  const episode = epParam ?? airedEpisodes[0]?.episodeNumber ?? 1;

  // Snap URL to a valid episode once we have data.
  useEffect(() => {
    if (airedEpisodes.length === 0) return;
    if (airedEpisodes.some((e) => e.episodeNumber === episode)) {
      if (epParam !== episode) {
        navigate({ search: { ep: episode }, replace: true }).catch(() => {});
      }
      return;
    }
    const first = airedEpisodes[0].episodeNumber ?? 1;
    navigate({ search: { ep: first }, replace: true }).catch(() => {});
  }, [airedEpisodes, episode, epParam, navigate]);

  const handleSelect = (n: number) => {
    navigate({ search: { ep: n } }).catch(() => {});
  };

  const media = anime.data;
  const currentEp = airedEpisodes.find((e) => e.episodeNumber === episode);
  const malId = mapping.data?.mappings?.mal_id ?? media?.idMal ?? null;
  const showEmpty =
    !mapping.isLoading && airedEpisodes.length === 0;

  return (
    <div className="pb-16">
      {/* Zero-episode empty state */}
      {showEmpty ? (
        <div className="mx-auto max-w-none px-6 lg:px-10 py-10">
          <EmptyState
            variant="large"
            hint="~$ ls episodes/ → 0 results"
            icon={
              media?.status === "NOT_YET_RELEASED" ? (
                <CalendarClock className="h-7 w-7" />
              ) : (
                <TvMinimal className="h-7 w-7" />
              )
            }
            title={
              media?.status === "NOT_YET_RELEASED"
                ? "This title hasn't premiered yet"
                : "No episodes are available"
            }
            message={
              media?.status === "NOT_YET_RELEASED"
                ? "Nothing has aired. Bookmark it and we'll surface episodes the moment they drop."
                : "We couldn't find any aired episodes for this title. Try again later or explore something else."
            }
            actions={
              <>
                {media && (
                  <Link
                    to="/anime/$id"
                    params={{ id: String(media.id) }}
                    className="border border-border bg-background px-4 py-2 text-[0.65rem] uppercase tracking-widest text-foreground hover:bg-accent"
                  >
                    view details
                  </Link>
                )}
                <BackHomeAction />
              </>
            }
          />
        </div>
      ) : (
        <div className="mx-auto grid max-w-none grid-cols-1 items-stretch gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-6 lg:px-10 lg:py-6">
          {/* Player column — waits for mapping first */}
          <div className="flex min-w-0 flex-col">
            {mapping.isLoading || !mapping.data ? (
              <PlayerSkeleton />
            ) : (
              <Player
                malId={malId}
                episode={episode}
                ep={currentEp}
                fallbackTitle={media ? pickTitle(media.title) : `Episode ${episode}`}
              />
            )}
          </div>

          {/* Episodes column — matches player height on lg, scrolls internally */}
          <div className="flex min-w-0 flex-col lg:h-full lg:max-h-full lg:min-h-0">
            {mapping.isLoading ? (
              <EpisodesPanelSkeleton view="thumbnail" count={6} />
            ) : (
              <EpisodesPanel
                episodes={airedEpisodes}
                currentEp={episode}
                onSelect={handleSelect}
                fallbackImage={
                  media?.bannerImage ||
                  media?.coverImage?.extraLarge ||
                  media?.coverImage?.large ||
                  undefined
                }
              />
            )}
          </div>
        </div>
      )}

      {/* Anime info card — below player + episodes */}
      {!showEmpty && (
        <div className="mx-auto max-w-none px-6 lg:px-10">
          <AnimeInfoCard isLoading={anime.isLoading} media={media} />
        </div>
      )}
    </div>
  );
}

/* --------------------------- Anime info card --------------------------- */

function AnimeInfoCard({
  isLoading,
  media,
}: {
  isLoading: boolean;
  media: AniListMedia | undefined;
}) {
  if (isLoading || !media) {
    return (
      <div className="border border-border bg-card p-4 md:p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="h-64 w-44 shrink-0 shimmer border border-border" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-1/2 bg-muted" />
            <div className="h-3 w-1/3 bg-muted" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-16 border border-border" />
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-2 w-full bg-muted" />
              <div className="h-2 w-11/12 bg-muted" />
              <div className="h-2 w-10/12 bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const title = pickTitle(media.title);
  const secondary =
    media.title.native && media.title.native !== title
      ? media.title.native
      : media.title.romaji && media.title.romaji !== title
        ? media.title.romaji
        : "";
  const cover =
    media.coverImage?.large || media.coverImage?.extraLarge || FALLBACK_COVER;
  const studio = media.studios?.nodes?.[0]?.name ?? "—";
  const description = stripHtml(media.description);

  const rows: [string, string][] = [
    ["Format", media.format ?? "—"],
    ["Status", media.status ?? "—"],
    ["Start Date", fmtDate(media.startDate)],
    ["End Date", fmtDate(media.endDate)],
    ["Episodes", media.episodes != null ? String(media.episodes) : "—"],
    ["Duration", media.duration ? `${media.duration} min` : "—"],
    ["Season", media.season ? `${media.season}${media.seasonYear ? " " + media.seasonYear : ""}` : "—"],
    ["Studio", studio],
    [
      "Rating",
      media.averageScore != null ? `${media.averageScore} / 100` : "—",
    ],
  ];

  return (
    <div className="border border-border bg-card p-4 md:p-6">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Cover + actions */}
        <div className="flex shrink-0 flex-col items-center gap-2">
          <img
            src={cover}
            alt={title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_COVER;
            }}
            className="h-64 w-44 border border-border object-cover"
          />
          <Link
            to="/anime/$id"
            params={{ id: String(media.id) }}
            className="inline-flex w-full items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-[0.6rem] uppercase tracking-widest text-foreground hover:bg-accent"
          >
            <Info className="h-3 w-3" /> full details
          </Link>
        </div>

        {/* Meta */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-foreground md:text-2xl">
            {title}
          </h1>
          {secondary && (
            <div className="mt-1 truncate text-xs italic text-muted-foreground">
              {secondary}
            </div>
          )}

          {/* Genres */}
          {media.genres?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {media.genres.map((g) => (
                <span
                  key={g}
                  className="border border-border bg-background px-2 py-1 text-[0.6rem] uppercase tracking-widest text-muted-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {description ? (
            <p className="mt-4 max-h-40 overflow-y-auto border border-dashed border-border p-3 text-xs leading-relaxed text-card-foreground">
              {description}
            </p>
          ) : (
            <p className="mt-4 text-xs italic text-muted-foreground">
              no synopsis available.
            </p>
          )}

          {/* Info grid */}
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="w-24 shrink-0 text-muted-foreground">{k}:</span>
                <span className="truncate font-medium text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
