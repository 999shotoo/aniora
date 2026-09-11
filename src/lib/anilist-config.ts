// AniList OAuth (Implicit Grant) config.
// Implicit grant is browser-only and does NOT use a client secret —
// only the public client ID is needed. Never ship the AniList client
// secret in frontend code.
//
// Setup:
// 1. Client registered at https://anilist.co/settings/developer
// 2. Redirect URL must match: <origin>/auth/callback
// 3. Override via VITE_ANILIST_CLIENT_ID if needed.

export const ANILIST_CLIENT_ID: string =
  (import.meta.env.VITE_ANILIST_CLIENT_ID as string | undefined) ?? "44825";

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
