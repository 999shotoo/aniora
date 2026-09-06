import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Info, Search, TvMinimal } from "lucide-react";
import {
  getAnimeById,
  FALLBACK_COVER,
  pickTitle,
} from "@/lib/anilist";
import { fetchMapping, splitEpisodes, isAired } from "@/lib/mappings";
import { Player } from "@/components/player";
import { EpisodeList } from "@/components/episode-list";
import { EmptyState, BackHomeAction } from "@/components/empty-state";
import { EpisodeRowSkeleton, PlayerSkeleton, Skeleton } from "@/components/skeleton";


export const Route = createFileRoute("/watch/$id")({
  component: WatchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    ep: search.ep ? Number(search.ep) : undefined,
  }),
});

function WatchPage() {
  const { id } = Route.useParams();
  const { ep: epParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const anilistId = Number(id);
  const [episode, setEpisode] = useState<number>(epParam ?? 1);
  const [query, setQuery] = useState("");

  const anime = useQuery({
    queryKey: ["anime", anilistId],
    queryFn: () => getAnimeById(anilistId),
    staleTime: 10 * 60_000,
    enabled: Number.isFinite(anilistId),
  });

  const mapping = useQuery({
    queryKey: ["mapping", anilistId],
    queryFn: () => fetchMapping(anilistId),
    staleTime: 15 * 60_000,
    enabled: Number.isFinite(anilistId),
  });

  const { regular, specials } = useMemo(
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

  const filteredEpisodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return airedEpisodes;
    return airedEpisodes.filter((e) => {
      const t = (e.title?.en || e.nameTvdb || "").toLowerCase();
      return t.includes(q) || String(e.episodeNumber).includes(q);
    });
  }, [airedEpisodes, query]);

  // Once episodes load, snap to a valid one.
  useEffect(() => {
    if (airedEpisodes.length === 0) return;
    if (airedEpisodes.some((e) => e.episodeNumber === episode)) return;
    setEpisode(airedEpisodes[0].episodeNumber ?? 1);
  }, [airedEpisodes, episode]);

  useEffect(() => {
    navigate({
      search: { ep: episode },
      replace: true,
    }).catch(() => {});
  }, [episode, navigate]);

  if (anime.isLoading) {
    return (
      <div className="pb-16">
        <div className="border-b border-border bg-card/40">
          <div className="mx-auto flex max-w-none items-center gap-3 px-6 lg:px-10 py-4">
            <Skeleton className="h-12 w-9" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-2 w-20 border-0 bg-muted" />
              <Skeleton className="h-3 w-56 border-0 bg-muted" />
            </div>
          </div>
        </div>
        <div className="mx-auto grid max-w-none grid-cols-1 gap-6 px-6 lg:px-10 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <PlayerSkeleton />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <EpisodeRowSkeleton key={i} />
            ))}
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
          message="AniList didn't answer. Check the id or your connection and try again."
          actions={<BackHomeAction />}
        />
      </div>
    );
  }


  const media = anime.data;
  const title = pickTitle(media.title);
  const currentEp = airedEpisodes.find((e) => e.episodeNumber === episode);
  const malId = mapping.data?.mappings?.mal_id ?? media.idMal ?? null;

  const totalAired = airedEpisodes.length;
  const totalPlanned = media.episodes ?? null;

  return (
    <div className="pb-16">
      {/* top bar */}
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-none flex-col gap-3 px-6 lg:px-10 py-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={media.coverImage?.medium || media.coverImage?.large || FALLBACK_COVER}
              alt=""
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_COVER;
              }}
              className="h-12 w-9 shrink-0 border border-border object-cover"
            />
            <div className="min-w-0">
              <div className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                now watching
              </div>
              <h1 className="truncate text-sm font-medium sm:text-base">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Link
              to="/anime/$id"
              params={{ id: String(media.id) }}
              className="inline-flex items-center gap-2 border border-border bg-background/60 px-3 py-2 text-[0.65rem] uppercase tracking-widest text-foreground hover:bg-accent"
            >
              <Info className="h-3.5 w-3.5" /> info
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 border border-border bg-background/60 px-3 py-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> back
            </Link>
          </div>
        </div>
      </div>

      {/* No episodes at all → full-width big empty card */}
      {!mapping.isLoading && airedEpisodes.length === 0 && specials.length === 0 ? (
        <div className="mx-auto max-w-none px-6 lg:px-10 py-10">
          <EmptyState
            variant="large"
            hint="~$ ls episodes/ → 0 results"
            icon={
              media.status === "NOT_YET_RELEASED" ? (
                <CalendarClock className="h-7 w-7" />
              ) : (
                <TvMinimal className="h-7 w-7" />
              )
            }
            title={
              media.status === "NOT_YET_RELEASED"
                ? "This title hasn't premiered yet"
                : "No episodes are available"
            }
            message={
              media.status === "NOT_YET_RELEASED"
                ? "Nothing has aired. Bookmark it and we'll surface episodes the moment they drop."
                : "We couldn't find any aired episodes for this title. Try again later or explore something else."
            }
            actions={
              <>
                <Link
                  to="/anime/$id"
                  params={{ id: String(media.id) }}
                  className="border border-border bg-background px-4 py-2 text-[0.65rem] uppercase tracking-widest text-foreground hover:bg-accent"
                >
                  view details
                </Link>
                <BackHomeAction />
              </>
            }
          />
        </div>
      ) : (
        <div className="mx-auto grid max-w-none grid-cols-1 gap-6 px-6 lg:px-10 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            {mapping.isLoading ? (
              <PlayerSkeleton />
            ) : airedEpisodes.length === 0 ? (
              <EmptyState
                variant="large"
                hint="~$ stream --unavailable"
                icon={<TvMinimal className="h-6 w-6" />}
                title="No aired episodes yet"
                message="Episodes will appear here as soon as they air."
              />
            ) : (
              <div className="rise-in">
                <Player
                  malId={malId}
                  episode={episode}
                  ep={currentEp}
                  fallbackTitle={title}
                />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                ~$ ls episodes/
              </h2>
              <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
                {mapping.isLoading
                  ? "loading..."
                  : `${totalAired}${totalPlanned ? ` / ${totalPlanned}` : ""} aired`}
              </span>
            </div>

            {!mapping.isLoading && airedEpisodes.length > 4 && (
              <div className="mb-3 flex items-center gap-2 border border-border bg-card px-3 py-2 focus-within:border-foreground">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="filter episodes..."
                  className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-[0.6rem] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    clear
                  </button>
                )}
              </div>
            )}

            {mapping.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <EpisodeRowSkeleton key={i} />
                ))}
              </div>
            ) : filteredEpisodes.length === 0 && query ? (
              <div className="border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
                no episodes match "{query}"
              </div>
            ) : (
              <EpisodeList
                episodes={filteredEpisodes}
                currentEp={episode}
                onSelect={setEpisode}
                airedOnly
              />
            )}

            {specials.length > 0 && (
              <>
                <div className="mb-2 mt-6 border-b border-border pb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  ~$ ls extras/
                </div>
                <div className="grid gap-2">
                  {specials.map((s) => (
                    <div
                      key={s.episode}
                      className="border border-border bg-card px-3 py-2 text-xs text-card-foreground transition-colors hover:border-muted-foreground"
                    >
                      <div className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                        {s.type} · {s.episode}
                      </div>
                      <div>{s.title?.en || s.nameTvdb || "Extra"}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

        </div>
      </div>
    </div>
  );
}
