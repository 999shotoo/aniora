// AniList OAuth client config.
// Uses Authorization Code Grant: callback receives a code, server exchanges it for a token.

export const ANILIST_CLIENT_ID: string =
  (import.meta.env.VITE_ANILIST_CLIENT_ID as string | undefined) ?? "44825";

export const ANILIST_REDIRECT_PATH = "/auth/callback";

export function getAniListRedirectUri(): string | null {
  if (typeof window === "undefined") return null;
  return `${window.location.origin}${ANILIST_REDIRECT_PATH}`;
}

export function getAniListAuthUrl(): string | null {
  if (!ANILIST_CLIENT_ID) return null;
  const redirect = getAniListRedirectUri();
  if (!redirect) return null;
  const params = new URLSearchParams({
    client_id: ANILIST_CLIENT_ID,
    redirect_uri: redirect,
    response_type: "code",
  });
  return `https://anilist.co/api/v2/oauth/authorize?${params.toString()}`;
}

