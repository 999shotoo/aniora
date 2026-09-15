import { createServerFn } from "@tanstack/react-start";

export const exchangeAniListCode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; redirectUri: string; clientId?: string }) => {
    if (!input || typeof input.code !== "string" || typeof input.redirectUri !== "string") {
      throw new Error("Invalid input");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const clientId = String(process.env.ANILIST_CLIENT_ID ?? data.clientId ?? "44825").trim();
    const clientSecret = process.env.ANILIST_CLIENT_SECRET?.trim();
    if (!clientSecret) {
      throw new Error("ANILIST_CLIENT_SECRET is not configured on the server");
    }

    const payload = {
      grant_type: "authorization_code",
      client_id: String(clientId),
      client_secret: clientSecret,
      redirect_uri: data.redirectUri,
      code: data.code,
    };

    const res = await fetch("https://anilist.co/api/v2/oauth/token", {
      method: "POST",
      headers: {
        // AniList's Authorization Code Grant expects JSON exactly as documented.
        // Do not retry as form-data or against the GraphQL host: those paths can
        // return misleading `unsupported_grant_type` errors.
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    let json: any = {};
    try {
      json = rawText ? JSON.parse(rawText) : {};
    } catch {
      json = { raw: rawText.slice(0, 500) };
    }

    if (res.ok && json?.access_token) {
      return {
        access_token: json.access_token as string,
        token_type: (json.token_type as string) ?? "Bearer",
        expires_in: (json.expires_in as number) ?? null,
      };
    }

    console.warn("AniList OAuth exchange failed", {
      status: res.status,
      error: json?.error,
      message: json?.message,
      hint: json?.hint,
      raw: json?.raw,
      clientId,
      redirectUri: data.redirectUri,
      hasCode: Boolean(data.code),
      hasSecret: Boolean(clientSecret),
    });

    const providerMsg = json?.hint || json?.message || json?.error || json?.raw;
    const msg = providerMsg
      ? `AniList token exchange failed (${res.status}): ${providerMsg}`
      : `AniList token exchange failed (${res.status}). Make sure this exact redirect URL is registered in AniList: ${data.redirectUri}`;

    throw new Error(String(msg));
  });
