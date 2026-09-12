import { createFileRoute, Link } from "@tanstack/react-router";
import { History, Trash2, X } from "lucide-react";
import { FALLBACK_COVER } from "@/lib/anilist";
import { useWatchHistory } from "@/lib/watched";
import { FALLBACK_EP_IMAGE } from "@/components/player";
import { SmartImage } from "@/components/smart-image";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Watch History — Zen Stream" },
      {
        name: "description",
        content: "Everything you've watched, stored locally in your browser.",
      },
    ],
  }),
});

function relativeTime(ts: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toISOString().slice(0, 10);
}

function HistoryPage() {
  const { items, remove, clear } = useWatchHistory(500);

  return (
    <div className="mx-auto max-w-none px-6 lg:px-10 py-6">
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <h1 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            ~$ cat watch-history.log
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
            {items.length} episodes · local
          </span>
          {items.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Clear entire watch history?")) clear();
              }}
              className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[0.6rem] uppercase tracking-widest text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" /> clear
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-border px-6 py-16 text-center">
          <History className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            no episodes watched yet
          </p>
          <Link
            to="/"
            className="mt-2 inline-flex items-center border border-foreground bg-foreground px-6 py-2 text-[0.7rem] uppercase tracking-widest text-background"
          >
            start watching
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {items.map((item) => {
            const image =
              item.episodeImage ||
              item.animeCover ||
              item.animePoster ||
              FALLBACK_EP_IMAGE;
            return (
              <div
                key={`${item.animeId}-${item.episode}-${item.watchedAt}`}
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
                      fallback={
                        item.animePoster || item.animeCover || FALLBACK_COVER
                      }
                      alt={item.episodeTitle}
                      className="h-full w-full"
                    />
                    <div className="absolute bottom-1 left-1 border border-border bg-background/90 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-foreground backdrop-blur">
                      ep {item.episode}
                    </div>
                    <div className="absolute right-1 top-1 border border-border bg-background/90 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground backdrop-blur">
                      {relativeTime(item.watchedAt)}
                    </div>
                  </div>
                  <div className="space-y-0.5 p-1.5">
                    <p className="line-clamp-1 text-[0.7rem] font-semibold text-foreground">
                      {item.animeTitle}
                    </p>
                    <p className="line-clamp-1 text-[0.6rem] text-muted-foreground">
                      {item.episodeTitle}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => remove(item.animeId, item.episode)}
                  aria-label="Remove from watch history"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center border border-border bg-background/85 text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-foreground group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
