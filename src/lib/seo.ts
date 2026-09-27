// Central SEO helpers — one source of truth for canonical URLs, metadata,
// and structured-data blobs across every route + sitemap.

export const SITE_URL = "https://aniora.qzz.io";
export const SITE_NAME = "Aniora";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og.png`;
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;

export function absUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(input: string, max = 158): string {
  const s = input.trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?-]+$/, "")}…`;
}

/** Build a self-referential canonical link entry for a route path. */
export function canonicalLink(path: string) {
  return { rel: "canonical", href: absUrl(path) } as const;
}

/** Default OG image meta trio (image + width + height + alt). */
export function ogImageMeta(image = DEFAULT_OG_IMAGE, alt = "Aniora — Watch Anime Free Online") {
  return [
    { property: "og:image", content: image },
    { property: "og:image:width", content: String(DEFAULT_OG_IMAGE_WIDTH) },
    { property: "og:image:height", content: String(DEFAULT_OG_IMAGE_HEIGHT) },
    { property: "og:image:alt", content: alt },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: alt },
  ];
}

export const NOINDEX_META = { name: "robots", content: "noindex, nofollow" } as const;
