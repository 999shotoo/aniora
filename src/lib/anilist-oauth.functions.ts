import { createServerFn } from "@tanstack/react-start";

export const exchangeAniListCode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; redirectUri: string; clientId?: string }) => {
    if (!input || typeof input.code !== "string" || typeof input.redirectUri !== "string") {
      throw new Error("Invalid input");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const clientId = process.env.ANILIST_CLIENT_ID ?? data.clientId ?? "44825";
    const clientSecret = process.env.ANILIST_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error("ANILIST_CLIENT_SECRET is not configured on the server");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: data.redirectUri,
      code: data.code,
    });

    const res = await fetch("https://anilist.co/api/v2/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || !json?.access_token) {
      const msg =
        json?.hint || json?.message || json?.error || `AniList token exchange failed (${res.status})`;
      throw new Error(String(msg));
    }
    return {
      access_token: json.access_token as string,
      token_type: (json.token_type as string) ?? "Bearer",
      expires_in: (json.expires_in as number) ?? null,
    };
  });
