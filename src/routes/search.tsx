import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { searchAnime, browseAnime } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime-card";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Search — Zen Stream" },
      { name: "description", content: "Search anime powered by AniList." },
    ],
  }),
});

const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

const FORMATS = ["ANY", "TV", "MOVIE", "OVA", "ONA", "SPECIAL"];

function SearchPage() {
  const [q, setQ] = useState("");
  const [format, setFormat] = useState<string>("ANY");
  const [genre, setGenre] = useState<string>("");

  const active = q.trim().length > 0;

  const results = useQuery({
    queryKey: ["search", q, format, genre],
    queryFn: () =>
      active
        ? searchAnime(q, {
            format: format === "ANY" ? undefined : format,
            perPage: 40,
          })
        : browseAnime({
            sort: ["TRENDING_DESC"],
            format: format === "ANY" ? undefined : format,
            genre: genre || undefined,
            perPage: 40,
          }),
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
        <h1 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          ~$ ./search --anilist
        </h1>
        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
          {results.data?.length ?? 0} results
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center border border-border bg-input">
          <SearchIcon className="ml-3 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="query anime title, e.g. 'frieren'"
            className="w-full bg-transparent px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex border border-border">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={
                  "px-3 py-1.5 text-[0.6rem] uppercase tracking-widest transition-colors " +
                  (format === f
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {f.toLowerCase()}
              </button>
            ))}
          </div>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="border border-border bg-input px-3 py-1.5 text-[0.6rem] uppercase tracking-widest text-foreground"
          >
            <option value="">any genre</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {results.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] w-full animate-pulse border border-border bg-card"
            />
          ))}
        </div>
      ) : results.isError ? (
        <div className="border border-destructive/40 bg-card px-4 py-6 text-xs text-destructive">
          error: {(results.error as Error).message}
        </div>
      ) : (results.data ?? []).length === 0 ? (
        <div className="border border-dashed border-border px-4 py-10 text-center text-xs uppercase tracking-widest text-muted-foreground">
          no matches. try another query.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(results.data ?? []).map((m) => (
            <AnimeCard key={m.id} media={m} />
          ))}
        </div>
      )}
    </div>
  );
}
