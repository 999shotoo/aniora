import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHydrated } from "@tanstack/react-router";
import {
  clearAniListToken,
  getAniListToken,
  getViewer,
  type AniListViewer,
} from "./anilist";

export function useAniListViewer() {
  const hydrated = useHydrated();
  const hasToken = hydrated && !!getAniListToken();
  const query = useQuery<AniListViewer | null>({
    queryKey: ["anilist", "viewer"],
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
    qc.setQueryData(["anilist", "viewer"], null);
    qc.invalidateQueries({ queryKey: ["anilist"] });
  };
}
