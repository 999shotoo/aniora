import type { AniListMedia } from "@/lib/anilist";
import { AnimeCard } from "./anime-card";

interface Props {
  title: string;
  hint?: string;
  media: AniListMedia[];
  loading?: boolean;
}

export function AnimeRow({ title, hint, media, loading }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          ~$ {title}
        </h2>
        {hint && (
          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
            {hint}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] w-full animate-pulse border border-border bg-card"
            />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="border border-dashed border-border px-4 py-8 text-center text-xs uppercase tracking-widest text-muted-foreground">
          no results
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {media.map((m) => (
            <AnimeCard key={m.id} media={m} />
          ))}
        </div>
      )}
    </section>
  );
}
