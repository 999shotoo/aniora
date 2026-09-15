import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { exchangeAniListCode } from "@/lib/anilist-oauth.functions";
import { getAniListToken, setAniListToken } from "@/lib/anilist";
import {
  ANILIST_CLIENT_ID,
  getAniListFallbackAuthUrl,
  getAniListAuthUrl,
  getAniListRedirectUri,
} from "@/lib/anilist-config";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const exchangeCodeForToken = useServerFn(exchangeAniListCode);
  const [status, setStatus] = useState<"working" | "ok" | "fail">("working");
  const [detail, setDetail] = useState<string>("");
  const [retryUrl, setRetryUrl] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;
    let closeTimer: number | undefined;
    let navTimer: number | undefined;

    const authUrl = getAniListAuthUrl();
    const fallbackAuthUrl = getAniListFallbackAuthUrl();
    const currentRedirectUri = getAniListRedirectUri();
    setRetryUrl(authUrl);
    setRedirectUri(currentRedirectUri);

    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const err =
      queryParams.get("error") ||
      queryParams.get("hint") ||
      hashParams.get("error");
    const errDesc =
      queryParams.get("error_description") ||
      queryParams.get("message") ||
      hashParams.get("error_description");

    const code = queryParams.get("code");
    const hashToken = hashParams.get("access_token");

    async function finishWithToken(token: string) {
      setAniListToken(token);
      setStatus("ok");
      window.history.replaceState(null, "", window.location.pathname);
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: "anilist-oauth-token", token },
          window.location.origin,
        );
        closeTimer = window.setTimeout(() => window.close(), 350);
        return;
      }
      navTimer = window.setTimeout(() => navigate({ to: "/profile" }), 400);
    }

    async function exchangeCode() {
      if (hashToken) {
        await finishWithToken(hashToken);
        return;
      }

      if (err) {
        setStatus("fail");
        setDetail(`${err}${errDesc ? `: ${errDesc}` : ""}`);
        return;
      }

      if (!currentRedirectUri) {
        setStatus("fail");
        setDetail("Could not resolve the callback URL for AniList login.");
        return;
      }

      if (!code) {
        if (getAniListToken()) {
          setStatus("ok");
          navTimer = window.setTimeout(() => navigate({ to: "/profile" }), 250);
          return;
        }
        setStatus("fail");
        setDetail("AniList did not return an authorization code. Please try login again.");
        return;
      }

      const codeKey = `anilist-code:${code}`;
      const cachedToken = sessionStorage.getItem(`${codeKey}:token`);
      if (cachedToken) {
        await finishWithToken(cachedToken);
        return;
      }

      if (sessionStorage.getItem(codeKey) === "pending") {
        for (let i = 0; i < 30; i += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 100));
          const resolvedToken = sessionStorage.getItem(`${codeKey}:token`);
          if (resolvedToken) {
            await finishWithToken(resolvedToken);
            return;
          }
        }
        setStatus("fail");
        setDetail("This AniList login code is still being processed. Please wait or try login again.");
        return;
      }

      sessionStorage.setItem(codeKey, "pending");

      try {
        const token = await exchangeCodeForToken({
          data: {
            code,
            redirectUri: currentRedirectUri,
            clientId: ANILIST_CLIENT_ID,
          },
        });
        sessionStorage.setItem(`${codeKey}:token`, token.access_token);
        sessionStorage.removeItem(codeKey);
        if (cancelled) return;
        await finishWithToken(token.access_token);
      } catch (error) {
        if (cancelled) return;
        sessionStorage.removeItem(codeKey);
        const message = error instanceof Error ? error.message : "AniList token exchange failed.";
        const fallbackKey = `anilist-code-fallback:${code}`;

        if (message.includes("blocked (403)") && fallbackAuthUrl && !sessionStorage.getItem(fallbackKey)) {
          sessionStorage.setItem(fallbackKey, "1");
          setDetail("AniList blocked the server exchange. Retrying through AniList directly...");
          navTimer = window.setTimeout(() => {
            window.location.href = fallbackAuthUrl;
          }, 650);
          return;
        }

        setStatus("fail");
        setDetail(message);
      }
    }

    void exchangeCode();

    return () => {
      cancelled = true;
      if (closeTimer) window.clearTimeout(closeTimer);
      if (navTimer) window.clearTimeout(navTimer);
    };
  }, [exchangeCodeForToken, navigate]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center font-mono">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        ~$ ./anilist --oauth
      </div>
      <h1 className="mt-3 text-xl font-medium">
        {status === "working" && "authorizing..."}
        {status === "ok" && "signed in"}
        {status === "fail" && "authorization failed"}
      </h1>
      {detail && <p className="mt-2 text-xs text-destructive">{detail}</p>}
      {status === "fail" && redirectUri && (
        <p className="mt-3 max-w-md break-all text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          redirect url · {redirectUri}
        </p>
      )}
      {status === "fail" && retryUrl && (
        <a
          href={retryUrl}
          className="mt-5 border border-border bg-foreground px-4 py-2 text-[0.65rem] font-medium uppercase tracking-widest text-background hover:opacity-90"
        >
          try login again
        </a>
      )}
    </div>
  );
}
