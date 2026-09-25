import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookmarkPlus,
  Check,
  CircleDot,
  Clock,
  Eye,
  Heart,
  Loader2,
  Minus,
  Pause,
  Plus,
  Repeat,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useAniListViewer } from "@/lib/anilist-auth";
import {
  fetchMediaEntry,
  saveMediaEntry,
  deleteMediaEntry,
  toggleAnimeFavourite,
  type AniListListStatus,
} from "@/lib/anilist-sync";
import { toast } from "sonner";

const STATUSES: {
  value: AniListListStatus;
  label: string;
  Icon: typeof Eye;
}[] = [
  { value: "CURRENT", label: "watching", Icon: Eye },
  { value: "PLANNING", label: "planning", Icon: BookmarkPlus },
  { value: "COMPLETED", label: "completed", Icon: Check },
  { value: "PAUSED", label: "paused", Icon: Pause },
  { value: "DROPPED", label: "dropped", Icon: X },
  { value: "REPEATING", label: "rewatching", Icon: Repeat },
];

export function AniListTracker({
  mediaId,
  totalEpisodes,
}: {
  mediaId: number;
  totalEpisodes?: number | null;
}) {
  const { hasToken } = useAniListViewer();
  const qc = useQueryClient();
  const key = ["anilist-entry", mediaId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchMediaEntry(mediaId),
    enabled: hasToken,
    staleTime: 60_000,
  });

  const entry = data?.mediaListEntry ?? null;
  const isFav = !!data?.isFavourite;

  const [status, setStatus] = useState<AniListListStatus>("PLANNING");
  const [progress, setProgress] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [dirty, setDirty] = useState(false);

  // hydrate form once when entry loads
  const hydrateKey = entry ? `${entry.id}-${entry.status}-${entry.progress}-${entry.score}` : "empty";
  const [lastHydrate, setLastHydrate] = useState<string | null>(null);
  if (lastHydrate !== hydrateKey) {
    setLastHydrate(hydrateKey);
    setStatus((entry?.status as AniListListStatus) ?? "PLANNING");
    setProgress(entry?.progress ?? 0);
    setScore(entry?.score ?? 0);
    setDirty(false);
  }

  const save = useMutation({
    mutationFn: () => saveMediaEntry({ mediaId, status, progress, score }),
    onSuccess: () => {
      toast.success("Saved to AniList");
      setDirty(false);
      qc.invalidateQueries({ queryKey: key });
    },
    onError: () => toast.error("Failed to save"),
  });

  const remove = useMutation({
    mutationFn: () => (entry ? deleteMediaEntry(entry.id) : Promise.resolve()),
    onSuccess: () => {
      toast.success("Removed from list");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: () => toast.error("Failed to remove"),
  });

  const fav = useMutation({
    mutationFn: () => toggleAnimeFavourite(mediaId),
    onMutate: () => {
      qc.setQueryData(key, (prev: typeof data) =>
        prev ? { ...prev, isFavourite: !prev.isFavourite } : prev,
      );
    },
    onError: () => {
      toast.error("Failed to toggle favourite");
      qc.invalidateQueries({ queryKey: key });
    },
  });

  if (!hasToken) return null;

  const clampProgress = (n: number) => {
    const max = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : 9999;
    return Math.min(max, Math.max(0, Math.round(n)));
  };
  const stepProgress = (delta: number) => {
    setProgress((p) => clampProgress(p + delta));
    setDirty(true);
  };

  return (
    <div className="mt-5 border border-border bg-card/60">
      {/* header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-background/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          <CircleDot className="h-3 w-3 text-chart-2" />
          anilist tracking
          {entry && (
            <span className="ml-1 border border-border bg-background px-1.5 py-0.5 text-[0.55rem] text-foreground">
              on your list
            </span>
          )}
        </div>
        <button
          onClick={() => fav.mutate()}
          disabled={fav.isPending || isLoading}
          className={
            "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[0.6rem] uppercase tracking-widest transition-colors disabled:opacity-50 " +
            (isFav
              ? "border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground")
          }
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart className={`h-3 w-3 ${isFav ? "fill-current" : ""}`} />
          {isFav ? "favourited" : "favourite"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 px-4 py-6 text-[0.7rem] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> loading entry…
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {/* Status pills */}
          <div>
            <div className="mb-1.5 text-[0.55rem] uppercase tracking-widest text-muted-foreground">
              status
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(({ value, label, Icon }) => {
                const active = status === value;
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setStatus(value);
                      setDirty(true);
                    }}
                    className={
                      "inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[0.6rem] uppercase tracking-widest transition-colors " +
                      (active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground")
                    }
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Progress stepper */}
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                  progress
                </span>
                <span className="font-mono text-[0.6rem] text-muted-foreground">
                  {progress}
                  {totalEpisodes ? ` / ${totalEpisodes}` : ""}
                </span>
              </div>
              <div className="flex items-stretch border border-border bg-background">
                <button
                  onClick={() => stepProgress(-1)}
                  disabled={progress <= 0}
                  className="flex w-9 items-center justify-center border-r border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                  aria-label="Decrease progress"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  min={0}
                  max={totalEpisodes ?? 9999}
                  value={progress}
                  onChange={(e) => {
                    setProgress(clampProgress(Number(e.target.value) || 0));
                    setDirty(true);
                  }}
                  className="flex-1 bg-transparent px-3 py-1.5 text-center text-sm tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  onClick={() => stepProgress(1)}
                  disabled={!!totalEpisodes && progress >= totalEpisodes}
                  className="flex w-9 items-center justify-center border-l border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                  aria-label="Increase progress"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {totalEpisodes && totalEpisodes > 0 && (
                <div className="mt-2 h-1 w-full overflow-hidden border border-border bg-background">
                  <div
                    className="h-full bg-foreground transition-[width]"
                    style={{
                      width: `${Math.min(100, (progress / totalEpisodes) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Score stars */}
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                  score
                </span>
                <span className="font-mono text-[0.6rem] text-muted-foreground">
                  {score.toFixed(score % 1 === 0 ? 0 : 1)} / 10
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const n = i + 1;
                  const active = score >= n;
                  return (
                    <button
                      key={n}
                      onClick={() => {
                        setScore(score === n ? 0 : n);
                        setDirty(true);
                      }}
                      aria-label={`Score ${n}`}
                      className="flex h-7 w-7 items-center justify-center hover:scale-110"
                    >
                      <Star
                        className={
                          "h-3.5 w-3.5 transition-colors " +
                          (active
                            ? "fill-chart-3 text-chart-3"
                            : "text-muted-foreground/40")
                        }
                      />
                    </button>
                  );
                })}
                {score > 0 && (
                  <button
                    onClick={() => {
                      setScore(0);
                      setDirty(true);
                    }}
                    className="ml-1 text-[0.55rem] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    title="Clear score"
                  >
                    clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending || (!dirty && !!entry)}
              className="inline-flex items-center gap-1.5 border border-foreground bg-foreground px-3.5 py-2 text-[0.6rem] uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {save.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              {entry ? (dirty ? "save changes" : "saved") : "add to list"}
            </button>
            {entry && (
              <>
                <button
                  onClick={() => {
                    setStatus("COMPLETED");
                    if (totalEpisodes) setProgress(totalEpisodes);
                    setDirty(true);
                  }}
                  className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Check className="h-3 w-3" /> mark completed
                </button>
                <button
                  onClick={() => remove.mutate()}
                  disabled={remove.isPending}
                  className="ml-auto inline-flex items-center gap-1.5 border border-destructive/40 bg-background px-3 py-2 text-[0.6rem] uppercase tracking-widest text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  {remove.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  remove
                </button>
              </>
            )}
          </div>

          {entry?.status && (
            <div className="flex items-center gap-1.5 text-[0.55rem] uppercase tracking-widest text-muted-foreground">
              <Clock className="h-3 w-3" />
              last synced status: {String(entry.status).toLowerCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
