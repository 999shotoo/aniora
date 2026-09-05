import { CheckCircle2, Clock, Play } from "lucide-react";
import { isAired, type MappingEpisode } from "@/lib/mappings";
import { FALLBACK_EP_IMAGE } from "./player";

interface Props {
  episodes: MappingEpisode[];
  currentEp: number;
  onSelect: (ep: number) => void;
  /** If true, upcoming/unaired episodes are excluded entirely. */
  airedOnly?: boolean;
}

function formatDate(raw?: string): string {
  if (!raw) return "";
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return raw;
  return new Date(t).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Renders the episode list. When `airedOnly` is true, only episodes whose
 * airDate is on/before today are shown — nothing in the future leaks in.
 */
export function EpisodeList({
  episodes,
  currentEp,
  onSelect,
  airedOnly = true,
}: Props) {
  const filtered = airedOnly
    ? episodes.filter((e) => {
        // If no airdate metadata, assume the episode is available.
        if (!e.airDate && !e.airdate) return true;
        return isAired(e);
      })
    : episodes;

  const rows = filtered
    .filter((e) => e.episodeNumber != null)
    .sort((a, b) => (a.episodeNumber! - b.episodeNumber!));

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-border px-4 py-10 text-center">
        <div className="mb-1 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          ~$ ls episodes/
        </div>
        <div className="text-xs text-muted-foreground">
          no aired episodes yet — check back soon
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((ep) => {
        const num = ep.episodeNumber!;
        const aired = isAired(ep) || !(ep.airDate || ep.airdate);
        const active = num === currentEp;
        const img = ep.image || FALLBACK_EP_IMAGE;
        const title = ep.title?.en || ep.nameTvdb || `Episode ${num}`;
        const date = formatDate(ep.airDate || ep.airdate);

        return (
          <button
            key={num}
            onClick={() => onSelect(num)}
            className={
              "group flex items-stretch gap-3 border text-left transition-colors " +
              (active
                ? "border-foreground bg-accent"
                : "border-border bg-card hover:border-muted-foreground")
            }
          >
            <div className="relative aspect-video w-32 shrink-0 overflow-hidden bg-background sm:w-40">
              <img
                src={img}
                alt=""
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_EP_IMAGE;
                }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="h-6 w-6 fill-current text-white" />
              </div>
              <span className="absolute left-1 top-1 border border-border bg-background/85 px-1.5 py-0.5 font-mono text-[0.55rem] tracking-widest text-foreground">
                {String(num).padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 py-2 pr-3">
              <div className="line-clamp-1 text-xs font-medium text-foreground sm:text-sm">
                {title}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                {ep.runtime && <span>{ep.runtime}m</span>}
                {date && <span>· {date}</span>}
                <span className="ml-auto inline-flex items-center gap-1">
                  {aired ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-chart-1" />
                      aired
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" />
                      tba
                    </>
                  )}
                </span>
              </div>
              {ep.overview && (
                <p className="line-clamp-2 hidden text-xs text-card-foreground sm:block">
                  {ep.overview}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
