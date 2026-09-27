import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://aniora.qzz.io";

interface Entry {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
}

const ENTRIES: Entry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/anime", changefreq: "daily", priority: "0.9" },
  { path: "/movies", changefreq: "weekly", priority: "0.8" },
  // /search is intentionally omitted (noindex).
];

export const Route = createFileRoute("/sitemap-pages.xml")({
  server: {
    handlers: {
      GET: () => {
        const now = new Date().toISOString();
        const urls = ENTRIES.map(
          (e) =>
            `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
        );
        const body = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
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
