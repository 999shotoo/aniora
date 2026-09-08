import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { browseAnime, type AniListMedia } from "@/lib/anilist";
import { Hero } from "@/components/hero";
import { AnimeRow } from "@/components/anime-row";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function currentSeason(): { season: string; year: number } {
  const now = new Date();
  const m = now.getMonth();
  const season =
    m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
  return { season, year: now.getFullYear() };
}

function HomePage() {
  const { season, year } = currentSeason();

  const trending = useQuery({
    queryKey: ["home", "trending"],
    queryFn: () =>
      browseAnime({ sort: ["TRENDING_DESC"], page: 1, perPage: 12 }),
    staleTime: 5 * 60_000,
  });
  const popular = useQuery({
    queryKey: ["home", "popular"],
    queryFn: () =>
      browseAnime({ sort: ["POPULARITY_DESC"], page: 1, perPage: 12 }),
    staleTime: 5 * 60_000,
  });
  const seasonal = useQuery({
    queryKey: ["home", "seasonal", season, year],
    queryFn: () =>
      browseAnime({
        sort: ["POPULARITY_DESC"],
        season,
        seasonYear: year,
        page: 1,
        perPage: 12,
      }),
    staleTime: 5 * 60_000,
  });
  const topRated = useQuery({
    queryKey: ["home", "top-rated"],
    queryFn: () =>
      browseAnime({ sort: ["SCORE_DESC"], page: 1, perPage: 12 }),
    staleTime: 5 * 60_000,
  });

  const featured: AniListMedia[] =
    (trending.data ?? popular.data ?? []).slice(0, 6);

  return (
    <>
      <Hero items={featured} />

      <div className="mx-auto max-w-none px-6 lg:px-10 pt-6">
        <div className="flex items-center justify-between border border-border bg-card px-3 py-2 text-[0.65rem] uppercase tracking-widest">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-chart-1" />
            live_index
          </span>
          <span className="text-muted-foreground/70">
            {season.toLowerCase()} {year} · auto-refreshed
          </span>
        </div>
      </div>

      <AnimeRow
        title="ls trending/"
        hint={`${trending.data?.length ?? 0} results`}
        media={trending.data ?? []}
        loading={trending.isLoading}
      />
      <AnimeRow
        title={`ls seasonal/${season.toLowerCase()}-${year}`}
        hint={`${seasonal.data?.length ?? 0} results`}
        media={seasonal.data ?? []}
        loading={seasonal.isLoading}
      />
      <AnimeRow
        title="ls popular/"
        hint={`${popular.data?.length ?? 0} results`}
        media={popular.data ?? []}
        loading={popular.isLoading}
      />
      <AnimeRow
        title="ls top-rated/"
        hint={`${topRated.data?.length ?? 0} results`}
        media={topRated.data ?? []}
        loading={topRated.isLoading}
      />
    </>
  );
}
