import { Link } from "@tanstack/react-router";
import { ArrowRight, History, X } from "lucide-react";
import { FALLBACK_COVER } from "@/lib/anilist";
import { useWatchHistory } from "@/lib/watched";
import { FALLBACK_EP_IMAGE } from "./player";
import { SmartImage } from "./smart-image";

const HOME_LIMIT = 4;

export function WatchHistoryRow() {
  const { items, remove } = useWatchHistory(HOME_LIMIT + 4);

  if (items.length === 0) return null;
  const preview = items.slice(0, HOME_LIMIT);

  return (
    <section className="w-full">
      <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground/70">
              local · continue watching
            </p>
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground">
              watch history
            </h2>
          </div>
        </div>
        <Link
          to="/history"
          className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[0.6rem] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          view all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {preview.map((item) => {
          const image =
            item.episodeImage || item.animeCover || item.animePoster || FALLBACK_EP_IMAGE;
          return (
            <div
              key={`${item.animeId}-${item.episode}`}
              className="group relative border border-border bg-card"
            >
              <Link
                to="/watch/$id"
                params={{ id: String(item.animeId) }}
                search={{ ep: item.episode }}
                className="block"
              >
                <div className="relative aspect-video overflow-hidden bg-background">
                  <SmartImage
                    src={image}
                    fallback={item.animePoster || item.animeCover || FALLBACK_COVER}
                    alt={item.episodeTitle}
                    className="h-full w-full"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-muted">
                    <div className="h-full w-full bg-chart-1" />
                  </div>
                  <div className="absolute bottom-2 left-2 border border-border bg-background/90 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-foreground">
                    ep {item.episode}
                  </div>
                </div>
                <div className="space-y-1 p-2">
                  <p className="line-clamp-1 text-xs font-semibold text-foreground">
                    {item.animeTitle}
                  </p>
                  <p className="line-clamp-1 text-[0.65rem] text-muted-foreground">
                    {item.episodeTitle}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => remove(item.animeId, item.episode)}
                aria-label="Remove from watch history"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center border border-border bg-background/85 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
