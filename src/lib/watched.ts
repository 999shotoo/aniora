// Local-storage tracker for watched episodes, keyed by anilist id.
// Stored as: { [anilistId: string]: number[] }
import { useCallback, useEffect, useState } from "react";

const KEY = "watched_v1";

type Store = Record<string, number[]>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function useWatched(animeId: number | string) {
  const id = String(animeId);
  const [set, setSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    const load = () => setSet(new Set(read()[id] ?? []));
    load();
    const onChange = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) load();
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, [id]);

  const has = useCallback((n: number) => set.has(n), [set]);

  const mark = useCallback(
    (n: number) => {
      const store = read();
      const arr = new Set(store[id] ?? []);
      arr.add(n);
      store[id] = Array.from(arr).sort((a, b) => a - b);
      write(store);
    },
    [id],
  );

  const unmark = useCallback(
    (n: number) => {
      const store = read();
      const arr = new Set(store[id] ?? []);
      arr.delete(n);
      store[id] = Array.from(arr).sort((a, b) => a - b);
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

  return { has, mark, unmark, toggle, count: set.size };
}
