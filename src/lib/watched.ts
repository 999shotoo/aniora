// Local watch tracker, keyed by AniList id.
// Legacy number-only stores are normalized into rich history entries on read.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MappingEpisode } from "./mappings";

const KEY = "watched_v1";

export interface WatchedEpisodeItem {
  animeId: number;
  animeTitle: string;
  animeCover: string | null;
  animePoster: string | null;
  episode: number;
  episodeTitle: string;
  episodeImage: string | null;
  malId: number | null;
  streamPath: string | null;
  runtime: number | null;
  watchedAt: number;
}

export type WatchEntryInput = Omit<WatchedEpisodeItem, "watchedAt" | "streamPath"> & {
  watchedAt?: number;
  streamPath?: string | null;
};

type Store = Record<string, WatchedEpisodeItem[]>;

function normalizeEntry(
  animeId: string,
  raw: unknown,
): WatchedEpisodeItem | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return {
      animeId: Number(animeId),
      animeTitle: "Unknown title",
      animeCover: null,
      animePoster: null,
      episode: raw,
      episodeTitle: `Episode ${raw}`,
      episodeImage: null,
      malId: null,
      streamPath: null,
      runtime: null,
      watchedAt: 0,
    };
  }

  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<WatchedEpisodeItem>;
  const episode = Number(item.episode);
  if (!Number.isFinite(episode) || episode < 1) return null;

  const malId = item.malId != null && Number.isFinite(Number(item.malId))
    ? Number(item.malId)
    : null;

  return {
    animeId: Number(item.animeId ?? animeId),
    animeTitle: item.animeTitle || "Unknown title",
    animeCover: item.animeCover || null,
    animePoster: item.animePoster || null,
    episode,
    episodeTitle: item.episodeTitle || `Episode ${episode}`,
    episodeImage: item.episodeImage || null,
    malId,
    streamPath:
      item.streamPath || (malId ? `/stream/mal/${malId}/${episode}/sub` : null),
    runtime: item.runtime ?? null,
    watchedAt: Number(item.watchedAt) || 0,
  };
}

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    const store: Store = {};
    for (const [animeId, value] of Object.entries(parsed)) {
      if (!Array.isArray(value)) continue;
      const entries = value
        .map((entry) => normalizeEntry(animeId, entry))
        .filter((entry): entry is WatchedEpisodeItem => Boolean(entry))
        .sort((a, b) => b.watchedAt - a.watchedAt || b.episode - a.episode);
      if (entries.length) store[animeId] = entries;
    }
    return store;
  } catch {
    return {};
  }
}

function write(store: Store): void {
  localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function readWatchedStore(): Store {
  return read();
}

export interface AniListSyncEntry {
  animeId: number;
  progress: number;
  malId: number | null;
  title: string;
  cover: string | null;
  poster: string | null;
  updatedAt: number | null;
}

/**
 * Merge AniList progress into the local watched store.
 * For each anime, ensure episodes 1..progress are marked locally.
 * Preserves existing local entries (never downgrades progress).
 * Returns list of anime IDs where local progress > anilist progress (need push back).
 */
export function mergeAniListEntries(entries: AniListSyncEntry[]): Array<{
  animeId: number;
  localProgress: number;
  malId: number | null;
  totalEpisodes: number | null;
}> {
  if (typeof window === "undefined") return [];
  const store = read();
  const needsPush: Array<{ animeId: number; localProgress: number; malId: number | null; totalEpisodes: number | null }> = [];

  for (const entry of entries) {
    const id = String(entry.animeId);
    const existing = store[id] ?? [];
    const localMax = existing.reduce((m, e) => Math.max(m, e.episode), 0);
    const targetProgress = entry.progress || 0;

    if (localMax > targetProgress) {
      needsPush.push({
        animeId: entry.animeId,
        localProgress: localMax,
        malId: entry.malId,
        totalEpisodes: null,
      });
      continue;
    }

    if (targetProgress > localMax) {
      const existingSet = new Set(existing.map((e) => e.episode));
      const baseWatchedAt = entry.updatedAt ? entry.updatedAt * 1000 : Date.now();
      const additions: WatchedEpisodeItem[] = [];
      const malId = entry.malId ?? null;
      for (let ep = 1; ep <= targetProgress; ep++) {
        if (existingSet.has(ep)) continue;
        additions.push({
          animeId: entry.animeId,
          animeTitle: entry.title || "Unknown title",
          animeCover: entry.cover || null,
          animePoster: entry.poster || null,
          episode: ep,
          episodeTitle: `Episode ${ep}`,
          episodeImage: entry.cover || entry.poster || null,
          malId,
          streamPath: malId ? `/stream/mal/${malId}/${ep}/sub` : null,
          runtime: null,
          watchedAt: baseWatchedAt - (targetProgress - ep) * 1000,
        });
      }
      if (additions.length) {
        store[id] = [...additions, ...existing].sort(
          (a, b) => b.watchedAt - a.watchedAt || b.episode - a.episode,
        );
      }
    }
  }

  write(store);
  return needsPush;
}


function upsert(store: Store, id: string, input: WatchEntryInput) {
  const episode = Number(input.episode);
  if (!Number.isFinite(episode) || episode < 1) return;
  const current = store[id] ?? [];
  const filtered = current.filter((entry) => entry.episode !== episode);
  const malId = input.malId ?? null;
  const next: WatchedEpisodeItem = {
    ...input,
    animeId: Number(input.animeId || id),
    episode,
    animeTitle: input.animeTitle || "Unknown title",
    animeCover: input.animeCover || null,
    animePoster: input.animePoster || null,
    episodeTitle: input.episodeTitle || `Episode ${episode}`,
    episodeImage: input.episodeImage || input.animeCover || input.animePoster || null,
    malId,
    streamPath:
      input.streamPath || (malId ? `/stream/mal/${malId}/${episode}/sub` : null),
    runtime: input.runtime ?? null,
    watchedAt: input.watchedAt ?? Date.now(),
  };
  store[id] = [next, ...filtered].sort(
    (a, b) => b.watchedAt - a.watchedAt || b.episode - a.episode,
  );
}

export function pickDefaultEpisodeFromHistory(
  entries: WatchedEpisodeItem[],
  available: MappingEpisode[],
): number | undefined {
  const numbers = available
    .map((ep) => ep.episodeNumber)
    .filter((n): n is number => Number.isFinite(n) && Number(n) > 0)
    .sort((a, b) => a - b);
  if (numbers.length === 0) return undefined;

  const watchedSet = new Set(entries.map((entry) => entry.episode));
  const maxWatched = entries.reduce(
    (max, entry) => Math.max(max, entry.episode),
    0,
  );
  if (maxWatched > 0) {
    const nextAfterLast = numbers.find((n) => n > maxWatched);
    if (nextAfterLast) return nextAfterLast;
  }

  return numbers.find((n) => !watchedSet.has(n)) ?? numbers[0];
}

export function useWatched(animeId: number | string) {
  const id = String(animeId);
  const [entries, setEntries] = useState<WatchedEpisodeItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => {
      setEntries(read()[id] ?? []);
      setReady(true);
    };
    load();
    const onChange = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) load();
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, [id]);

  const set = useMemo(
    () => new Set(entries.map((entry) => entry.episode)),
    [entries],
  );
  const lastEpisode = useMemo(
    () => entries.reduce((max, entry) => Math.max(max, entry.episode), 0),
    [entries],
  );

  const has = useCallback((n: number) => set.has(n), [set]);

  const markEpisode = useCallback(
    (input: WatchEntryInput) => {
      const store = read();
      upsert(store, id, input);
      write(store);
    },
    [id],
  );

  const mark = useCallback(
    (n: number) => {
      markEpisode({
        animeId: Number(id),
        animeTitle: "Unknown title",
        animeCover: null,
        animePoster: null,
        episode: n,
        episodeTitle: `Episode ${n}`,
        episodeImage: null,
        malId: null,
        runtime: null,
      });
    },
    [id, markEpisode],
  );

  const unmark = useCallback(
    (n: number) => {
      const store = read();
      store[id] = (store[id] ?? []).filter((entry) => entry.episode !== n);
      if (store[id].length === 0) delete store[id];
      write(store);
    },
    [id],
  );

  const toggle = useCallback(
    (n: number) => {
      if (set.has(n)) unmark(n);
      else mark(n);
    },
    [set, mark, unmark],
  );

  const toggleEpisode = useCallback(
    (input: WatchEntryInput) => {
      if (set.has(input.episode)) unmark(input.episode);
      else markEpisode(input);
    },
    [set, markEpisode, unmark],
  );

  return {
    entries,
    has,
    mark,
    markEpisode,
    unmark,
    toggle,
    toggleEpisode,
    count: set.size,
    lastEpisode,
    ready,
  };
}

export function useWatchHistory(limit = 12) {
  const [items, setItems] = useState<WatchedEpisodeItem[]>([]);

  useEffect(() => {
    const load = () => {
      const flattened = Object.values(read())
        .flat()
        .filter((entry) => entry.watchedAt > 0)
        .sort((a, b) => b.watchedAt - a.watchedAt)
        .slice(0, limit);
      setItems(flattened);
    };
    load();
    const onChange = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) load();
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, [limit]);

  const remove = useCallback((animeId: number, episode: number) => {
    const store = read();
    const id = String(animeId);
    store[id] = (store[id] ?? []).filter((entry) => entry.episode !== episode);
    if (store[id].length === 0) delete store[id];
    write(store);
  }, []);

  const clear = useCallback(() => write({}), []);

  return { items, remove, clear };
}
