// Local-storage wishlist. Simple, syncable across tabs via the `storage` event.

import { useEffect, useState, useCallback } from "react";
import type { AniListMedia } from "./anilist";

const KEY = "wishlist_v1";

export interface WishlistItem {
  id: number;
  title: string;
  cover: string | null;
  format: string | null;
  year: number | null;
  addedAt: number;
}

function read(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: WishlistItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function toWishlistItem(media: AniListMedia): WishlistItem {
  return {
    id: media.id,
    title:
      media.title.english ||
      media.title.userPreferred ||
      media.title.romaji ||
      "Untitled",
    cover: media.coverImage?.large || media.coverImage?.extraLarge || null,
    format: media.format,
    year: media.seasonYear,
    addedAt: Date.now(),
  };
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onChange = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) setItems(read());
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);

  const has = useCallback(
    (id: number) => items.some((i) => i.id === id),
    [items],
  );

  const add = useCallback((media: AniListMedia) => {
    const current = read();
    if (current.some((i) => i.id === media.id)) return;
    write([toWishlistItem(media), ...current]);
  }, []);

  const remove = useCallback((id: number) => {
    write(read().filter((i) => i.id !== id));
  }, []);

  const toggle = useCallback(
    (media: AniListMedia) => {
      if (has(media.id)) remove(media.id);
      else add(media);
    },
    [has, add, remove],
  );

  return { items, has, add, remove, toggle };
}
