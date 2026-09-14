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

    const payload = {
      grant_type: "authorization_code",
      client_id: String(clientId),
      client_secret: clientSecret,
      redirect_uri: data.redirectUri,
      code: data.code,
    };

    // The documented host is anilist.co, but it can return a Cloudflare 403
    // from some server environments. The same OAuth route is reachable on the
    // API host used by AniList GraphQL, so try that first and keep the official
    // host as a fallback for compatibility.
    const endpoints = [
      "https://graphql.anilist.co/api/v2/oauth/token",
      "https://anilist.co/api/v2/oauth/token",
    ];

    const attempts = [] as Array<{
      endpoint: string;
      status: number;
      json: any;
    }>;

    for (const endpoint of endpoints) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "AnioraApp/1.0 (+https://lovable.app)",
        },
        body: JSON.stringify(payload),
      });
      const rawText = await res.text();
      let json: any = {};
      try {
        json = rawText ? JSON.parse(rawText) : {};
      } catch {
        json = { raw: rawText.slice(0, 300) };
      }

      if (res.ok && json?.access_token) {
        return {
          access_token: json.access_token as string,
          token_type: (json.token_type as string) ?? "Bearer",
          expires_in: (json.expires_in as number) ?? null,
        };
      }

      attempts.push({ endpoint, status: res.status, json });

      // A 403 can be host/WAF-specific, so fall through to the alternate host.
      // Other OAuth errors mean AniList understood the request and retrying the
      // same one-time code on another host risks burning it for no benefit.
      if (res.status !== 403) break;
    }

    const last = attempts.at(-1);
    if (last) {
      console.warn("AniList OAuth exchange failed", {
        status: last.status,
        endpoint: last.endpoint,
        error: last.json?.error,
        message: last.json?.message,
        hint: last.json?.hint,
        raw: last.json?.raw,
        clientId,
        redirectUri: data.redirectUri,
      });
      const providerMsg =
        last.json?.hint || last.json?.message || last.json?.error || last.json?.raw;
      const msg = providerMsg
        ? `AniList token exchange failed (${last.status}): ${providerMsg}`
        : `AniList token exchange failed (${last.status}). Make sure this exact redirect URL is registered in AniList: ${data.redirectUri}`;
      throw new Error(String(msg));
    }

    throw new Error("AniList token exchange failed before a request was made.");
  });
