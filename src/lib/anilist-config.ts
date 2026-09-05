// AniList OAuth (Implicit Grant) config.
// 1. Create a client at: https://anilist.co/settings/developer
// 2. Set the Redirect URL to: <your-app-origin>/auth/callback
// 3. Paste your Client ID below (or set VITE_ANILIST_CLIENT_ID in env).
// The Client ID is a public value — safe to commit.

export const ANILIST_CLIENT_ID: string =
  (import.meta.env.VITE_ANILIST_CLIENT_ID as string | undefined) ?? "";

export const ANILIST_REDIRECT_PATH = "/auth/callback";

export function getAniListAuthUrl(): string | null {
  if (!ANILIST_CLIENT_ID) return null;
  const redirect =
    typeof window !== "undefined"
      ? `${window.location.origin}${ANILIST_REDIRECT_PATH}`
      : ANILIST_REDIRECT_PATH;
  const params = new URLSearchParams({
    client_id: ANILIST_CLIENT_ID,
    redirect_uri: redirect,
    response_type: "token",
  });
  return `https://anilist.co/api/v2/oauth/authorize?${params.toString()}`;
}
