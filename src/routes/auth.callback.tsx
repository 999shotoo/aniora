import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAniListToken, setAniListToken } from "@/lib/anilist";
import { exchangeAniListCode } from "@/lib/anilist-oauth.functions";
import {
  ANILIST_CLIENT_ID,
  getAniListAuthUrl,
  getAniListRedirectUri,
} from "@/lib/anilist-config";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const exchange = useServerFn(exchangeAniListCode);
  const [status, setStatus] = useState<"working" | "ok" | "fail">("working");
  const [detail, setDetail] = useState<string>("");
  const [retryUrl, setRetryUrl] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const activeKey = "anilist_oauth_code_exchange";
    const authUrl = getAniListAuthUrl();
    const currentRedirectUri = getAniListRedirectUri();
    setRetryUrl(authUrl);
    setRedirectUri(currentRedirectUri);

    const waitForExistingExchange = () => {
      setStatus("working");
      setDetail("finishing AniList sign-in...");
      const interval = window.setInterval(() => {
        if (getAniListToken()) {
          window.clearInterval(interval);
          window.clearTimeout(timeout);
          sessionStorage.removeItem(activeKey);
          setStatus("ok");
          navigate({ to: "/profile" }).catch(() => {});
        }
      }, 200);
      const timeout = window.setTimeout(() => {
        window.clearInterval(interval);
        sessionStorage.removeItem(activeKey);
        setStatus("fail");
        setDetail("AniList sign-in timed out. Please start login again.");
      }, 6000);
      return () => {
        window.clearInterval(interval);
        window.clearTimeout(timeout);
      };
    };

    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);

    // Legacy: implicit-grant token in hash (kept as fallback).
    const hashToken = hashParams.get("access_token");
    if (hashToken) {
      setAniListToken(hashToken);
      setStatus("ok");
      window.history.replaceState(null, "", window.location.pathname);
      const t = setTimeout(() => navigate({ to: "/profile" }), 400);
      return () => clearTimeout(t);
    }

    const err =
      queryParams.get("error") ||
      hashParams.get("error") ||
      queryParams.get("hint");
    const errDesc =
      queryParams.get("error_description") ||
      hashParams.get("error_description") ||
      queryParams.get("message");
    const code = queryParams.get("code");

    if (getAniListToken()) {
      setStatus("ok");
      const t = setTimeout(() => navigate({ to: "/profile" }), 250);
      return () => clearTimeout(t);
    }

    if (!code) {
      if (sessionStorage.getItem(activeKey) === "processing") {
        return waitForExistingExchange();
      }
      setStatus("fail");
      setDetail(
        err
          ? `${err}${errDesc ? `: ${errDesc}` : ""}`
          : "no authorization code in redirect",
      );
      return;
    }

    const activeExchange = sessionStorage.getItem(activeKey);
    if (activeExchange === code || activeExchange === "processing") {
      return waitForExistingExchange();
    }

    sessionStorage.setItem(activeKey, code);

    (async () => {
      try {
        const redirectUri = getAniListRedirectUri();
        if (!redirectUri) throw new Error("Missing redirect URI");
        const res = await exchange({
          data: { code, redirectUri, clientId: ANILIST_CLIENT_ID },
        });
        setAniListToken(res.access_token);
        sessionStorage.removeItem(activeKey);
        setStatus("ok");
        window.history.replaceState(null, "", window.location.pathname);
        setTimeout(() => navigate({ to: "/profile" }), 400);
      } catch (e) {
        sessionStorage.removeItem(activeKey);
        window.history.replaceState(null, "", window.location.pathname);
        setStatus("fail");
        setDetail(e instanceof Error ? e.message : "token exchange failed");
      }
    })();
  }, [navigate, exchange]);

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
