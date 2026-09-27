import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://aniora.qzz.io";

export const Route = createFileRoute("/sitemap-movies.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { fetchAniListSitemap, buildAnimeSitemapXml } = await import(
          "@/lib/sitemap.server"
        );
        const entries = await fetchAniListSitemap(["MOVIE"], {
          pages: 3,
          perPage: 50,
        });
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
