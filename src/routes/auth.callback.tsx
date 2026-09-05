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
    // AniList implicit grant returns token in the URL hash.
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    if (!token) {
      setStatus("fail");
      setDetail("no access_token in redirect hash");
      return;
    }
    setAniListToken(token);
    setStatus("ok");
    // strip hash then redirect home
    window.history.replaceState(null, "", window.location.pathname);
    const t = setTimeout(() => navigate({ to: "/profile" }), 500);
    return () => clearTimeout(t);
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
