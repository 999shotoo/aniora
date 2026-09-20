// Two-way sync between AniList and local watched history.
// Runs when a viewer signs in: pulls AniList list into local, then pushes any
// local advances back to AniList.
import { useEffect, useRef } from "react";
import { useAniListViewer } from "./anilist-auth";
import {
  fetchAllViewerEntries,
  syncAniListProgress,
  type AniListFullEntry,
} from "./anilist-sync";
import { mergeAniListEntries, type AniListSyncEntry } from "./watched";

function toSyncEntry(e: AniListFullEntry): AniListSyncEntry {
  return {
    animeId: e.media.id,
    progress: e.progress ?? 0,
    malId: e.media.idMal ?? null,
    title:
      e.media.title.userPreferred ||
      e.media.title.english ||
      e.media.title.romaji ||
      "Untitled",
    cover: e.media.coverImage.extraLarge || e.media.coverImage.large || null,
    poster: e.media.coverImage.extraLarge || e.media.coverImage.large || null,
    updatedAt: e.updatedAt,
  };
}

export function useAniListWatchSync() {
  const { viewer, isAuthed } = useAniListViewer();
  const ranFor = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthed || !viewer?.id) return;
    if (ranFor.current === viewer.id) return;
    ranFor.current = viewer.id;

    let cancelled = false;
    (async () => {
      try {
        const entries = await fetchAllViewerEntries(viewer.id);
        if (cancelled || entries.length === 0) return;
        const needsPush = mergeAniListEntries(entries.map(toSyncEntry));
        // Push local advances back to AniList (throttled).
        const totalsById = new Map(entries.map((e) => [e.media.id, e.media.episodes ?? null]));
        for (const item of needsPush) {
          if (cancelled) break;
          await syncAniListProgress({
            mediaId: item.animeId,
            progress: item.localProgress,
            totalEpisodes: totalsById.get(item.animeId) ?? null,
          });
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch {
        // silent — local is source of truth
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, viewer?.id]);
}
