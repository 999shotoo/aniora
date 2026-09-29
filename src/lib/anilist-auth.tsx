import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHydrated } from "@tanstack/react-router";
import {
  ANILIST_TOKEN_EVENT,
  clearAniListToken,
  getAniListToken,
  getViewer,
  type AniListViewer,
} from "./anilist";

export function useAniListViewer() {
  const hydrated = useHydrated();
  const [tokenTick, setTokenTick] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    const onChange = () => setTokenTick((n) => n + 1);
    window.addEventListener(ANILIST_TOKEN_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(ANILIST_TOKEN_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [hydrated]);

  const hasToken = hydrated && !!getAniListToken();
  const query = useQuery<AniListViewer | null>({
    queryKey: ["anilist", "viewer", tokenTick],
    queryFn: () => getViewer(),
    enabled: hasToken,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return {
    viewer: query.data ?? null,
    isLoading: hasToken && query.isLoading,
    isAuthed: !!query.data,
    hasToken,
  };
}

export function useAniListLogout() {
  const qc = useQueryClient();
  return () => {
    clearAniListToken();
    qc.removeQueries({ queryKey: ["anilist"] });
    qc.removeQueries({ queryKey: ["anilist-entry"] });
  };
}
