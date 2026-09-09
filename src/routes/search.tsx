import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { searchAnime, browseAnime } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime-card";
import { GridSkeleton } from "@/components/skeleton";
import { EmptyState, BackHomeAction } from "@/components/empty-state";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    format: typeof search.format === "string" ? search.format : "ANY",
    genre: typeof search.genre === "string" ? search.genre : "",
  }),
  head: () => ({
    meta: [
      { title: "Search — Zen Stream" },
      { name: "description", content: "Search anime powered by AniList." },
    ],
  }),
});

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life",
  "Sports", "Supernatural", "Thriller",
];

const FORMATS = ["ANY", "TV", "MOVIE", "OVA", "ONA", "SPECIAL"];

function SearchPage() {
  const { q: qParam, format: fParam, genre: gParam } = Route.useSearch();
  const navigate = Route.useNavigate();

  // Local input state → debounced push into URL
  const [q, setQ] = useState(qParam);
  useEffect(() => setQ(qParam), [qParam]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== qParam) {
        navigate({
          search: ((prev: { q: string; format: string; genre: string }) => ({ ...prev, q })),
          replace: true,
        }).catch(() => {});
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, qParam, navigate]);

  const active = qParam.trim().length > 0;

  const results = useQuery({
    queryKey: ["search", qParam, fParam, gParam],
    queryFn: () =>
      active
        ? searchAnime(qParam, {
            format: fParam === "ANY" ? undefined : fParam,
            perPage: 40,
          })
        : browseAnime({
            sort: ["TRENDING_DESC"],
            format: fParam === "ANY" ? undefined : fParam,
            genre: gParam || undefined,
            perPage: 40,
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

        <div className="flex flex-wrap gap-2">
          <div className="flex border border-border">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() =>
                  navigate({ search: ((prev: { q: string; format: string; genre: string }) => ({ ...prev, format: f })), replace: true })
                }
                className={
                  "px-3 py-1.5 text-[0.6rem] uppercase tracking-widest transition-colors " +
                  (fParam === f
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {f.toLowerCase()}
              </button>
            ))}
          </div>
          <select
            value={gParam}
            onChange={(e) =>
              navigate({
                search: ((prev: { q: string; format: string; genre: string }) => ({ ...prev, genre: e.target.value })),
                replace: true,
              })
            }
            className="border border-border bg-input px-3 py-1.5 text-[0.6rem] uppercase tracking-widest text-foreground"
          >
            <option value="">any genre</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {results.isLoading ? (
        <GridSkeleton count={18} />
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
          title={active ? `No results for "${qParam}"` : "Nothing to show"}
          message="Try a different query, format, or genre."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
