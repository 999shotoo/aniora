import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, User, LogOut, Bookmark, Menu, X, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAniListViewer, useAniListLogout } from "@/lib/anilist-auth";
import { getAniListAuthUrl } from "@/lib/anilist-config";
import { searchAnime, FALLBACK_COVER, type AniListMedia } from "@/lib/anilist";
import { SmartImage } from "@/components/smart-image";

const LINKS = [
  { to: "/", label: "home" },
  { to: "/anime", label: "anime" },
  { to: "/movies", label: "movies" },
  { to: "/search", label: "search" },
  { to: "/history", label: "history" },
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
      <div className="mx-auto flex h-14 max-w-none items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex shrink-0 items-baseline gap-1 font-mono text-sm">
          <span className="text-muted-foreground">~//</span>
          <span className="text-foreground font-medium">zen</span>
          <span className="hidden text-muted-foreground xs:inline sm:inline">.stream</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
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

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <HeaderSearch />
          <Link
            to="/wishlist"
            className="hidden h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:text-foreground sm:flex"
            aria-label="Wishlist"
          >
            <Bookmark className="h-4 w-4" />
          </Link>

          {viewer ? (
            <div className="hidden items-center gap-2 border border-border px-2 py-1 lg:flex">
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
              className="hidden h-8 items-center border border-border bg-foreground px-3 text-[0.65rem] font-medium uppercase tracking-widest text-background hover:opacity-90 lg:inline-flex"
            >
              login · anilist
            </a>
          ) : null}

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

function HeaderSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false); // mobile
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 260);
    return () => clearTimeout(t);
  }, [value]);

  const { data: results, isFetching } = useQuery({
    queryKey: ["header-search", debounced],
    queryFn: ({ signal }) => searchAnime(debounced, { perPage: 8 }).catch(() => [] as AniListMedia[]),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  // Close dropdown on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const submit = (q: string) => {
    if (!q.trim()) return;
    navigate({
      to: "/search",
      search: { q: q.trim(), format: "ANY", genre: "" },
    }).catch(() => {});
    setOpen(false);
    setExpanded(false);
  };

  const items = results ?? [];

  return (
    <div ref={wrapRef} className="relative">
      {/* Mobile: collapsed icon that expands into full-width overlay */}
      <button
        onClick={() => {
          setExpanded(true);
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:text-foreground sm:hidden"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Desktop input, always visible */}
      <div className="hidden sm:block">
        <div className="flex h-8 w-56 items-center gap-2 border border-border bg-input px-2 text-xs focus-within:border-foreground md:w-64 lg:w-72">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit(value);
              if (e.key === "Escape") {
                setValue("");
                setOpen(false);
              }
            }}
            placeholder="search anime..."
            className="w-full bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search anime"
          />
          {isFetching ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
          ) : value ? (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                setValue("");
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Mobile overlay input */}
      {expanded && (
        <div className="fixed inset-x-0 top-14 z-40 border-b border-border bg-background px-3 py-2 sm:hidden">
          <div className="flex h-9 w-full items-center gap-2 border border-border bg-input px-2 text-xs focus-within:border-foreground">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit(value);
              }}
              placeholder="search anime..."
              className="w-full bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Search anime"
            />
            <button
              onClick={() => {
                setValue("");
                setExpanded(false);
                setOpen(false);
              }}
              className="text-muted-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Results dropdown */}
      <AnimatePresence>
        {open && debounced.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="fixed left-2 right-2 top-[3.5rem] z-40 max-h-[70vh] overflow-y-auto border border-border bg-background shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-1 sm:w-[22rem] md:w-[26rem]"
          >
            {isFetching && items.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-4 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> searching...
              </div>
            ) : items.length === 0 ? (
              <div className="px-3 py-4 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                no results
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {items.map((m) => {
                    const title =
                      m.title.english || m.title.romaji || m.title.native || "?";
                    const meta = [
                      m.format,
                      m.seasonYear,
                      m.episodes ? `${m.episodes} eps` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <li key={m.id}>
                        <Link
                          to="/anime/$id"
                          params={{ id: String(m.id) }}
                          onClick={() => {
                            setOpen(false);
                            setExpanded(false);
                            setValue("");
                          }}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-muted/40"
                        >
                          <div className="h-14 w-10 shrink-0 overflow-hidden bg-muted/40">
                            <SmartImage
                              src={m.coverImage.large || m.coverImage.medium || FALLBACK_COVER}
                              fallback={FALLBACK_COVER}
                              alt={title}
                              className="h-full w-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-xs font-medium text-foreground">
                              {title}
                            </p>
                            <p className="mt-0.5 line-clamp-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                              {meta || "—"}
                            </p>
                          </div>
                          {m.averageScore ? (
                            <span className="shrink-0 font-mono text-[0.6rem] text-muted-foreground">
                              {(m.averageScore / 10).toFixed(1)}★
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <button
                  onClick={() => submit(value)}
                  className="block w-full border-t border-border px-3 py-2 text-left text-[0.6rem] uppercase tracking-widest text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                >
                  view all results for "{debounced}" →
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
