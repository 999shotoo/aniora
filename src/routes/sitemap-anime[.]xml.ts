import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://aniora.qzz.io";

export const Route = createFileRoute("/sitemap-anime.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { fetchAniListSitemap, buildAnimeSitemapXml } = await import(
          "@/lib/sitemap.server"
        );
        // Top 4 * 50 = 200 titles across TV + short + OVA + ONA + special.
        // Enough to cover the actively-searched catalogue without exceeding
        // AniList's rate limit or hitting the 50k-URL sitemap ceiling.
        const entries = await fetchAniListSitemap(
          ["TV", "TV_SHORT", "OVA", "ONA", "SPECIAL"],
          { pages: 4, perPage: 50 },
        );
        const body = buildAnimeSitemapXml(entries, BASE_URL);
        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=21600, s-maxage=86400",
          },
        });
      },
    },
  },
});
