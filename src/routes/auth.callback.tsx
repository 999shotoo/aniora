import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getAniListToken, setAniListToken } from "@/lib/anilist";
import { getAniListAuthUrl, getAniListRedirectUri } from "@/lib/anilist-config";
import { exchangeAniListCode } from "@/lib/anilist-oauth.functions";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const exchangeCode = useServerFn(exchangeAniListCode);
  const [status, setStatus] = useState<"working" | "ok" | "fail">("working");
  const [detail, setDetail] = useState<string>("");
  const [retryUrl, setRetryUrl] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    setRetryUrl(getAniListAuthUrl());

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);

    const token = hashParams.get("access_token") || queryParams.get("access_token");
    const code = queryParams.get("code");
    const err =
      hashParams.get("error") ||
      queryParams.get("error") ||
      queryParams.get("hint");
    const errDesc =
      hashParams.get("error_description") ||
      queryParams.get("error_description") ||
      queryParams.get("message");

    if (token) {
      setAniListToken(token);
      setStatus("ok");
      window.history.replaceState(null, "", window.location.pathname);
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: "anilist-oauth-token", token },
          window.location.origin,
        );
        window.setTimeout(() => window.close(), 300);
        return;
      }
      window.setTimeout(() => navigate({ to: "/profile" }), 400);
      return;
    }

    if (code) {
      const redirectUri = getAniListRedirectUri();
      if (!redirectUri) {
        setStatus("fail");
        setDetail("Could not build the AniList redirect URL. Please try login again.");
        return;
      }

      exchangeCode({ data: { code, redirectUri } })
        .then((result) => {
          setAniListToken(result.accessToken);
          setStatus("ok");
          window.history.replaceState(null, "", window.location.pathname);
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { type: "anilist-oauth-token", token: result.accessToken },
              window.location.origin,
            );
            window.setTimeout(() => window.close(), 300);
            return;
          }
          window.setTimeout(() => navigate({ to: "/profile" }), 400);
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : "AniList token exchange failed. Please try login again.";

          if (shouldUseClientTokenFallback(message)) {
            const fallbackUrl = getAniListAuthUrl("token");
            if (fallbackUrl) {
              sessionStorage.setItem("anilist_oauth_fallback", "1");
              window.location.replace(fallbackUrl);
              return;
            }
          }

          setStatus("fail");
          setDetail(message);
        });
      return;
    }

    if (err) {
      setStatus("fail");
      setDetail(`${err}${errDesc ? `: ${errDesc}` : ""}`);
      return;
    }

    if (getAniListToken()) {
      setStatus("ok");
      window.setTimeout(() => navigate({ to: "/profile" }), 250);
      return;
    }

    setStatus("fail");
    setDetail("AniList did not return an authorization code. Please try login again.");
  }, [exchangeCode, navigate]);

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

function shouldUseClientTokenFallback(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("403") ||
    normalized.includes("manually blocked") ||
    normalized.includes("principal's office") ||
    normalized.includes("principal’s office")
  );
}
