import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Zen Stream — Anime, terminal-clean." },
      {
        name: "description",
        content:
          "Stream anime with a terminal-style interface. Powered by AniList. Search, wishlist, and watch dub or sub.",
      },
      { name: "author", content: "Zen Stream" },
      { property: "og:title", content: "Zen Stream — Anime, terminal-clean." },
      {
        property: "og:description",
        content:
          "Stream anime with a terminal-style interface. Powered by AniList.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <RouteLoadingBar />
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="mt-16 border-t border-border">
          <div className="mx-auto flex max-w-none flex-col gap-2 px-6 lg:px-10 py-6 text-[0.65rem] uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>~// zen.stream · terminal for anime</span>
            <span>data · anilist · mappings · zenshin</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

function RouteLoadingBar() {
  const isLoading = useRouterState({
    select: (s) => s.status === "pending" || s.isLoading || s.isTransitioning,
  });
  if (!isLoading) return null;
  return (
    <div className="top-loader" role="status" aria-label="Loading route" />
  );
}

