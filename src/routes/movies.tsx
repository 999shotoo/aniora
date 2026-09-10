import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { browseAnime } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime-card";
import { CardSkeleton, GridSkeleton } from "@/components/skeleton";

export const Route = createFileRoute("/movies")({
  component: MoviesPage,
  head: () => ({
    meta: [
      { title: "Movies — Zen Stream" },
      { name: "description", content: "Browse anime films by popularity, rating, or release." },
    ],
  }),
});

const TABS = [
  { key: "popular", label: "popular", sort: ["POPULARITY_DESC"] },
  { key: "top", label: "top rated", sort: ["SCORE_DESC"] },
  { key: "trending", label: "trending", sort: ["TRENDING_DESC"] },
  { key: "recent", label: "recent", sort: ["START_DATE_DESC"] },
] as const;

const PER_PAGE = 32;

function MoviesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("popular");
  const current = TABS.find((t) => t.key === tab)!;

  const q = useInfiniteQuery({
    queryKey: ["movies-infinite", tab],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      browseAnime({
        sort: current.sort,
        format: "MOVIE",
        page: pageParam,
        perPage: PER_PAGE,
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PER_PAGE ? undefined : allPages.length + 1,
    staleTime: 5 * 60_000,
  });

  const items = q.data?.pages.flat() ?? [];
  const sentinel = useSentinel(() => {
    if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
  });

  return (
    <div className="mx-auto max-w-none px-6 lg:px-10 py-6">
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
        <h1 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          ~$ ls movies/
        </h1>
        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
          {items.length} loaded
        </span>
      </div>

      <div className="mb-6 flex flex-wrap border border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "px-3 py-1.5 text-[0.6rem] uppercase tracking-widest transition-colors " +
              (tab === t.key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <GridSkeleton count={24} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
            {items.map((m) => (
              <AnimeCard key={m.id} media={m} />
            ))}
            {q.isFetchingNextPage &&
              Array.from({ length: 16 }).map((_, i) => (
                <CardSkeleton key={`sk-${i}`} />
              ))}
          </div>
          {q.hasNextPage && <div ref={sentinel} className="h-16" />}
          {!q.hasNextPage && items.length > 0 && (
            <p className="mt-6 text-center font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
              ~$ end of stream
            </p>
          )}
        </>
      )}
    </div>
  );
}

function useSentinel(onHit: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onHit();
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onHit]);
  return ref;
}
