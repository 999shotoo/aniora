import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://aniora.qzz.io";

// Sitemap index — points crawlers at each child sitemap.
// Child sitemaps are generated on demand from AniList so new titles are
// discoverable as soon as they appear on the platform.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const now = new Date().toISOString();
        const children = [
          "sitemap-pages.xml",
          "sitemap-anime.xml",
          "sitemap-movies.xml",
          "sitemap-blog.xml",
        ];
        const body = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...children.map(
            (name) =>
              `  <sitemap>\n    <loc>${BASE_URL}/${name}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
          ),
          `</sitemapindex>`,
        ].join("\n");

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=21600",
          },
        });
      },
    },
  },
});
