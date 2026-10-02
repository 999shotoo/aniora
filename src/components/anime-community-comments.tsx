import { useEffect, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";
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
  }
}

interface Props {
  malId: number | null | undefined;
  anilistId: number | null | undefined;
  episode: number | null | undefined;
  mediaType?: "anime" | "manga";
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
}: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const canEmbed = Boolean((malId || anilistId) && episode);
  if (!canEmbed) return null;

  if (isMobile) {
    return (
      <>
        <button
          type="button"
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
  const [loaded, setLoaded] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const embedKey = `${malId ?? "x"}-${anilistId ?? "x"}-${episode}`;

  useEffect(() => {
    if (!enabled || !mountRef.current) return;
    const host = mountRef.current;
    setLoaded(false);

    const cs = getComputedStyle(document.documentElement);
    const get = (v: string, fallback: string) =>
      cs.getPropertyValue(v).trim() || fallback;

    window.theAnimeCommunityConfig = {
      MAL_ID: malId ? String(malId) : undefined,
      AniList_ID: anilistId ? String(anilistId) : undefined,
      episodeChapterNumber: String(episode),
      mediaType,
      removeBorder: "true",
      removePadding: "true",
      colorScheme: {
        backgroundColor: get("--card", "#111111"),
        primaryColor: get("--foreground", "#f2f2f2"),
        dropDownTextColor: get("--foreground", "#f2f2f2"),
        strongTextColor: get("--foreground", "#f2f2f2"),
        primaryTextColor: get("--foreground", "#f2f2f2"),
        secondaryTextColor: get("--muted-foreground", "#a3a3a3"),
        iconColor: get("--muted-foreground", "#a3a3a3"),
        accentColor: get("--border", "#242424"),
      },
      customCSS: `
        .mantine-Paper-root { border-radius: 0 !important; }
        .mantine-Button-root { border-radius: 0 !important; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; }
        .mantine-Textarea-input, .mantine-Input-input { border-radius: 0 !important; }
        .mantine-Avatar-root { border-radius: 2px !important; }
      `,
    };

    host.innerHTML = "";
    const target = document.createElement("div");
    target.id = "anime-community-comment-section";
    host.appendChild(target);

    const script = document.createElement("script");
    script.src = "https://theanimecommunity.com/embed.js";
    script.id = "anime-community-script";
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setLoaded(true);
    target.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, [enabled, embedKey, malId, anilistId, episode, mediaType]);

  return (
    <>
      {!loaded && <CommentsSkeleton />}
      <div key={embedKey} ref={mountRef} className={loaded ? "" : "hidden"} />
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
