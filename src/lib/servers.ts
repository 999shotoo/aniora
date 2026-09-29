// Multi-server iframe source discovery via aniora-iframe.
import { useQuery } from "@tanstack/react-query";

export interface StreamServer {
  server: string;
  url: string;
  default?: boolean;
}

export interface ServersResponse {
  success: boolean;
  servers: {
    sub: StreamServer[];
    dub: StreamServer[];
  };
}

const BASE = "https://aniora-iframe.vercel.app/api/servers";

export async function fetchServers(
  anilistId: number,
  episode: number,
): Promise<ServersResponse["servers"] | null> {
  try {
    const res = await fetch(`${BASE}?id=${anilistId}&ep_id=${episode}`);
    if (!res.ok) return null;
    const json = (await res.json()) as ServersResponse;
    if (!json.success) return null;
    return json.servers;
  } catch {
    return null;
  }
}

export function useServers(anilistId: number | null, episode: number) {
  return useQuery({
    queryKey: ["stream-servers", anilistId, episode],
    queryFn: () => fetchServers(anilistId!, episode),
    enabled: !!anilistId && Number.isFinite(episode) && episode > 0,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function withAutoplay(url: string, autoplay: boolean): string {
  if (!autoplay) return url;
  return url.includes("?") ? `${url}&autoplay=1` : `${url}?autoplay=1`;
}
