import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2, Minus, MoreHorizontal, Plus, Save, Trash2 } from "lucide-react";
import { useAniListViewer } from "@/lib/anilist-auth";
import {
  fetchMediaEntry,
  saveMediaEntry,
  deleteMediaEntry,
  toggleAnimeFavourite,
  type AniListListStatus,
} from "@/lib/anilist-sync";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: AniListListStatus; label: string }[] = [
  { value: "CURRENT", label: "watching" },
  { value: "PLANNING", label: "planning" },
  { value: "COMPLETED", label: "completed" },
  { value: "PAUSED", label: "paused" },
  { value: "DROPPED", label: "dropped" },
  { value: "REPEATING", label: "rewatching" },
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
  const [menuOpen, setMenuOpen] = useState(false);

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
      setMenuOpen(false);
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
  const step = (delta: number) => {
    setProgress((p) => clampProgress(p + delta));
    setDirty(true);
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border border-border bg-card px-2 py-1.5 text-[0.65rem]">
      {/* Status dropdown */}
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value as AniListListStatus);
          setDirty(true);
        }}
        disabled={isLoading}
        className="border border-border bg-background px-2 py-1 text-[0.65rem] uppercase tracking-widest text-foreground focus:outline-none"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Progress compact stepper */}
      <div className="inline-flex items-stretch border border-border bg-background">
        <button
          onClick={() => step(-1)}
          disabled={progress <= 0}
          aria-label="Decrease progress"
          className="flex w-6 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
        >
          <Minus className="h-3 w-3" />
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
          className="w-12 bg-transparent px-1 text-center text-[0.7rem] tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="flex items-center pr-1 text-[0.6rem] text-muted-foreground">
          {totalEpisodes ? `/${totalEpisodes}` : ""}
        </span>
        <button
          onClick={() => step(1)}
          disabled={!!totalEpisodes && progress >= totalEpisodes}
          aria-label="Increase progress"
          className="flex w-6 items-center justify-center border-l border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Score dropdown */}
      <select
        value={score}
        onChange={(e) => {
          setScore(Number(e.target.value));
          setDirty(true);
        }}
        className="border border-border bg-background px-2 py-1 text-[0.65rem] tabular-nums text-foreground focus:outline-none"
        aria-label="Score"
      >
        <option value={0}>★ —</option>
        {Array.from({ length: 10 }).map((_, i) => (
          <option key={i + 1} value={i + 1}>
            ★ {i + 1}
          </option>
        ))}
      </select>

      {/* Favourite */}
      <button
        onClick={() => fav.mutate()}
        disabled={fav.isPending}
        title={isFav ? "Remove from favourites" : "Add to favourites"}
        className={
          "inline-flex h-[26px] w-[26px] items-center justify-center border transition-colors disabled:opacity-50 " +
          (isFav
            ? "border-red-500/60 bg-red-500/10 text-red-400"
            : "border-border bg-background text-muted-foreground hover:text-foreground")
        }
      >
        <Heart className={`h-3 w-3 ${isFav ? "fill-current" : ""}`} />
      </button>

      {/* Save */}
      <button
        onClick={() => save.mutate()}
        disabled={save.isPending || (!dirty && !!entry)}
        className="inline-flex items-center gap-1 border border-foreground bg-foreground px-2.5 py-1 text-[0.65rem] uppercase tracking-widest text-background disabled:opacity-40"
      >
        {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        {entry ? (dirty ? "save" : "saved") : "add"}
      </button>

      {/* Overflow menu */}
      {entry && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More"
            className="inline-flex h-[26px] w-[26px] items-center justify-center border border-border bg-background text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 min-w-[9rem] border border-border bg-card shadow-lg">
              <button
                onClick={() => {
                  setStatus("COMPLETED");
                  if (totalEpisodes) setProgress(totalEpisodes);
                  setDirty(true);
                  setMenuOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-[0.65rem] uppercase tracking-widest text-foreground hover:bg-accent"
              >
                mark completed
              </button>
              <button
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[0.65rem] uppercase tracking-widest text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                {remove.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
