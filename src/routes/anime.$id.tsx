import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Calendar, Play } from "lucide-react";
import {
  getAnimeById,
  FALLBACK_BANNER,
  FALLBACK_COVER,
  pickTitle,
} from "@/lib/anilist";
import { fetchMapping, splitEpisodes } from "@/lib/mappings";
import { useWishlist } from "@/lib/wishlist";
import { Player } from "@/components/player";
import { EpisodeList } from "@/components/episode-list";
import { Bookmark, BookmarkCheck } from "lucide-react";

export const Route = createFileRoute("/anime/$id")({
  component: AnimeDetailPage,
});

function AnimeDetailPage() {
  const { id } = Route.useParams();
  const anilistId = Number(id);
  const [episode, setEpisode] = useState(1);

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

  const { has, toggle } = useWishlist();

  if (anime.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-72 w-full animate-pulse border border-border bg-card" />
      </div>
    );
  }

  if (anime.isError || !anime.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="border border-destructive/50 bg-card px-4 py-6 text-xs text-destructive">
          could not load anime. {(anime.error as Error | null)?.message}
        </div>
        <Link
          to="/"
          className="mt-4 inline-block text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← back home
        </Link>
      </div>
    );
  }

  const media = anime.data;
  const title = pickTitle(media.title);
  const banner =
    media.bannerImage ||
    media.coverImage?.extraLarge ||
    FALLBACK_BANNER;
  const desc = (media.description || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
  const saved = has(media.id);

  const { regular, specials } = splitEpisodes(mapping.data ?? null);
  const currentMappingEp = regular.find((e) => e.episodeNumber === episode);
  const malId = mapping.data?.mappings?.mal_id ?? media.idMal ?? null;

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
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row">
          <img
            src={media.coverImage?.large || FALLBACK_COVER}
            alt={title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_COVER;
            }}
            className="aspect-[2/3] w-32 shrink-0 border border-border object-cover sm:w-40 md:w-48"
          />
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              {media.format && <span>{media.format}</span>}
              {media.status && <span>· {media.status.toLowerCase()}</span>}
              {media.seasonYear && (
                <span className="inline-flex items-center gap-1">
                  · <Calendar className="h-3 w-3" /> {media.seasonYear}
                </span>
              )}
              {media.averageScore && (
                <span className="inline-flex items-center gap-1">
                  · <Star className="h-3 w-3" /> {(media.averageScore / 10).toFixed(1)}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-medium sm:text-3xl md:text-4xl">
              {title}
            </h1>
            {media.title.native && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {media.title.native}
              </p>
            )}
            {media.genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {media.genres.slice(0, 6).map((g) => (
                  <span
                    key={g}
                    className="border border-border bg-card px-2 py-0.5 text-[0.55rem] uppercase tracking-widest text-muted-foreground"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setEpisode(1)}
                className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-[0.7rem] uppercase tracking-widest text-background"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> watch ep 1
              </button>
              <button
                onClick={() => toggle(media)}
                className="inline-flex items-center gap-2 border border-border bg-background/60 px-4 py-2 text-[0.7rem] uppercase tracking-widest text-foreground hover:bg-accent"
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
            </div>
          </div>
        </div>
      </div>

      {/* player + episodes */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <Player
            malId={malId}
            episode={episode}
            ep={currentMappingEp}
            fallbackTitle={title}
          />

          {desc && (
            <div className="mt-6 border border-border bg-card p-4">
              <div className="mb-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                ~$ cat synopsis.md
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-card-foreground">
                {desc}
              </p>
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
                : `${regular.length}${
                    media.episodes ? ` / ${media.episodes}` : ""
                  }`}
            </span>
          </div>

          {mapping.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse border border-border bg-card"
                />
              ))}
            </div>
          ) : regular.length === 0 && !media.episodes ? (
            <div className="border border-dashed border-border px-4 py-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
              no episode data
            </div>
          ) : (
            <EpisodeList
              episodes={regular}
              totalPlanned={media.episodes}
              currentEp={episode}
              onSelect={setEpisode}
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
                    className="border border-border bg-card px-3 py-2 text-xs text-card-foreground"
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
