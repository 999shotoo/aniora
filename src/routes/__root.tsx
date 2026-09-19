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



  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
      const raf = (time: number) => {
        lenis.raf(time);
        frame = window.requestAnimationFrame(raf);
      };
      frame = window.requestAnimationFrame(raf);
      cleanup = () => {
        window.cancelAnimationFrame(frame);
        lenis.destroy();
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // Silence benign view-transition aborts that fire when the user
  // navigates before the previous transition finishes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const swallow = (e: PromiseRejectionEvent) => {
      const msg = String((e.reason as Error)?.message ?? e.reason ?? "");
      if (
        msg.includes("Transition was aborted") ||
        msg.includes("Transition was skipped")
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", swallow);
    return () => window.removeEventListener("unhandledrejection", swallow);
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        buster: "v1",
      }}
    >
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="mt-16 border-t border-border">
          <div className="mx-auto flex max-w-none flex-col gap-2 px-6 lg:px-10 py-6 text-[0.65rem] uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>~// aniora · terminal for anime</span>
            <span>data · anilist · mappings · zenshin</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </PersistQueryClientProvider>
  );
}


