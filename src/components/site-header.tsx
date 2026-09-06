import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, User, LogOut, Bookmark, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAniListViewer, useAniListLogout } from "@/lib/anilist-auth";
import { getAniListAuthUrl } from "@/lib/anilist-config";

const LINKS = [
  { to: "/", label: "home" },
  { to: "/anime", label: "anime" },
  { to: "/movies", label: "movies" },
  { to: "/search", label: "search" },
  { to: "/wishlist", label: "wishlist" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { viewer } = useAniListViewer();
  const logout = useAniListLogout();
  const [open, setOpen] = useState(false);

  const authUrl = getAniListAuthUrl();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-none items-center gap-4 px-6 lg:px-10">
        <Link to="/" className="flex shrink-0 items-baseline gap-1 font-mono">
          <span className="text-muted-foreground">~//</span>
          <span className="text-foreground font-medium">zen</span>
          <span className="text-muted-foreground">.stream</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active =
              l.to === "/"
                ? pathname === "/"
                : pathname === l.to || pathname.startsWith(l.to + "/");
            return (
              <Link
                key={l.to}
                to={l.to}
                className={
                  "px-2 py-1 text-xs uppercase tracking-widest transition-colors " +
                  (active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <HeaderSearch />
          <Link
            to="/wishlist"
            className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:text-foreground"
            aria-label="Wishlist"
          >
            <Bookmark className="h-4 w-4" />
          </Link>

          {viewer ? (
            <div className="hidden items-center gap-2 border border-border px-2 py-1 sm:flex">
              {viewer.avatar?.medium ? (
                <img
                  src={viewer.avatar.medium}
                  alt={viewer.name}
                  className="h-6 w-6 object-cover"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
              <Link
                to="/profile"
                className="text-xs uppercase tracking-widest hover:text-foreground"
              >
                {viewer.name}
              </Link>
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : authUrl ? (
            <a
              href={authUrl}
              className="hidden h-8 items-center border border-border bg-foreground px-3 text-[0.65rem] font-medium uppercase tracking-widest text-background hover:opacity-90 sm:inline-flex"
            >
              login · anilist
            </a>
          ) : (
            <span
              className="hidden text-[0.6rem] uppercase tracking-widest text-muted-foreground sm:inline"
              title="Set VITE_ANILIST_CLIENT_ID to enable"
            >
              anilist off
            </span>
          )}

          <button
            className="flex h-8 w-8 items-center justify-center border border-border md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-none flex-col px-6 lg:px-10 py-2">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-xs uppercase tracking-widest text-muted-foreground last:border-b-0 hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            {viewer ? (
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="py-3 text-left text-xs uppercase tracking-widest text-destructive"
              >
                logout · {viewer.name}
              </button>
            ) : authUrl ? (
              <a
                href={authUrl}
                className="py-3 text-xs uppercase tracking-widest text-foreground"
              >
                login · anilist
              </a>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
