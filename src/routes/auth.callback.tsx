import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { setAniListToken } from "@/lib/anilist";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "ok" | "fail">("working");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    // AniList implicit grant returns token in the URL hash (#access_token=...).
    // Errors can arrive in either the hash or the query string.
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);
    const token = hashParams.get("access_token");
    const err =
      hashParams.get("error") ||
      queryParams.get("error") ||
      queryParams.get("hint");
    const errDesc =
      hashParams.get("error_description") ||
      queryParams.get("error_description") ||
      queryParams.get("message");
    const code = queryParams.get("code");

    if (token) {
      setAniListToken(token);
      setStatus("ok");
      window.history.replaceState(null, "", window.location.pathname);
      const t = setTimeout(() => navigate({ to: "/profile" }), 500);
      return () => clearTimeout(t);
    }
    if (code) {
      setStatus("fail");
      setDetail(
        "AniList returned an authorization code (?code=...). This app uses the implicit grant (response_type=token) and can't exchange codes in the browser. In your AniList developer settings, make sure the redirect URL exactly matches this page's URL, then retry.",
      );
      return;
    }
    setStatus("fail");
    setDetail(err ? `${err}${errDesc ? `: ${errDesc}` : ""}` : "no access_token in redirect");
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
      {detail && (
        <p className="mt-2 text-xs text-destructive">{detail}</p>
      )}
    </div>
  );
}
