import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://anilist-dream-stream.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "weekly" | "daily" | "monthly";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/anime", changefreq: "daily", priority: "0.9" },
          { path: "/movies", changefreq: "weekly", priority: "0.8" },
          { path: "/search", changefreq: "weekly", priority: "0.6" },
          { path: "/wishlist", changefreq: "monthly", priority: "0.3" },
          { path: "/history", changefreq: "monthly", priority: "0.3" },
          { path: "/profile", changefreq: "monthly", priority: "0.3" },
        ];

        const urls = entries.map(
          (e) =>
            `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
