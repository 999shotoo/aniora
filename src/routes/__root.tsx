import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useMemo, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site-header";
import { useAniListWatchSync } from "@/lib/anilist-sync-hook";
import { SettingsProvider } from "@/lib/settings";
import { SettingsModal } from "@/components/settings-modal";
import { GlobalShortcuts } from "@/lib/shortcuts";
import { SmoothScrollMount } from "@/components/smooth-scroll";
import { SocialBarMount } from "@/components/ad-slot";

function AniListSyncMount() {
  useAniListWatchSync();
  return null;
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">{title}</h3>
      <ul className="space-y-2 text-xs">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-foreground/80 transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 lg:px-10">
      <div className="max-w-md text-center font-mono">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          ~$ cat /dev/null
        </div>
        <h1 className="mt-2 text-6xl font-medium text-foreground">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          this route doesn't exist. maybe it aired in an alternate timeline.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center border border-foreground bg-foreground px-6 lg:px-10 py-2 text-[0.7rem] uppercase tracking-widest text-background"
        >
          return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 lg:px-10">
      <div className="max-w-md text-center font-mono">
        <div className="text-xs uppercase tracking-widest text-destructive">
          ~$ ./run — exit 1
        </div>
        <h1 className="mt-2 text-2xl font-medium text-foreground">
          something crashed
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="border border-foreground bg-foreground px-6 lg:px-10 py-2 text-[0.7rem] uppercase tracking-widest text-background"
          >
            retry
          </button>
          <Link
            to="/"
            className="border border-border px-6 lg:px-10 py-2 text-[0.7rem] uppercase tracking-widest text-foreground"
          >
            home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  ssr: false,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0a0a0a" },
      { title: "Aniora — Watch Anime Free Online, Sub & Dub in HD" },
      {
        name: "description",
        content:
          "Aniora is a free anime streaming site. Watch trending, seasonal, and classic anime online in HD — sub or dub — with AniList sync, no signup required.",
      },
      {
        name: "keywords",
        content:
          "aniora, watch anime free, free anime streaming, anime streaming site, watch anime online, anime sub, anime dub, anime hd, anilist, hianime alternative, miruro alternative, anitaku alternative, 9anime alternative, aniwatch, animepahe",
      },
      { name: "author", content: "Aniora" },
      { name: "application-name", content: "Aniora" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:site_name", content: "Aniora" },
      { property: "og:title", content: "Aniora — Watch Anime Free Online, Sub & Dub in HD" },
      {
        property: "og:description",
        content:
          "Free anime streaming with AniList sync. Watch trending, seasonal, and classic anime — sub or dub — in HD.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Aniora — Watch Anime Free Online, Sub & Dub in HD" },
      {
        name: "twitter:description",
        content:
          "Free anime streaming with AniList sync — sub, dub, and a clean player.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://graphql.anilist.co" },
      { rel: "preconnect", href: "https://s4.anilist.co" },
      { rel: "dns-prefetch", href: "https://megaplay.buzz" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Aniora",
          alternateName: ["Aniora Anime", "Aniora Stream"],
          url: "https://aniora.qzz.io",
          description:
            "Free anime streaming site with AniList integration — watch sub or dub in HD.",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://aniora.qzz.io/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Aniora",
          url: "https://aniora.qzz.io",
          logo: "https://aniora.qzz.io/favicon.ico",
          sameAs: [],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const persister = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : createSyncStoragePersister({
            storage: window.localStorage,
            key: "aniora-query-cache",
            throttleTime: 2000,
          }),
    [],
  );

  if (!persister) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1"><Outlet /></main>
      </div>
    );
  }




  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        buster: "v1",
      }}
    >
      <SettingsProvider>
        <SmoothScrollMount />
        <GlobalShortcuts />
        <SettingsModal />
        <SocialBarMount />
        <div className="flex min-h-screen flex-col bg-background">
          <AniListSyncMount />
          <SiteHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <footer className="mt-10 border-t border-border bg-background/50">
            <div className="mx-auto grid max-w-none gap-10 px-6 lg:px-10 py-12 md:grid-cols-[1.4fr_1fr_1fr] lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
              <div className="space-y-3 font-mono">
                <Link to="/" className="flex items-baseline gap-1 text-lg">
                  <span className="text-muted-foreground">~//</span>
                  <span className="font-semibold text-foreground">aniora</span>
                </Link>
                <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                  Aniora is a free anime streaming site. Watch anime online, sub or dub, in HD — with optional AniList sync for tracking.
                </p>
                <p className="max-w-md text-[0.65rem] leading-relaxed text-muted-foreground/70">
                  This website does not retain any files on its server. It solely provides links to media content hosted by third-party services.
                </p>
              </div>

              <FooterCol title="Discover" links={[
                { to: "/", label: "Home" },
                { to: "/anime", label: "TV Anime" },
                { to: "/movies", label: "Movies" },
                { to: "/search", label: "Search" },
              ]} />

              <FooterCol title="Library" links={[
                { to: "/history", label: "Watch History" },
                { to: "/wishlist", label: "Wishlist" },
                { to: "/profile", label: "Profile" },
              ]} />

              <FooterCol title="Read" links={[
                { to: "/blog/best-anime-websites", label: "Best Anime Sites" },
              ]} />
            </div>
            <div className="border-t border-border">
              <div className="mx-auto flex max-w-none flex-col gap-2 px-6 lg:px-10 py-4 text-[0.65rem] uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>© {new Date().getFullYear()} aniora.qzz.io</span>
                <span className="sm:ml-auto">watch · track · enjoy</span>
              </div>
            </div>
          </footer>
        </div>
      </SettingsProvider>
    </PersistQueryClientProvider>
  );
}


