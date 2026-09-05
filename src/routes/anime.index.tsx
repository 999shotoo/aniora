import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { browseAnime } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime-card";

export const Route = createFileRoute("/anime")({
  component: AnimePage,
  head: () => ({
    meta: [
      { title: "Anime — Zen Stream" },
      { name: "description", content: "Browse trending, popular, and seasonal anime series." },
    ],
  }),
});

const TABS = [
  { key: "trending", label: "trending", sort: ["TRENDING_DESC"] },
  { key: "popular", label: "popular", sort: ["POPULARITY_DESC"] },
  { key: "top", label: "top rated", sort: ["SCORE_DESC"] },
  { key: "recent", label: "recent", sort: ["START_DATE_DESC"] },
] as const;

function AnimePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("trending");
  const current = TABS.find((t) => t.key === tab)!;

  const list = useQuery({
    queryKey: ["anime", tab],
    queryFn: () =>
      browseAnime({
        sort: current.sort,
        format: "TV",
        perPage: 40,
      }),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
        <h1 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          ~$ ls anime/ --tv
        </h1>
        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
          {list.data?.length ?? 0} results
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

      {list.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] w-full animate-pulse border border-border bg-card"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(list.data ?? []).map((m) => (
            <AnimeCard key={m.id} media={m} />
          ))}
        </div>
      )}
    </div>
  );
}
