// Episode mappings via the Zenshin mappings API.

const MAPPINGS_ENDPOINT = "https://zenshin-supabase-api-myig.onrender.com/mappings";

export interface MappingEpisode {
  episode: string;
  anidbEid?: string;
  type: string;
  length?: string;
  airdate?: string;
  title: { en?: string; [k: string]: string | undefined };
  nameTvdb?: string;
  tvdbShowId?: number;
  tvdbId?: number;
  seasonNumber?: number;
  seasonName?: string;
  episodeNumber?: number;
  absoluteEpisodeNumber?: number;
  runtime?: number;
  overview?: string;
  image?: string;
  airDate?: string;
}

export interface Mapping {
  mainTitle: string;
  title: Record<string, string>;
  date?: { startDate?: string; endDate?: string };
  episodes: Record<string, MappingEpisode>;
  mappings: {
    type?: string;
    anidb_id?: number;
    anilist_id?: number;
    mal_id?: number;
    tvdb_id?: number;
    themoviedb_id?: { tv?: number; movie?: number };
    [k: string]: unknown;
  };
}

export async function fetchMapping(
  anilistId: number,
  signal?: AbortSignal,
): Promise<Mapping | null> {
  try {
    const res = await fetch(`${MAPPINGS_ENDPOINT}?anilist_id=${anilistId}`, {
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as Mapping;
  } catch {
    return null;
  }
}

/**
 * Split episode keys into regular numbered episodes and specials (C1, S1, etc).
 * Regular episodes have numeric string keys, specials have letter-prefixed keys.
 */
export function splitEpisodes(mapping: Mapping | null): {
  regular: MappingEpisode[];
  specials: MappingEpisode[];
} {
  if (!mapping) return { regular: [], specials: [] };
  const regular: MappingEpisode[] = [];
  const specials: MappingEpisode[] = [];
  for (const [key, ep] of Object.entries(mapping.episodes)) {
    if (/^\d+$/.test(key)) regular.push(ep);
    else specials.push(ep);
  }
  regular.sort(
    (a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0),
  );
  return { regular, specials };
}

/** An episode is "aired" if its airDate is in the past. */
export function isAired(ep: MappingEpisode): boolean {
  const raw = ep.airDate || ep.airdate;
  if (!raw) return false;
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return false;
  return t <= Date.now();
}
