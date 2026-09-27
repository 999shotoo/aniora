// Server-only helper: fetch top AniList titles for sitemap generation.
// Kept in a `.server.ts` file so nothing here can leak into the browser bundle.

const ANILIST = "https://graphql.anilist.co";

export interface AniListSitemapEntry {
  id: number;
  title: string;
  cover: string | null;
  updatedAt: number | null;
}

const QUERY = /* GraphQL */ `
  query ($page: Int!, $perPage: Int!, $format: [MediaFormat]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(type: ANIME, sort: [POPULARITY_DESC], format_in: $format, isAdult: false) {
        id
        title { english romaji userPreferred }
        coverImage { large }
        updatedAt
      }
    }
  }
`;

export async function fetchAniListSitemap(
  formats: string[] | null,
  { pages = 4, perPage = 50 }: { pages?: number; perPage?: number } = {},
): Promise<AniListSitemapEntry[]> {
  const out: AniListSitemapEntry[] = [];
  for (let page = 1; page <= pages; page++) {
    try {
      const res = await fetch(ANILIST, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          query: QUERY,
          variables: { page, perPage, format: formats },
        }),
      });
      if (!res.ok) break;
      const json = (await res.json()) as {
        data?: {
          Page?: {
            pageInfo?: { hasNextPage?: boolean };
            media?: Array<{
              id: number;
              title: { english: string | null; romaji: string | null; userPreferred: string | null };
              coverImage: { large: string | null };
              updatedAt: number | null;
            }>;
          };
        };
      };
      const media = json.data?.Page?.media ?? [];
      for (const m of media) {
        const title = m.title.english || m.title.romaji || m.title.userPreferred || `Anime ${m.id}`;
        out.push({
          id: m.id,
          title,
          cover: m.coverImage?.large ?? null,
          updatedAt: m.updatedAt,
        });
      }
      if (!json.data?.Page?.pageInfo?.hasNextPage) break;
    } catch {
      break;
    }
  }
  return out;
}

export function xmlEscape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildAnimeSitemapXml(
  entries: AniListSitemapEntry[],
  baseUrl: string,
): string {
  const urls = entries.map((e) => {
    const loc = `${baseUrl}/anime/${e.id}`;
    const lastmod = e.updatedAt ? new Date(e.updatedAt * 1000).toISOString() : new Date().toISOString();
    const image = e.cover
      ? `\n    <image:image>\n      <image:loc>${xmlEscape(e.cover)}</image:loc>\n      <image:title>${xmlEscape(e.title)}</image:title>\n    </image:image>`
      : "";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>${image}\n  </url>`;
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}
