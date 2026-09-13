import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { setAniListToken } from "@/lib/anilist";
import { exchangeAniListCode } from "@/lib/anilist-oauth.functions";
import { getAniListRedirectUri } from "@/lib/anilist-config";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const exchange = useServerFn(exchangeAniListCode);
  const [status, setStatus] = useState<"working" | "ok" | "fail">("working");
  const [detail, setDetail] = useState<string>("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

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

    if (!code) {
      setStatus("fail");
      setDetail(
        err
          ? `${err}${errDesc ? `: ${errDesc}` : ""}`
          : "no authorization code in redirect",
      );
      return;
    }

    (async () => {
      try {
        const redirectUri = getAniListRedirectUri();
        if (!redirectUri) throw new Error("Missing redirect URI");
        const res = await exchange({ data: { code, redirectUri } });
        setAniListToken(res.access_token);
        setStatus("ok");
        window.history.replaceState(null, "", window.location.pathname);
        setTimeout(() => navigate({ to: "/profile" }), 400);
      } catch (e) {
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
    </div>
  );
}
