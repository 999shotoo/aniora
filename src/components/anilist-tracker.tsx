import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2, Trash2, Save } from "lucide-react";
import { useAniListViewer } from "@/lib/anilist-auth";
import {
  fetchMediaEntry,
  saveMediaEntry,
  deleteMediaEntry,
  toggleAnimeFavourite,
  type AniListListStatus,
} from "@/lib/anilist-sync";
import { toast } from "sonner";

const STATUSES: { value: AniListListStatus; label: string }[] = [
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
    mutationFn: () =>
      saveMediaEntry({ mediaId, status, progress, score }),
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

  return (
    <div className="mt-5 border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          anilist tracking
        </div>
        <button
          onClick={() => fav.mutate()}
          disabled={fav.isPending || isLoading}
          className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1 text-[0.6rem] uppercase tracking-widest hover:bg-accent disabled:opacity-50"
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart
            className={`h-3 w-3 ${isFav ? "fill-red-500 text-red-500" : ""}`}
          />
          {isFav ? "favourited" : "favourite"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> loading entry…
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
              status
            </span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as AniListListStatus);
                setDirty(true);
              }}
              className="border border-border bg-background px-2 py-1.5 text-xs uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-foreground"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
              progress {totalEpisodes ? `/ ${totalEpisodes}` : ""}
            </span>
            <input
              type="number"
              min={0}
              max={totalEpisodes ?? 9999}
              value={progress}
              onChange={(e) => {
                setProgress(Math.max(0, Number(e.target.value) || 0));
                setDirty(true);
              }}
              className="border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
              score / 10
            </span>
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={score}
              onChange={(e) => {
                setScore(Math.min(10, Math.max(0, Number(e.target.value) || 0)));
                setDirty(true);
              }}
              className="border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </label>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || isLoading || (!dirty && !!entry)}
          className="inline-flex items-center gap-1.5 border border-foreground bg-foreground px-3 py-1.5 text-[0.6rem] uppercase tracking-widest text-background hover:bg-foreground/90 disabled:opacity-50"
        >
          {save.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          {entry ? "update" : "add to list"}
        </button>
        {entry && (
          <button
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-[0.6rem] uppercase tracking-widest text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {remove.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            remove
          </button>
        )}
      </div>
    </div>
  );
}
