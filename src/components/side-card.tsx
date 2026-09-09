import { Link } from "@tanstack/react-router";
import { type AniListMedia, FALLBACK_COVER, pickTitle } from "@/lib/anilist";
import { SmartImage } from "./smart-image";
import { Bar, Skeleton } from "./skeleton";

interface Props {
  title: string;
  items: AniListMedia[];
  loading?: boolean;
  icon?: React.ReactNode;
  /** If an item has nextAiringEpisode, we show ep/countdown; otherwise ep count. */
  showAiring?: boolean;
  limit?: number;
}

function fmtCountdown(seconds: number): string {
  if (seconds <= 0) return "airing";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

/** Compact sidebar list — small poster + title + meta row. */
export function SideCard({
  title,
  items,
  loading,
  icon,
  showAiring,
  limit = 6,
}: Props) {
  const list = items.slice(0, limit);

  return (
    <section className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
        <span className="font-mono text-[0.6rem] tracking-widest text-muted-foreground/70">
          {loading ? "..." : `${list.length}`}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {loading &&
          Array.from({ length: limit }).map((_, i) => (
            <li key={i} className="flex items-center gap-2 px-2 py-2">
              <Skeleton className="h-14 w-10 shrink-0 border border-border" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Bar className="h-2.5 w-4/5" />
                <div className="flex gap-1.5">
                  <Bar className="h-2 w-8 border border-border" />
                  <Bar className="h-2 w-10 border border-border" />
                  <Bar className="h-2 w-6 border border-border" />
              </div>
            </li>
          ))}

        {!loading &&
          list.map((m) => {
            const cover =
              m.coverImage?.large ||
              m.coverImage?.medium ||
              FALLBACK_COVER;
            const nextEp = m.nextAiringEpisode;
            return (
              <li key={m.id}>
                <Link
                  to="/anime/$id"
                  params={{ id: String(m.id) }}
                  className="group flex items-center gap-2 px-2 py-2 transition-colors hover:bg-accent"
                >
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden border border-border bg-background">
                    <SmartImage
                      src={cover}
                      fallback={FALLBACK_COVER}
                      alt={pickTitle(m.title)}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start gap-1.5">
                      <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-chart-1" />
                      <p className="line-clamp-2 text-xs font-medium leading-tight text-foreground group-hover:text-foreground">
                        {pickTitle(m.title)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                      <span className="border border-border px-1 py-px">
                        {m.format || "TV"}
                      </span>
                      {showAiring && nextEp ? (
                        <>
                          <span className="border border-border px-1 py-px">
                            ep {nextEp.episode}
                          </span>
                          <span className="border border-border px-1 py-px text-chart-1">
                            {fmtCountdown(nextEp.timeUntilAiring)}
                          </span>
                        </>
                      ) : (
                        <>
                          {m.seasonYear && (
                            <span className="border border-border px-1 py-px">
                              {m.seasonYear}
                            </span>
                          )}
                          {m.episodes != null && (
                            <span className="border border-border px-1 py-px">
                              {m.episodes} ep
                            </span>
                          )}
                          {m.averageScore != null && (
                            <span className="border border-border px-1 py-px">
                              ★ {(m.averageScore / 10).toFixed(1)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}

        {!loading && list.length === 0 && (
          <li className="px-3 py-6 text-center font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground/60">
            no data
          </li>
        )}
      </ul>
    </section>
  );
}
