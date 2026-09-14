import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getAniListToken, setAniListToken } from "@/lib/anilist";
import { getAniListAuthUrl, getAniListRedirectUri } from "@/lib/anilist-config";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "ok" | "fail">("working");
  const [detail, setDetail] = useState<string>("");
  const [retryUrl, setRetryUrl] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const authUrl = getAniListAuthUrl();
    const currentRedirectUri = getAniListRedirectUri();
    setRetryUrl(authUrl);
    setRedirectUri(currentRedirectUri);

    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);

    const hashToken = hashParams.get("access_token");
    if (hashToken) {
      setAniListToken(hashToken);
      setStatus("ok");
      window.history.replaceState(null, "", window.location.pathname);
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: "anilist-oauth-token", token: hashToken },
          window.location.origin,
        );
        const closeTimer = setTimeout(() => window.close(), 350);
        return () => clearTimeout(closeTimer);
      }
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

    if (getAniListToken()) {
      setStatus("ok");
      const t = setTimeout(() => navigate({ to: "/profile" }), 250);
      return () => clearTimeout(t);
    }

    setStatus("fail");
    setDetail(
      err
        ? `${err}${errDesc ? `: ${errDesc}` : ""}`
        : "AniList did not return a client token. Please try login again.",
    );
  }, [navigate]);

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
