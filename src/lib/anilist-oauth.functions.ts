import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const exchangeInputSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
});

const tokenResponseSchema = z
  .object({
    access_token: z.string().min(1),
    token_type: z.string().optional(),
    expires_in: z.number().optional(),
  })
  .passthrough();

export const exchangeAniListCode = createServerFn({ method: "POST" })
  .validator((data: unknown) => exchangeInputSchema.parse(data))
  .handler(async ({ data }) => {
    const clientSecret = process.env.ANILIST_CLIENT_SECRET;
    const clientId =
      process.env.ANILIST_CLIENT_ID ??
      process.env.VITE_ANILIST_CLIENT_ID ??
      "44825";

    if (!clientSecret) {
      throw new Error("AniList client secret is not configured.");
    }

    const response = await fetch("https://anilist.co/api/v2/oauth/token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: data.redirectUri,
        code: data.code,
      }),
    });

    const rawBody = await response.text();
    let json: unknown = null;
    if (rawBody) {
      try {
        json = JSON.parse(rawBody);
      } catch {
        json = null;
      }
    }

    if (!response.ok) {
      const message =
        typeof json === "object" && json && "message" in json
          ? String((json as { message?: unknown }).message)
          : rawBody.trim();
      throw new Error(
        `AniList token exchange failed (${response.status})${
          message ? `: ${message}` : ""
        }`,
      );
    }

    const parsed = tokenResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error("AniList token exchange did not return an access token.");
    }

    return {
      accessToken: parsed.data.access_token,
      tokenType: parsed.data.token_type ?? "Bearer",
      expiresIn: parsed.data.expires_in ?? null,
    };
  });