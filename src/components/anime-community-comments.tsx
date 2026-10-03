import { useEffect, useRef, useState } from "react";
import { MessageSquare, RotateCw, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

declare global {
  interface Window {
    theAnimeCommunityConfig?: Record<string, unknown>;
    theAnimeCommunity?: { reload?: () => void };
    __ANIME_COMMUNITY_WIDGET_LOADED__?: boolean;
  }
}

interface Props {
  malId: number | null | undefined;
  anilistId: number | null | undefined;
  episode: number | null | undefined;
  mediaType?: "anime" | "manga";
  variant?: "responsive" | "drawer" | "inline";
}

/**
 * theanimecommunity.com comment embed, themed.
 * - Desktop: inline panel, always open.
 * - Mobile: pill trigger that opens a YouTube-style bottom drawer.
 * - Widget re-mounts per episode so the config reloads.
 */
export function AnimeCommunityComments({
  malId,
  anilistId,
  episode,
  mediaType = "anime",
  variant = "responsive",
}: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsLargeScreen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const canEmbed = Boolean((malId || anilistId) && episode);
  if (!canEmbed) return null;
  if (variant === "inline" && !isLargeScreen) return null;

  const useDrawer = variant === "drawer" || (variant === "responsive" && isMobile);

  if (useDrawer) {
    return (
      <>
        <button
          type="button"
          data-comments-anchor
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
        >
          <span className="flex items-center gap-2 text-[0.7rem] uppercase tracking-widest text-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            comments
          </span>
          <span className="border border-border bg-background px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            ep {episode} · tap to open
          </span>
        </button>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="h-[88vh] border-t border-border bg-card">
            <DrawerHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
              <DrawerTitle className="flex items-center gap-2 text-[0.7rem] uppercase tracking-widest text-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                comments · ep {episode}
              </DrawerTitle>
              <DrawerClose
                aria-label="Close comments"
                className="flex h-8 w-8 items-center justify-center border border-border bg-background text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </DrawerClose>
            </DrawerHeader>
            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-3"
            >
              <CommentsEmbed
                malId={malId}
                anilistId={anilistId}
                episode={episode!}
                mediaType={mediaType}
                enabled={open}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <section className="border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[0.7rem] uppercase tracking-widest text-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>comments</span>
        <span className="text-muted-foreground">· ep {episode}</span>
      </header>
      <div className="p-3 sm:p-4">
        <CommentsEmbed
          malId={malId}
          anilistId={anilistId}
          episode={episode!}
          mediaType={mediaType}
          enabled
        />
      </div>
    </section>
  );
}

function CommentsEmbed({
  malId,
  anilistId,
  episode,
  mediaType,
  enabled,
}: {
  malId: number | null | undefined;
  anilistId: number | null | undefined;
  episode: number;
  mediaType: "anime" | "manga";
  enabled: boolean;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [retryTick, setRetryTick] = useState(0);
  const mountRef = useRef<HTMLDivElement>(null);
  const embedKey = `${malId ?? "x"}-${anilistId ?? "x"}-${episode}-${retryTick}`;

  useEffect(() => {
    if (!enabled || !mountRef.current) return;
    const host = mountRef.current;
    setState("loading");

    // The upstream embed hard-codes document.getElementById(), so only one
    // mount target can have this id. Remove stale/hidden duplicates first.
    document.querySelectorAll("#anime-community-comment-section").forEach((node) => {
      if (!host.contains(node)) node.removeAttribute("id");
    });

    const cs = getComputedStyle(document.documentElement);
    const get = (v: string, fallback: string) =>
      cs.getPropertyValue(v).trim() || fallback;

    const bg = get("--card", "#111111");
    const fg = get("--foreground", "#f2f2f2");
    const muted = get("--muted", "#181818");
    const mutedFg = get("--muted-foreground", "#a3a3a3");
    const border = get("--border", "#242424");
    const accent = get("--accent", "#1f1f1f");

    const applyConfig = () => {
      window.theAnimeCommunityConfig = {
        MAL_ID: malId ? String(malId) : undefined,
        AniList_ID: anilistId ? String(anilistId) : undefined,
        episodeChapterNumber: String(episode),
        mediaType,
        removeBorder: "true",
        removePadding: "true",
        colorScheme: {
          backgroundColor: bg,
          primaryColor: fg,
          dropDownTextColor: fg,
          strongTextColor: fg,
          primaryTextColor: fg,
          secondaryTextColor: mutedFg,
          iconColor: mutedFg,
          accentColor: border,
        },
        // Patch remaining white surfaces the widget renders (avatar
        // placeholders, action-icon hovers, menus, code blocks, etc.)
        customCSS: `
          html, body { background: ${bg} !important; color: ${fg} !important; }
          [style*="background-color: #fff"],
          [style*="background-color:#fff"],
          [style*="background-color: rgb(255, 255, 255)"],
          [style*="background: #fff"],
          [style*="background:#fff"],
          [style*="background: rgb(255, 255, 255)"],
          [style*="background: white"],
          [style*="background-color: white"] {
            background-color: ${bg} !important;
            background: ${bg} !important;
            color: ${fg} !important;
          }
          [style*="color: #000"],
          [style*="color:#000"],
          [style*="color: rgb(0, 0, 0)"],
          [style*="color: black"] { color: ${fg} !important; }
          .mantine-Paper-root { background-color: ${bg} !important; border-radius: 0 !important; border-color: ${border} !important; }
          .mantine-Card-root { background-color: ${bg} !important; }
          .mantine-Button-root { border-radius: 0 !important; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; background-color: ${accent} !important; color: ${fg} !important; border-color: ${border} !important; }
          .mantine-Button-root:hover { background-color: ${muted} !important; }
          .mantine-Button-filled, [data-variant="filled"].mantine-Button-root { background-color: ${fg} !important; color: ${bg} !important; }
          .mantine-Button-filled:hover, [data-variant="filled"].mantine-Button-root:hover { background-color: ${mutedFg} !important; color: ${bg} !important; }
          .mantine-Textarea-input, .mantine-Input-input, .mantine-TextInput-input, .mantine-Select-input {
            border-radius: 0 !important;
            background-color: ${muted} !important;
            color: ${fg} !important;
            border-color: ${border} !important;
          }
          .mantine-Avatar-root, .mantine-Avatar-placeholder { border-radius: 2px !important; background-color: ${accent} !important; color: ${fg} !important; }
          .mantine-Avatar-image { background-color: ${accent} !important; }
          .mantine-ActionIcon-root { color: ${mutedFg} !important; background-color: transparent !important; }
          .mantine-ActionIcon-root:hover { background-color: ${accent} !important; color: ${fg} !important; }
          .mantine-Menu-dropdown, .mantine-Popover-dropdown, .mantine-Select-dropdown, .mantine-Modal-content, .mantine-Modal-header {
            background-color: ${bg} !important; border-color: ${border} !important; color: ${fg} !important;
          }
          .mantine-Menu-item, .mantine-Select-item { color: ${fg} !important; }
          .mantine-Menu-item:hover, .mantine-Select-item:hover { background-color: ${accent} !important; }
          .mantine-Divider-root { border-color: ${border} !important; }
          .mantine-Skeleton-root, .mantine-Skeleton-visible { background-color: ${muted} !important; }
          .mantine-Skeleton-root::after, .mantine-Skeleton-visible::after { background: linear-gradient(90deg, transparent, ${accent}, transparent) !important; }
          .mantine-Loader-root { color: ${mutedFg} !important; }
          code, pre { background-color: ${muted} !important; color: ${fg} !important; }
          img[src=""], img:not([src]) { background-color: ${accent} !important; }
        `,
      };
    };

    const ensureTarget = () => {
      let target = host.querySelector<HTMLDivElement>("#anime-community-comment-section");
      if (!target) {
        host.innerHTML = "";
        target = document.createElement("div");
        target.id = "anime-community-comment-section";
        host.appendChild(target);
      }
      return target;
    };

    // Try to call the widget's own reload API first — it re-renders in place
    // without racing duplicate <script> insertions (which is what causes blanks).
    const tryReload = () => {
      applyConfig();
      ensureTarget();
      if (typeof window.theAnimeCommunity?.reload === "function") {
        try {
          window.theAnimeCommunity.reload();
          return true;
        } catch {
          /* fall through to fresh mount */
        }
      }
      return false;
    };

    // Fresh mount: clear host, drop the target div, append script.
    const freshMount = () => {
      applyConfig();
      const target = ensureTarget();

      document
        .querySelectorAll("script#anime-community-script")
        .forEach((n) => n.remove());
      if (!window.theAnimeCommunity?.reload) {
        window.__ANIME_COMMUNITY_WIDGET_LOADED__ = false;
      }

      const script = document.createElement("script");
      script.src = "https://theanimecommunity.com/embed.js";
      script.id = "anime-community-script";
      script.defer = true;
      script.onerror = () => setState("error");
      target.appendChild(script);
    };

    if (!tryReload()) {
      freshMount();
    }

    // Watchdog: the embed creates its iframe at height: 0, then posts a resize
    // message. If the resize message is missed, give the iframe a safe desktop
    // height instead of leaving a blank 0px panel.
    let cancelled = false;
    const start = Date.now();
    const poll = window.setInterval(() => {
      if (cancelled) return;
      const iframe = host.querySelector<HTMLIFrameElement>("iframe");
      if (iframe && Date.now() - start > 1200) {
        iframe.style.opacity = "1";
        if ((Number.parseFloat(iframe.style.height || "0") || 0) <= 40) {
          iframe.style.height = window.innerWidth < 768 ? "68vh" : "560px";
        }
      }
      const iframeHeight = iframe
        ? Math.max(
            iframe.getBoundingClientRect().height,
            Number.parseFloat(iframe.style.height || "0") || 0,
          )
        : 0;
      const rendered = iframe && iframeHeight > 40;
      if (rendered) {
        setState("ready");
        window.clearInterval(poll);
      } else if (!iframe && Date.now() - start > 10000) {
        setState("error");
        window.clearInterval(poll);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [enabled, embedKey, malId, anilistId, episode, mediaType]);

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-background/40 px-4 py-10 text-center">
        <p className="text-[0.7rem] uppercase tracking-widest text-muted-foreground">
          comments failed to load
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          The comment service is unreachable or blocked. Check any adblocker and try again.
        </p>
        <button
          onClick={() => {
            setState("loading");
            setRetryTick((n) => n + 1);
          }}
          className="inline-flex items-center gap-2 border border-border bg-background px-3 py-1.5 text-[0.65rem] uppercase tracking-widest text-foreground hover:bg-accent"
        >
          <RotateCw className="h-3 w-3" /> retry
        </button>
      </div>
    );
  }

  return (
    <>
      {state === "loading" && <CommentsSkeleton />}
      <div
        key={embedKey}
        ref={mountRef}
        className="min-h-0"
      />
    </>
  );
}



function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="h-9 w-9 shrink-0 shimmer border border-border" />
        <div className="flex-1 space-y-2">
          <div className="h-20 w-full shimmer border border-border" />
          <div className="flex justify-end gap-2">
            <div className="h-7 w-16 shimmer border border-border" />
            <div className="h-7 w-20 shimmer border border-border" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 shimmer" />
        <div className="h-6 w-20 shimmer border border-border" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-8 w-8 shrink-0 shimmer border border-border" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-3 w-24 shimmer" />
              <div className="h-3 w-16 shimmer opacity-60" />
            </div>
            <div className="h-3 w-11/12 shimmer" />
            <div className="h-3 w-9/12 shimmer" />
            <div className="flex gap-3 pt-1">
              <div className="h-3 w-10 shimmer opacity-60" />
              <div className="h-3 w-10 shimmer opacity-60" />
              <div className="h-3 w-12 shimmer opacity-60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
