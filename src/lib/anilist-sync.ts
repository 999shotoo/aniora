// AniList list sync — fire-and-forget updates for the signed-in viewer.
// Silently no-ops when the viewer is signed out.
import { anilistFetch, getAniListToken } from "./anilist";

export type AniListListStatus =
  | "CURRENT"
  | "PLANNING"
  | "COMPLETED"
  | "DROPPED"
  | "PAUSED"
  | "REPEATING";

export interface AniListListEntry {
  id: number;
  status: AniListListStatus | null;
  progress: number | null;
  score: number | null;
  media: {
    id: number;
    episodes: number | null;
    title: { userPreferred: string | null };
    coverImage: { large: string | null };
  };
  updatedAt: number | null;
}

const SAVE_MUTATION = `
  mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
    SaveMediaListEntry(mediaId: $mediaId, progress: $progress, status: $status) {
      id progress status
    }
  }
`;

/**
 * Push watched progress to the signed-in AniList account.
 * - If not signed in: silently no-op.
 * - Marks the entry CURRENT unless progress >= totalEpisodes (then COMPLETED).
 */
export async function syncAniListProgress(opts: {
  mediaId: number;
  progress: number;
  totalEpisodes?: number | null;
}): Promise<void> {
  if (!getAniListToken()) return;
  const { mediaId, progress, totalEpisodes } = opts;
  if (!mediaId || !Number.isFinite(progress) || progress < 1) return;
  const status: AniListListStatus =
    totalEpisodes && progress >= totalEpisodes ? "COMPLETED" : "CURRENT";
  try {
    await anilistFetch(SAVE_MUTATION, { mediaId, progress, status });
  } catch {
    // network / auth errors — silent by design; local watch history is source of truth
  }
}

const LIST_QUERY = `
  query ($userId: Int, $status: MediaListStatus) {
    Page(page: 1, perPage: 30) {
      mediaList(userId: $userId, type: ANIME, status: $status, sort: UPDATED_TIME_DESC) {
        id status progress score updatedAt
        media {
          id episodes
          title { userPreferred }
          coverImage { large }
        }
      }
    }
  }
`;

export async function fetchViewerList(
  userId: number,
  status?: AniListListStatus,
): Promise<AniListListEntry[]> {
  if (!getAniListToken()) return [];
  const data = await anilistFetch<{ Page: { mediaList: AniListListEntry[] } }>(
    LIST_QUERY,
    { userId, status },
  );
  return data.Page.mediaList ?? [];
}
