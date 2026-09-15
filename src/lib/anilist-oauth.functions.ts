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

    const endpoints = ["https://anilist.co/api/v2/oauth/token", "https://graphql.anilist.co/api/v2/oauth/token"];
    const browserLikeHeaders = {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Aniora/1.0 Safari/537.36",
    };

    const requests = endpoints.flatMap((endpoint) => [
      {
        endpoint,
        bodyType: "json" as const,
        headers: {
          ...browserLikeHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      {
        endpoint,
        bodyType: "form" as const,
        headers: {
          ...browserLikeHeaders,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(payload).toString(),
      },
    ]);

    const attempts = [] as Array<{
      endpoint: string;
      bodyType: "json" | "form";
      status: number;
      json: any;
    }>;

    for (const request of requests) {
      const res = await fetch(request.endpoint, {
        method: "POST",
        headers: request.headers,
        body: request.body,
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

      attempts.push({ endpoint: request.endpoint, bodyType: request.bodyType, status: res.status, json });

      // 403 is a host/WAF block before OAuth validation, so try the alternate
      // host/body format. Any other OAuth response means AniList understood the
      // one-time code, so do not burn it with more retries.
      if (res.status !== 403) break;
    }

    const last = attempts.at(-1);
    if (last) {
      const allAttemptsWere403 = attempts.every((attempt) => attempt.status === 403);
      console.warn("AniList OAuth exchange failed", {
        attempts: attempts.map((attempt) => ({
          status: attempt.status,
          endpoint: attempt.endpoint,
          bodyType: attempt.bodyType,
          error: attempt.json?.error,
          message: attempt.json?.message,
          hint: attempt.json?.hint,
          raw: attempt.json?.raw,
        })),
        error: last.json?.error,
        message: last.json?.message,
        hint: last.json?.hint,
        raw: last.json?.raw,
        clientId,
        redirectUri: data.redirectUri,
      });

      if (allAttemptsWere403) {
        throw new Error("AniList token exchange blocked (403). Retrying with the browser-safe AniList flow.");
      }

      const providerMsg =
        last.json?.hint || last.json?.message || last.json?.error || last.json?.raw;
      const msg = providerMsg
        ? `AniList token exchange failed (${last.status}): ${providerMsg}`
        : `AniList token exchange failed (${last.status}). Make sure this exact redirect URL is registered in AniList: ${data.redirectUri}`;
      throw new Error(String(msg));
    }

    throw new Error("AniList token exchange failed before a request was made.");
  });
