import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Clock, LayoutGrid, List, Play, Rows, Search, X } from "lucide-react";
import type { MappingEpisode } from "@/lib/mappings";
import { isAired } from "@/lib/mappings";
import { FALLBACK_EP_IMAGE } from "./player";
import { SmartImage } from "./smart-image";

type ViewMode = "thumb" | "row" | "grid";

interface Props {
  episodes: MappingEpisode[];
  currentEp: number;
  onSelect: (ep: number) => void;
  chunkSize?: number;
  /** Poster/banner to use when an episode has no thumbnail. */
  fallbackImage?: string;
  /** Returns whether an episode number is already watched. */
  isWatched?: (n: number) => boolean;
  /** Toggle the watched flag from the panel (checkbox on cards). */
  onToggleWatched?: (n: number) => void;
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
 * Full episode panel: chunked into ranges (1-100, 101-200, ...) with
 * a view mode toggle (thumbnail / row / grid) + live search.
 * Only aired episodes are shown; nothing in the future leaks in.
 */
export function EpisodesPanel({
  episodes,
  currentEp,
  onSelect,
  chunkSize = 100,
  fallbackImage,
  isWatched,
  onToggleWatched,
}: Props) {
  const aired = useMemo(
    () =>
      episodes
        .filter((e) => e.episodeNumber != null)
        .filter((e) => {
          if (!e.airDate && !e.airdate) return true;
          return isAired(e);
        })
        .sort((a, b) => (a.episodeNumber! - b.episodeNumber!)),
    [episodes],
  );

  const total = aired.length;
  const totalPlanned = episodes.length;

  // Build ranges [1-100], [101-200], ...
  const ranges = useMemo(() => {
    if (total === 0) return [] as { start: number; end: number }[];
    const max = aired[aired.length - 1].episodeNumber!;
    const out: { start: number; end: number }[] = [];
    for (let s = 1; s <= max; s += chunkSize) {
      out.push({ start: s, end: Math.min(s + chunkSize - 1, max) });
    }
    return out;
  }, [aired, total, chunkSize]);

  // Pick the range containing the current episode by default.
  const [rangeIdx, setRangeIdx] = useState(0);
  useEffect(() => {
    const idx = ranges.findIndex((r) => currentEp >= r.start && currentEp <= r.end);
    if (idx >= 0) setRangeIdx(idx);
  }, [currentEp, ranges]);

  const [view, setView] = useState<ViewMode>(total > 100 ? "grid" : "thumb");
  const [query, setQuery] = useState("");

  const activeRange = ranges[rangeIdx];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // When searching, ignore the range window.
    const source = q
      ? aired
      : aired.filter(
          (e) =>
            activeRange &&
            e.episodeNumber! >= activeRange.start &&
            e.episodeNumber! <= activeRange.end,
        );
    if (!q) return source;
    return source.filter((e) => {
      const t = (e.title?.en || e.nameTvdb || "").toLowerCase();
      return t.includes(q) || String(e.episodeNumber).includes(q);
    });
  }, [aired, activeRange, query]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">

      {/* Header: range + view + counts */}
      <div className="flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          ~$ ls episodes/
        </h2>
        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
          {total}
          {totalPlanned && totalPlanned !== total ? ` / ${totalPlanned}` : ""} aired
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {ranges.length > 1 && (
          <select
            value={rangeIdx}
            onChange={(e) => setRangeIdx(Number(e.target.value))}
            className="h-8 shrink-0 border border-border bg-input px-2 font-mono text-[0.65rem] text-foreground focus:border-foreground focus:outline-none"
            aria-label="Episode range"
          >
            {ranges.map((r, i) => (
              <option key={i} value={i}>
                {String(r.start).padStart(3, "0")}–{String(r.end).padStart(3, "0")}
              </option>
            ))}
          </select>
        )}

        <div className="flex h-8 min-w-0 flex-1 items-center gap-1.5 border border-border bg-input px-2 focus-within:border-foreground">
          <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="filter..."
            className="w-full min-w-0 bg-transparent font-mono text-[0.7rem] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Clear filter"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <button
          onClick={() => {
            const order: ViewMode[] = ["thumb", "row", "grid"];
            const next = order[(order.indexOf(view) + 1) % order.length];
            setView(next);
          }}
          aria-label={`View: ${view}. Click to cycle.`}
          title={`View: ${view} — click to cycle`}
          className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-input text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          {view === "thumb" ? (
            <LayoutGrid className="h-3.5 w-3.5" />
          ) : view === "row" ? (
            <Rows className="h-3.5 w-3.5" />
          ) : (
            <List className="h-3.5 w-3.5" />
          )}
        </button>
      </div>


      {/* Scrollable list body */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 max-h-[60vh] sm:max-h-[65vh] lg:max-h-[calc(100vh-14rem)]">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-border px-4 py-10 text-center text-xs text-muted-foreground">
            {query ? `no episodes match "${query}"` : "no episodes in this range"}
          </div>
        ) : view === "thumb" ? (
          <ThumbView items={filtered} currentEp={currentEp} onSelect={onSelect} fallbackImage={fallbackImage} />
        ) : view === "row" ? (
          <RowView items={filtered} currentEp={currentEp} onSelect={onSelect} />
        ) : (
          <GridView items={filtered} currentEp={currentEp} onSelect={onSelect} />
        )}
      </div>
    </div>
  );
}

function ViewBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        "flex h-8 w-8 items-center justify-center transition-colors " +
        (active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

/* -------------------- Views -------------------- */

function ThumbView({
  items,
  currentEp,
  onSelect,
  fallbackImage,
}: {
  items: MappingEpisode[];
  currentEp: number;
  onSelect: (n: number) => void;
  fallbackImage?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((ep) => {
        const num = ep.episodeNumber!;
        const active = num === currentEp;
        const aired = isAired(ep) || !(ep.airDate || ep.airdate);
        const img = ep.image || fallbackImage || FALLBACK_EP_IMAGE;
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
              <SmartImage
                src={img}
                fallback={fallbackImage || FALLBACK_EP_IMAGE}
                alt=""
                className="h-full w-full"
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
                      <CheckCircle2 className="h-3 w-3 text-chart-1" /> aired
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" /> tba
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

function RowView({
  items,
  currentEp,
  onSelect,
}: {
  items: MappingEpisode[];
  currentEp: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((ep) => {
        const num = ep.episodeNumber!;
        const active = num === currentEp;
        const title = ep.title?.en || ep.nameTvdb || `Episode ${num}`;
        return (
          <button
            key={num}
            onClick={() => onSelect(num)}
            className={
              "flex items-center gap-3 border px-3 py-2 text-left text-xs transition-colors " +
              (active
                ? "border-foreground bg-accent text-foreground"
                : "border-border bg-card text-card-foreground hover:border-muted-foreground hover:text-foreground")
            }
          >
            <span className="w-12 shrink-0 font-mono text-[0.65rem] tracking-widest text-muted-foreground">
              EP {String(num).padStart(3, "0")}
            </span>
            <span className="min-w-0 flex-1 truncate">{title}</span>
            {active && <Play className="h-3 w-3 shrink-0 fill-current" />}
          </button>
        );
      })}
    </div>
  );
}

function GridView({
  items,
  currentEp,
  onSelect,
}: {
  items: MappingEpisode[];
  currentEp: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
      {items.map((ep) => {
        const num = ep.episodeNumber!;
        const active = num === currentEp;
        return (
          <button
            key={num}
            onClick={() => onSelect(num)}
            title={ep.title?.en || ep.nameTvdb || `Episode ${num}`}
            className={
              "flex h-10 items-center justify-center border font-mono text-xs transition-colors " +
              (active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-muted-foreground hover:text-foreground")
            }
          >
            {num}
          </button>
        );
      })}
    </div>
  );
}
