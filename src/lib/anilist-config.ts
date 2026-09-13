// AniList OAuth (Authorization Code) config.
// Uses server-side code exchange so the client secret stays on the server.

export const ANILIST_CLIENT_ID: string =
  (import.meta.env.VITE_ANILIST_CLIENT_ID as string | undefined) ?? "44825";

export const ANILIST_REDIRECT_PATH = "/auth/callback";

export function getAniListRedirectUri(): string {
  return typeof window !== "undefined"
    ? `${window.location.origin}${ANILIST_REDIRECT_PATH}`
    : ANILIST_REDIRECT_PATH;
}

export function getAniListAuthUrl(): string | null {
  if (!ANILIST_CLIENT_ID) return null;
  const params = new URLSearchParams({
    client_id: ANILIST_CLIENT_ID,
    redirect_uri: getAniListRedirectUri(),
    response_type: "code",
  });
  return `https://anilist.co/api/v2/oauth/authorize?${params.toString()}`;
}
