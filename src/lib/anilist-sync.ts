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
  mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus, $score: Float, $notes: String) {
    SaveMediaListEntry(mediaId: $mediaId, progress: $progress, status: $status, score: $score, notes: $notes) {
      id progress status score notes
    }
  }
`;

const DELETE_MUTATION = `
  mutation ($id: Int) {
    DeleteMediaListEntry(id: $id) { deleted }
  }
`;
const UPDATE_USER_MUTATION = `
  mutation ($about: String, $titleLanguage: UserTitleLanguage, $displayAdultContent: Boolean, $airingNotifications: Boolean, $timezone: String, $scoreFormat: ScoreFormat) {
    UpdateUser(about: $about, titleLanguage: $titleLanguage, displayAdultContent: $displayAdultContent, airingNotifications: $airingNotifications, timezone: $timezone, scoreFormat: $scoreFormat) {
      id
      about
      options { titleLanguage displayAdultContent timezone }
      mediaListOptions { scoreFormat }
    }
  }
`;

export interface UpdateUserInput {
  about?: string;
  titleLanguage?: string;
  displayAdultContent?: boolean;
  airingNotifications?: boolean;
  timezone?: string;
  scoreFormat?: string;
}

export async function updateViewerSettings(input: UpdateUserInput): Promise<void> {
  if (!getAniListToken()) return;
  await anilistFetch(UPDATE_USER_MUTATION, input as Record<string, unknown>);
}


const TOGGLE_FAV_MUTATION = `
  mutation ($animeId: Int) {
    ToggleFavourite(animeId: $animeId) {
      anime { nodes { id } }
    }
  }
`;

const MEDIA_ENTRY_QUERY = `
  query ($mediaId: Int) {
    Media(id: $mediaId) {
      id
      isFavourite
      mediaListEntry {
        id status progress score notes
      }
    }
  }
`;

export interface AniListMediaEntry {
  id: number;
  isFavourite: boolean;
  mediaListEntry: {
    id: number;
    status: AniListListStatus | null;
    progress: number | null;
    score: number | null;
    notes: string | null;
  } | null;
}

export async function fetchMediaEntry(mediaId: number): Promise<AniListMediaEntry | null> {
  if (!getAniListToken()) return null;
  try {
    const data = await anilistFetch<{ Media: AniListMediaEntry }>(MEDIA_ENTRY_QUERY, { mediaId });
    return data.Media ?? null;
  } catch {
    return null;
  }
}

export async function saveMediaEntry(opts: {
  mediaId: number;
  status?: AniListListStatus;
  progress?: number;
  score?: number;
  notes?: string;
}): Promise<void> {
  if (!getAniListToken()) return;
  await anilistFetch(SAVE_MUTATION, opts);
}

export async function deleteMediaEntry(id: number): Promise<void> {
  if (!getAniListToken()) return;
  await anilistFetch(DELETE_MUTATION, { id });
}

export async function toggleAnimeFavourite(animeId: number): Promise<void> {
  if (!getAniListToken()) return;
  await anilistFetch(TOGGLE_FAV_MUTATION, { animeId });
}

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

// Full paginated fetch of the viewer's entire anime list (for local sync).
const FULL_LIST_QUERY = `
  query ($userId: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage }
      mediaList(userId: $userId, type: ANIME, sort: UPDATED_TIME_DESC) {
        id status progress score updatedAt
        media {
          id idMal episodes
          title { userPreferred romaji english }
          coverImage { extraLarge large }
          bannerImage
        }
      }
    }
  }
`;

export interface AniListFullEntry {
  id: number;
  status: AniListListStatus | null;
  progress: number | null;
  score: number | null;
  updatedAt: number | null;
  media: {
    id: number;
    idMal: number | null;
    episodes: number | null;
    title: { userPreferred: string | null; romaji: string | null; english: string | null };
    coverImage: { extraLarge: string | null; large: string | null };
    bannerImage: string | null;
  };
}

export async function fetchAllViewerEntries(userId: number): Promise<AniListFullEntry[]> {
  if (!getAniListToken()) return [];
  const all: AniListFullEntry[] = [];
  for (let page = 1; page <= 20; page++) {
    try {
      const data = await anilistFetch<{
        Page: { pageInfo: { hasNextPage: boolean }; mediaList: AniListFullEntry[] };
      }>(FULL_LIST_QUERY, { userId, page });
      const entries = data.Page.mediaList ?? [];
      all.push(...entries);
      if (!data.Page.pageInfo?.hasNextPage) break;
    } catch {
      break;
    }
  }
  return all;
}

export interface AniListActivityItem {
  id: number;
  status: string | null;
  progress: string | null;
  createdAt: number;
  media: {
    id: number;
    title: { userPreferred: string | null };
    coverImage: { large: string | null };
  } | null;
}

const ACTIVITY_QUERY = `
  query ($userId: Int) {
    Page(page: 1, perPage: 25) {
      activities(userId: $userId, type: ANIME_LIST, sort: ID_DESC) {
        ... on ListActivity {
          id
          status
          progress
          createdAt
          media {
            id
            title { userPreferred }
            coverImage { large }
          }
        }
      }
    }
  }
`;

export async function fetchViewerActivity(
  userId: number,
): Promise<AniListActivityItem[]> {
  if (!getAniListToken()) return [];
  try {
    const data = await anilistFetch<{
      Page: { activities: AniListActivityItem[] };
    }>(ACTIVITY_QUERY, { userId });
    return (data.Page.activities ?? []).filter((a) => a && a.id);
  } catch {
    return [];
  }
}
