import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearAniListToken,
  getAniListToken,
  getViewer,
  type AniListViewer,
} from "./anilist";

export function useAniListViewer() {
  const query = useQuery<AniListViewer | null>({
    queryKey: ["anilist", "viewer"],
    queryFn: () => getViewer(),
    staleTime: 5 * 60_000,
    retry: false,
  });
  return {
    viewer: query.data ?? null,
    isLoading: query.isLoading,
    isAuthed: !!query.data,
    hasToken: !!getAniListToken(),
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
