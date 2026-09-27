import { createFileRoute, Link } from "@tanstack/react-router";

const URL = "https://aniora.qzz.io/blog/best-anime-websites";

export const Route = createFileRoute("/blog/best-anime-websites")({
  component: BestAnimeWebsitesGuide,
  head: () => ({
    meta: [
      { title: "Best Anime Websites in 2026: Free Streaming Sites Compared" },
      {
        name: "description",
        content:
          "Comparison of the best free anime websites in 2026 — features, sub/dub support, AniList integration, ads, and player quality across the top platforms.",
      },
      { property: "og:title", content: "Best Anime Websites in 2026: Free Streaming Sites Compared" },
      {
        property: "og:description",
        content:
          "Compare the best anime websites of 2026 — features, subs/dubs, AniList sync, and viewing experience.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { property: "og:image", content: "https://aniora.qzz.io/og.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "article:published_time", content: "2026-01-15" },
      { property: "article:modified_time", content: "2026-07-01" },
      { property: "article:author", content: "Aniora" },
      { property: "article:section", content: "Anime" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://aniora.qzz.io/og.png" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Best Anime Websites in 2026: Free Streaming Sites Compared",
          description:
            "A hands-on comparison of the best free anime websites in 2026, covering library size, sub/dub support, player quality, ads, and AniList integration.",
          image: "https://aniora.qzz.io/og.png",
          author: { "@type": "Organization", name: "Aniora", url: "https://aniora.qzz.io" },
          publisher: {
            "@type": "Organization",
            name: "Aniora",
            logo: { "@type": "ImageObject", url: "https://aniora.qzz.io/apple-touch-icon.png" },
          },
          datePublished: "2026-01-15",
          dateModified: "2026-07-01",
          mainEntityOfPage: URL,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://aniora.qzz.io/" },
            { "@type": "ListItem", position: 2, name: "Blog", item: "https://aniora.qzz.io/blog" },
            { "@type": "ListItem", position: 3, name: "Best Anime Websites", item: URL },
          ],
        }),
      },
    ],
  }),
});


interface Site {
  name: string;
  tagline: string;
  pros: string[];
  cons: string[];
  best: string;
}

const SITES: Site[] = [
  {
    name: "Aniora",
    tagline: "Terminal-clean anime discovery with AniList sync",
    pros: [
      "Free, no signup required to watch",
      "Optional AniList login syncs your list and progress",
      "Sub and dub toggles per episode",
      "Fast, minimal UI with keyboard-first navigation",
    ],
    cons: ["Newer platform, community still growing"],
    best: "Viewers who want a clean, no-nonsense interface with real AniList tracking.",
  },
  {
    name: "Crunchyroll",
    tagline: "The industry-standard licensed anime platform",
    pros: ["Massive licensed library", "Simulcasts hours after Japan", "Official subs and dubs"],
    cons: ["Paid tiers required for most content", "Regional catalog gaps", "Heavy ads on the free tier"],
    best: "Fans who want first-party licensed streams and don't mind a subscription.",
  },
  {
    name: "HiAnime (formerly Zoro)",
    tagline: "Free streaming with a huge catalog",
    pros: ["Wide sub and dub coverage", "Fast release schedule", "No account required"],
    cons: ["Pop-up ads on the free player", "Domain changes frequently", "Legality varies by region"],
    best: "Viewers who prioritize catalog breadth and don't mind occasional ads.",
  },
  {
    name: "AniWave",
    tagline: "Community-favorite free aggregator",
    pros: ["Clean episode lists", "Multiple stream sources per episode", "Good mobile experience"],
    cons: ["Ads on some players", "Metadata quality varies"],
    best: "Casual viewers who want quick access without setup.",
  },
  {
    name: "9anime",
    tagline: "Long-running free streaming site",
    pros: ["Deep back catalog", "Multiple resolutions", "Search and genre filters"],
    cons: ["Aggressive ads", "Frequent mirror domains"],
    best: "Users hunting older or obscure titles.",
  },
  {
    name: "AnimePahe",
    tagline: "Lightweight, low-bandwidth streaming",
    pros: ["Tiny file sizes", "Fast loading on slow connections", "Minimal UI"],
    cons: ["Subs only, no dubs", "Smaller newer-season selection"],
    best: "Sub-only viewers on limited bandwidth.",
  },
];

function BestAnimeWebsitesGuide() {
  return (
    <article className="mx-auto max-w-3xl px-6 lg:px-10 py-10 text-sm leading-relaxed">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">guide · updated july 2026</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Best Anime Websites in 2026: Free Streaming Sites Compared
        </h1>
        <p className="text-muted-foreground">
          A hands-on look at the best anime websites this year — what each one is good at, where it
          falls short, and how to pick the right one for how you actually watch.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">How we compared them</h2>
        <p className="mb-3">
          Every site here was judged on five things: library depth, sub and dub availability, player
          quality, ad load, and whether it plays nicely with a tracker like AniList or MyAnimeList.
          A great anime website isn't just a big catalog — it's fast, it remembers where you left
          off, and it doesn't bury the play button under three pop-ups.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">The list</h2>
        <div className="space-y-6">
          {SITES.map((site, i) => (
            <div key={site.name} className="border border-border rounded-lg p-5 bg-card/40">
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <h3 className="text-lg font-semibold">
                  {i + 1}. {site.name}
                </h3>
              </div>
              <p className="text-muted-foreground italic mb-4">{site.tagline}</p>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Pros</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {site.pros.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Cons</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {site.cons.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p>
                <span className="text-xs uppercase tracking-wider text-muted-foreground mr-2">
                  Best for
                </span>
                {site.best}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">What to look for in a free anime website</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Sub and dub toggle</strong> — the best anime websites let you switch language on
            the same episode without hunting for a mirror.
          </li>
          <li>
            <strong>AniList or MAL sync</strong> — tracking watch progress across devices is the
            single biggest quality-of-life feature.
          </li>
          <li>
            <strong>Low ad friction</strong> — pop-ups and redirect scripts are the number one
            reason people bounce.
          </li>
          <li>
            <strong>Episode-accurate metadata</strong> — release dates, thumbnails, and titles
            should match what's actually aired.
          </li>
          <li>
            <strong>Responsive player</strong> — quality selector, subtitle style, and keyboard
            shortcuts.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Are free anime websites legal?</h2>
        <p className="mb-3">
          Officially licensed platforms (Crunchyroll, Netflix, HIDIVE, Prime Video) hold streaming
          rights in most regions. Free aggregator sites operate in a grey area that varies by
          country. If you want to support the industry directly, subscribe to a licensed service
          for the shows you love and use free sites for discovery and back-catalog exploration.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Try Aniora</h2>
        <p className="mb-4">
          Aniora focuses on the parts most anime websites get wrong: fast navigation, honest
          episode data, and real AniList sync. It's free, needs no signup, and works on any device.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            Open Aniora
          </Link>
          <Link
            to="/anime"
            className="inline-flex items-center px-4 py-2 rounded-md border border-border hover:bg-muted"
          >
            Browse anime
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center px-4 py-2 rounded-md border border-border hover:bg-muted"
          >
            Search titles
          </Link>
        </div>
      </section>
    </article>
  );
}
