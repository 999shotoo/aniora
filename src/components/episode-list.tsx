import { CheckCircle2, Clock, Play } from "lucide-react";
import { isAired, type MappingEpisode } from "@/lib/mappings";
import { FALLBACK_EP_IMAGE } from "./player";

interface Props {
  episodes: MappingEpisode[];
  totalPlanned?: number | null;
  currentEp: number;
  onSelect: (ep: number) => void;
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
 * Renders the episode list. Includes placeholder tiles for episodes that
 * are planned by AniList but not yet in the mapping, so users can see
 * upcoming counts.
 */
export function EpisodeList({
  episodes,
  totalPlanned,
  currentEp,
  onSelect,
}: Props) {
  const byNumber = new Map<number, MappingEpisode>();
  for (const ep of episodes) {
    if (ep.episodeNumber != null) byNumber.set(ep.episodeNumber, ep);
  }

  const highest = Math.max(
    ...episodes.map((e) => e.episodeNumber ?? 0),
    totalPlanned ?? 0,
    1,
  );
  const count = totalPlanned && totalPlanned > highest ? totalPlanned : highest;

  const rows: { num: number; ep: MappingEpisode | null }[] = [];
  for (let i = 1; i <= count; i++) {
    rows.push({ num: i, ep: byNumber.get(i) ?? null });
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map(({ num, ep }) => {
        const aired = ep ? isAired(ep) : false;
        const active = num === currentEp;
        const canPlay = aired || !ep;
        const img = ep?.image || FALLBACK_EP_IMAGE;
        const title =
          ep?.title?.en || ep?.nameTvdb || `Episode ${num}`;
        const date = formatDate(ep?.airDate || ep?.airdate);

        return (
          <button
            key={num}
            onClick={() => canPlay && onSelect(num)}
            disabled={!canPlay && !!ep && !aired}
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
                {ep?.runtime && <span>{ep.runtime}m</span>}
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
                      {ep ? "upcoming" : "unlisted"}
                    </>
                  )}
                </span>
              </div>
              {ep?.overview && (
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
