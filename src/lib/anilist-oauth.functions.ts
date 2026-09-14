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

    const res = await fetch("https://anilist.co/api/v2/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "AnioraApp/1.0 (+https://lovable.app)",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: String(clientId),
        client_secret: clientSecret,
        redirect_uri: data.redirectUri,
        code: data.code,
      }),
    });
    const rawText = await res.text();
    let json: any = {};
    try { json = rawText ? JSON.parse(rawText) : {}; } catch { json = { raw: rawText.slice(0, 300) }; }
    
    if (!res.ok || !json?.access_token) {
      console.warn("AniList OAuth exchange failed", {
        status: res.status,
        error: json?.error,
        message: json?.message,
        hint: json?.hint,
        clientId,
        redirectUri: data.redirectUri,
      });
      const providerMsg = json?.hint || json?.message || json?.error;
      const msg = providerMsg
        ? `AniList token exchange failed (${res.status}): ${providerMsg}`
        : `AniList token exchange failed (${res.status}). Make sure this exact redirect URL is registered in AniList: ${data.redirectUri}`;
      throw new Error(String(msg));
    }
    return {
      access_token: json.access_token as string,
      token_type: (json.token_type as string) ?? "Bearer",
      expires_in: (json.expires_in as number) ?? null,
    };
  });
