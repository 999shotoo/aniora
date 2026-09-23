import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, CalendarClock, Sparkles } from "lucide-react";
import { anilistFetch, browseAnime, type AniListMedia } from "@/lib/anilist";
import { Hero } from "@/components/hero";
import { AnimeRow } from "@/components/anime-row";
import { SideCard } from "@/components/side-card";
import { WatchHistoryRow } from "@/components/watch-history-row";

import { useSetting } from "@/lib/settings";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Aniora — Watch Anime Free Online in HD (Sub & Dub)" },
      {
        name: "description",
        content:
          "Watch anime free on Aniora — stream trending, seasonal, and classic anime online in HD with sub or dub. Free anime streaming site with AniList sync, no signup.",
      },
      { property: "og:title", content: "Aniora — Watch Anime Free Online in HD (Sub & Dub)" },
      {
        property: "og:description",
        content:
          "Free anime streaming with AniList sync. Watch trending, seasonal, and classic anime — sub or dub — in HD.",
      },
      { property: "og:url", content: "https://aniora.qzz.io/" },
    ],
    links: [{ rel: "canonical", href: "https://aniora.qzz.io/" }],
  }),
});

function currentSeason(): { season: string; year: number } {
  const now = new Date();
  const m = now.getMonth();
  const season =
    m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
  return { season, year: now.getFullYear() };
}

const AIRING_FIELDS = `
  id idMal
  title { romaji english native userPreferred }
  coverImage { extraLarge large medium color }
  format seasonYear episodes averageScore
  nextAiringEpisode { airingAt episode timeUntilAiring }
`;

async function fetchTopAiring(): Promise<AniListMedia[]> {
  const gql = `
    query {
      Page(page: 1, perPage: 6) {
        media(
          type: ANIME
          status: RELEASING
          sort: POPULARITY_DESC
          isAdult: false
        ) { ${AIRING_FIELDS} }
      }
    }
  `;
  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(gql);
  return data.Page.media;
}

async function fetchUpcoming(): Promise<AniListMedia[]> {
  const gql = `
    query {
      Page(page: 1, perPage: 6) {
        media(
          type: ANIME
          status: NOT_YET_RELEASED
          sort: POPULARITY_DESC
          isAdult: false
        ) { ${AIRING_FIELDS} }
      }
    }
  `;
  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(gql);
  return data.Page.media;
}

function HomePage() {
  const { season, year } = currentSeason();
  const showHistory = useSetting("showWatchHistoryHome");

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

  const topAiring = useQuery({
    queryKey: ["home", "top-airing"],
    queryFn: fetchTopAiring,
    staleTime: 5 * 60_000,
  });
  const upcoming = useQuery({
    queryKey: ["home", "upcoming"],
    queryFn: fetchUpcoming,
    staleTime: 15 * 60_000,
  });

  const featured: AniListMedia[] =
    (trending.data ?? popular.data ?? []).slice(0, 6);

  return (
    <>
      <h1 className="sr-only">
        Aniora — Watch anime free online in HD, sub and dub, with AniList sync
      </h1>
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

      {/* Main + Sidebar layout */}
      <div className="mx-auto grid max-w-none gap-6 px-6 lg:px-10 py-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          {showHistory && <WatchHistoryRow />}
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
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <SideCard
            title="top airing"
            icon={<Flame className="h-3 w-3 text-chart-1" />}
            items={topAiring.data ?? []}
            loading={topAiring.isLoading}
            showAiring
          />
          <SideCard
            title="upcoming"
            icon={<CalendarClock className="h-3 w-3 text-chart-2" />}
            items={upcoming.data ?? []}
            loading={upcoming.isLoading}
          />
          <SideCard
            title="top rated"
            icon={<Sparkles className="h-3 w-3 text-chart-3" />}
            items={topRated.data ?? []}
            loading={topRated.isLoading}
          />
          
        </aside>
      </div>
    </>
  );
}
