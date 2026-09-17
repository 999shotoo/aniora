// Minimal AniList GraphQL client + typed query helpers.

const ENDPOINT = "https://graphql.anilist.co";

export interface AniListTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
  userPreferred: string | null;
}

export interface AniListCoverImage {
  extraLarge: string | null;
  large: string | null;
  medium: string | null;
  color: string | null;
}

export interface AniListMedia {
  id: number;
  idMal: number | null;
  title: AniListTitle;
  coverImage: AniListCoverImage;
  bannerImage: string | null;
  description: string | null;
  episodes: number | null;
  duration: number | null;
  status: string | null;
  format: string | null;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  genres: string[];
  studios?: { nodes: { name: string }[] };
  trailer?: { id: string; site: string } | null;
  nextAiringEpisode?: {
    airingAt: number;
    episode: number;
    timeUntilAiring: number;
  } | null;
  startDate?: { year: number | null; month: number | null; day: number | null };
  endDate?: { year: number | null; month: number | null; day: number | null };
}

export interface AniListStatDistribution {
  count: number;
  meanScore: number;
  minutesWatched: number;
  mediaIds?: number[];
}

export interface AniListViewer {
  id: number;
  name: string;
  avatar: { large: string | null; medium: string | null } | null;
  bannerImage: string | null;
  about: string | null;
  siteUrl?: string | null;
  donatorTier?: number | null;
  donatorBadge?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  options?: {
    titleLanguage?: string | null;
    displayAdultContent?: boolean | null;
    profileColor?: string | null;
    timezone?: string | null;
  } | null;
  mediaListOptions?: {
    scoreFormat?: string | null;
  } | null;
  statistics?: {
    anime: {
      count: number;
      meanScore: number;
      standardDeviation: number;
      minutesWatched: number;
      episodesWatched: number;
      statuses: (AniListStatDistribution & { status: string })[];
      formats: (AniListStatDistribution & { format: string })[];
      scores: (AniListStatDistribution & { score: number })[];
      genres: (AniListStatDistribution & { genre: string })[];
      tags: (AniListStatDistribution & { tag: { name: string } })[];
      studios: (AniListStatDistribution & { studio: { name: string } })[];
      releaseYears: (AniListStatDistribution & { releaseYear: number })[];
      startYears: (AniListStatDistribution & { startYear: number })[];
      countries: (AniListStatDistribution & { country: string })[];
      voiceActors: (AniListStatDistribution & { voiceActor: { name: { full: string } } })[];
    };
  };
  favourites?: {
    anime: { nodes: { id: number; title: AniListTitle; coverImage: AniListCoverImage }[] };
    characters: { nodes: { id: number; name: { full: string }; image: { large: string | null } }[] };
    staff: { nodes: { id: number; name: { full: string }; image: { large: string | null } }[] };
    studios: { nodes: { id: number; name: string }[] };
  };
}

const TOKEN_KEY = "anilist_token";

export function getAniListToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAniListToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAniListToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function anilistFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<T> {
  const token = getAniListToken();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? "AniList error");
  }
  return json.data as T;
}

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native userPreferred }
  coverImage { extraLarge large medium color }
  bannerImage
  description(asHtml: false)
  episodes
  duration
  status
  format
  season
  seasonYear
  averageScore
  meanScore
  popularity
  genres
  startDate { year month day }
  endDate { year month day }
  nextAiringEpisode { airingAt episode timeUntilAiring }
`;

export async function searchAnime(
  query: string,
  opts: { format?: string; page?: number; perPage?: number } = {},
): Promise<AniListMedia[]> {
  const { format, page = 1, perPage = 30 } = opts;
  const gql = `
    query ($search: String, $page: Int, $perPage: Int, $format: MediaFormat) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, format: $format, sort: SEARCH_MATCH) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(gql, {
    search: query || undefined,
    page,
    perPage,
    format,
  });
  return data.Page.media;
}

export async function browseAnime(
  variables: Record<string, unknown>,
): Promise<AniListMedia[]> {
  // Build args dynamically — page/perPage belong on Page(...), while filters
  // belong on media(...). Passing null filters or Page args to media breaks
  // AniList results.
  const pageDefs: Array<[string, string, string]> = [
    ["page", "Int", "page"],
    ["perPage", "Int", "perPage"],
  ];
  const mediaDefs: Array<[string, string, string]> = [
    ["sort", "[MediaSort]", "sort"],
    ["season", "MediaSeason", "season"],
    ["seasonYear", "Int", "seasonYear"],
    ["format", "MediaFormat", "format"],
    ["status", "MediaStatus", "status"],
  ];
  const defs: string[] = [];
  const pageArgs: string[] = [];
  const mediaArgs: string[] = ["type: ANIME", "isAdult: false"];
  const vars: Record<string, unknown> = {};

  for (const [key, type, argName] of pageDefs) {
    if (variables[key] !== undefined && variables[key] !== null && variables[key] !== "") {
      defs.push(`$${key}: ${type}`);
      pageArgs.push(`${argName}: $${key}`);
      vars[key] = variables[key];
    }
  }

  for (const [key, type, argName] of mediaDefs) {
    if (variables[key] !== undefined && variables[key] !== null && variables[key] !== "") {
      defs.push(`$${key}: ${type}`);
      mediaArgs.push(`${argName}: $${key}`);
      vars[key] = variables[key];
    }
  }
  if (variables.genre) {
    defs.push(`$genre: String`);
    mediaArgs.push(`genre_in: [$genre]`);
    vars.genre = variables.genre;
  }
  const gql = `
    query${defs.length ? ` (${defs.join(", ")})` : ""} {
      Page(${pageArgs.join(", ")}) {
        media(${mediaArgs.join(", ")}) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(gql, vars);
  return data.Page.media;
}


export async function getAnimeById(id: number): Promise<AniListMedia> {
  const gql = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
        studios(isMain: true) { nodes { name } }
        trailer { id site }
      }
    }
  `;
  const data = await anilistFetch<{ Media: AniListMedia }>(gql, { id });
  return data.Media;
}

export async function getViewer(): Promise<AniListViewer | null> {
  if (!getAniListToken()) return null;
  const gql = `
    query {
      Viewer {
        id
        name
        siteUrl
        donatorTier
        donatorBadge
        createdAt
        updatedAt
        avatar { large medium }
        bannerImage
        about(asHtml: false)
        options {
          titleLanguage
          displayAdultContent
          profileColor
          timezone
        }
        mediaListOptions { scoreFormat }
        statistics {
          anime {
            count
            meanScore
            standardDeviation
            minutesWatched
            episodesWatched
            statuses(sort: COUNT_DESC) { status count meanScore minutesWatched }
            formats(sort: COUNT_DESC) { format count meanScore minutesWatched }
            scores(sort: MEAN_SCORE) { score count meanScore minutesWatched }
            genres(sort: COUNT_DESC, limit: 12) { genre count meanScore minutesWatched }
            tags(sort: COUNT_DESC, limit: 12) { tag { name } count meanScore minutesWatched }
            studios(sort: COUNT_DESC, limit: 10) { studio { name } count meanScore minutesWatched }
            releaseYears(sort: MEAN_SCORE_DESC) { releaseYear count meanScore minutesWatched }
            startYears(sort: MEAN_SCORE_DESC) { startYear count meanScore minutesWatched }
            countries(sort: COUNT_DESC) { country count meanScore minutesWatched }
            voiceActors(sort: COUNT_DESC, limit: 8) { voiceActor { name { full } } count meanScore minutesWatched }
          }
        }
        favourites {
          anime(perPage: 12) {
            nodes {
              id
              title { romaji english native userPreferred }
              coverImage { extraLarge large medium color }
            }
          }
          characters(perPage: 8) {
            nodes { id name { full } image { large } }
          }
          staff(perPage: 8) {
            nodes { id name { full } image { large } }
          }
          studios(perPage: 8) { nodes { id name } }
        }
      }
    }
  `;
  const data = await anilistFetch<{ Viewer: AniListViewer | null }>(gql);
  return data.Viewer;
}

export function pickTitle(t: AniListTitle | undefined): string {
  if (!t) return "Untitled";
  return t.english || t.userPreferred || t.romaji || t.native || "Untitled";
}

export const FALLBACK_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420'>
      <rect width='300' height='420' fill='#111'/>
      <text x='50%' y='50%' fill='#555' font-family='monospace' font-size='14' text-anchor='middle'>NO IMAGE</text>
    </svg>`,
  );

export const FALLBACK_BANNER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 500'>
      <rect width='1600' height='500' fill='#0c0c0c'/>
    </svg>`,
  );
