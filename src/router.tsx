import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Aggressive caching — avoid re-hitting AniList/mappings on every mount.
        staleTime: 10 * 60_000,
        gcTime: 60 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // No preload — avoids fetching route chunks on hover (cuts edge requests).
    defaultPreload: false,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultViewTransition: false,
  });

  return router;
};
