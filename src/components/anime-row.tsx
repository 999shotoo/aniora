import type { AniListMedia } from "@/lib/anilist";
import { AnimeCard } from "./anime-card";
import { GridSkeleton } from "./skeleton";
import { EmptyState } from "./empty-state";
import { SearchX } from "lucide-react";

interface Props {
  title: string;
  hint?: string;
  media: AniListMedia[];
  loading?: boolean;
}

export function AnimeRow({ title, hint, media, loading }: Props) {
  return (
    <section className="w-full">
      <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          ~$ {title}
        </h2>
        {hint && (
          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
            {loading ? "loading..." : hint}
          </span>
        )}
      </div>

      {loading ? (
        <GridSkeleton count={12} />
      ) : media.length === 0 ? (
        <EmptyState
          hint="~$ query --empty"
          icon={<SearchX className="h-5 w-5" />}
          title="Nothing here yet"
          message="AniList returned no results for this shelf. Try again in a bit."
        />
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
          {media.map((m, i) => (
            <div
              key={m.id}
              className="rise-in"
              style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
            >
              <AnimeCard media={m} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
