import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://aniora.qzz.io";

interface Post {
  slug: string;
  lastmod: string;
}

// Keep in sync with `src/routes/blog.*.tsx`.
const POSTS: Post[] = [
  { slug: "best-anime-websites", lastmod: "2026-07-01" },
];

export const Route = createFileRoute("/sitemap-blog.xml")({
  server: {
    handlers: {
      GET: () => {
        const urls = POSTS.map(
          (p) =>
            `  <url>\n    <loc>${BASE_URL}/blog/${p.slug}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
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
            "Cache-Control": "public, max-age=21600, s-maxage=86400",
          },
        });
      },
    },
  },
});
