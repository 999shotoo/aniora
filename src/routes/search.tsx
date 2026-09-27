import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search as SearchIcon, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { searchAnime, browseAnime } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime-card";
import { GridSkeleton } from "@/components/skeleton";
import { EmptyState, BackHomeAction } from "@/components/empty-state";

type SearchState = {
  q: string;
  format: string;
  genre: string;
  year: string;
  status: string;
  sort: string;
};

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>): SearchState => ({
    q: typeof search.q === "string" ? search.q : "",
    format: typeof search.format === "string" ? search.format : "ANY",
    genre: typeof search.genre === "string" ? search.genre : "",
    year: typeof search.year === "string" ? search.year : "",
    status: typeof search.status === "string" ? search.status : "",
    sort: typeof search.sort === "string" ? search.sort : "TRENDING_DESC",
  }),
  head: () => ({
    meta: [
      { title: "Search Anime — Aniora" },
      {
        name: "description",
        content:
          "Search anime by title, genre, format, year, and score. Free HD streaming with sub or dub on Aniora.",
      },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Search Anime — Aniora" },
      { property: "og:description", content: "Find anime by title, genre, year, and more." },
      { property: "og:url", content: "https://aniora.qzz.io/search" },
      { property: "og:image", content: "https://aniora.qzz.io/og.png" },
      { name: "twitter:image", content: "https://aniora.qzz.io/og.png" },
    ],
    links: [{ rel: "canonical", href: "https://aniora.qzz.io/search" }],
  }),
});


const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror",
  "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance",
  "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];

const FORMATS = ["ANY", "TV", "TV_SHORT", "MOVIE", "OVA", "ONA", "SPECIAL", "MUSIC"];

const STATUSES = [
  { v: "", l: "any status" },
  { v: "RELEASING", l: "releasing" },
  { v: "FINISHED", l: "finished" },
  { v: "NOT_YET_RELEASED", l: "upcoming" },
  { v: "CANCELLED", l: "cancelled" },
  { v: "HIATUS", l: "hiatus" },
];

const SORTS = [
  { v: "TRENDING_DESC", l: "trending" },
  { v: "POPULARITY_DESC", l: "popularity" },
  { v: "SCORE_DESC", l: "top rated" },
  { v: "START_DATE_DESC", l: "newest" },
  { v: "START_DATE", l: "oldest" },
  { v: "EPISODES_DESC", l: "most episodes" },
];

const YEARS = (() => {
  const now = new Date().getFullYear() + 1;
  const arr: string[] = [];
  for (let y = now; y >= 1970; y--) arr.push(String(y));
  return arr;
})();

function SearchPage() {
  const state = Route.useSearch();
  const { q: qParam, format: fParam, genre: gParam, year: yParam, status: sParam, sort: sortParam } = state;
  const navigate = Route.useNavigate();

  const [q, setQ] = useState(qParam);
  useEffect(() => setQ(qParam), [qParam]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== qParam) {
        navigate({
          search: (prev: SearchState) => ({ ...prev, q }),
          replace: true,
        }).catch(() => {});
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, qParam, navigate]);

  const patch = (p: Partial<SearchState>) =>
    navigate({ search: (prev: SearchState) => ({ ...prev, ...p }), replace: true }).catch(() => {});

  const reset = () =>
    navigate({
      search: () => ({ q: "", format: "ANY", genre: "", year: "", status: "", sort: "TRENDING_DESC" }),
      replace: true,
    }).catch(() => {});

  const active = qParam.trim().length > 0;
  const hasFilters =
    fParam !== "ANY" || gParam || yParam || sParam || sortParam !== "TRENDING_DESC";

  const results = useQuery({
    queryKey: ["search", qParam, fParam, gParam, yParam, sParam, sortParam],
    queryFn: () =>
      active
        ? searchAnime(qParam, {
            format: fParam === "ANY" ? undefined : fParam,
            perPage: 48,
          })
        : browseAnime({
            sort: [sortParam],
            format: fParam === "ANY" ? undefined : fParam,
            genre: gParam || undefined,
            status: sParam || undefined,
            seasonYear: yParam ? Number(yParam) : undefined,
            perPage: 48,
          }),
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto max-w-none px-6 lg:px-10 py-6">
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
        <h1 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          ~$ ./search --anilist
        </h1>
        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
          {results.isFetching ? "searching…" : `${results.data?.length ?? 0} results`}
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        {/* Search input */}
        <div className="flex items-center border border-border bg-input focus-within:border-foreground">
          <SearchIcon className="ml-3 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="query anime title, e.g. 'frieren'"
            className="w-full bg-transparent px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="mr-2 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-2 gap-2 border border-border bg-card p-2 sm:grid-cols-3 md:grid-cols-6">
          <FilterField label="genre">
            <select
              value={gParam}
              onChange={(e) => patch({ genre: e.target.value })}
              className="filter-select"
            >
              <option value="">any</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g.toLowerCase()}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="year">
            <select
              value={yParam}
              onChange={(e) => patch({ year: e.target.value })}
              className="filter-select"
            >
              <option value="">any</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="status">
            <select
              value={sParam}
              onChange={(e) => patch({ status: e.target.value })}
              className="filter-select"
            >
              {STATUSES.map((s) => (
                <option key={s.v} value={s.v}>{s.l}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="format">
            <select
              value={fParam}
              onChange={(e) => patch({ format: e.target.value })}
              className="filter-select"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f.toLowerCase().replace("_", " ")}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="sort">
            <select
              value={sortParam}
              onChange={(e) => patch({ sort: e.target.value })}
              disabled={active}
              className="filter-select disabled:opacity-40"
            >
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>{s.l}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label={hasFilters ? "reset" : "filters"}>
            <button
              onClick={reset}
              disabled={!hasFilters}
              className="flex h-full w-full items-center justify-center gap-1.5 border border-border bg-input px-2 py-1.5 text-[0.65rem] uppercase tracking-widest text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {hasFilters ? <RotateCcw className="h-3 w-3" /> : <SlidersHorizontal className="h-3 w-3" />}
              {hasFilters ? "reset" : "active"}
            </button>
          </FilterField>
        </div>
      </div>

      {results.isLoading ? (
        <GridSkeleton count={24} />
      ) : results.isError ? (
        <EmptyState
          variant="large"
          hint="~$ search --error"
          title="Search failed"
          message={(results.error as Error).message}
          actions={<BackHomeAction />}
        />
      ) : (results.data ?? []).length === 0 ? (
        <EmptyState
          variant="large"
          hint="~$ grep --no-match"
          title={active ? `No results for "${qParam}"` : "Nothing matched those filters"}
          message="Try a different query or loosen the filters."
        />
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
          {(results.data ?? []).map((m, i) => (
            <div key={m.id} className="rise-in" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
              <AnimeCard media={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.55rem] uppercase tracking-widest text-muted-foreground/80">
        {label}
      </span>
      {children}
    </label>
  );
}
