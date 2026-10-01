import { useEffect, useRef, useState } from "react";
import { ChevronDown, MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
 * Embeds theanimecommunity.com comment widget scoped to the given episode.
 * - Desktop: always open.
 * - Mobile: collapsed by default with a YouTube-style expand toggle.
 * - Fully re-mounts on episode change so the widget re-inits with new config.
 */
export function AnimeCommunityComments({
  malId,
  anilistId,
  episode,
  mediaType = "anime",
}: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);

  // Desktop is always open.
  const expanded = isMobile ? open : true;

  const canEmbed = Boolean((malId || anilistId) && episode);
  const embedKey = `${malId ?? "x"}-${anilistId ?? "x"}-${episode ?? "x"}`;

  useEffect(() => {
    if (!expanded || !canEmbed || !mountRef.current) return;
    const host = mountRef.current;
    setLoaded(false);

    // Read theme tokens off :root so the iframe matches the site.
    const cs = getComputedStyle(document.documentElement);
    const get = (v: string, fallback: string) =>
      (cs.getPropertyValue(v).trim() || fallback);

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

    // Clean any prior mount contents.
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
  }, [expanded, canEmbed, embedKey, malId, anilistId, episode, mediaType]);

  if (!canEmbed) return null;

  return (
    <section className="mt-6 border border-border bg-card">
      <button
        type="button"
        onClick={() => isMobile && setOpen((v) => !v)}
        aria-expanded={expanded}
        aria-controls="community-comments-body"
        className={
          "flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left " +
          (isMobile ? "cursor-pointer hover:bg-accent" : "cursor-default")
        }
      >
        <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-widest text-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>comments</span>
          <span className="text-muted-foreground">· ep {episode}</span>
        </div>
        {isMobile && (
          <ChevronDown
            className={
              "h-4 w-4 text-muted-foreground transition-transform " +
              (expanded ? "rotate-180" : "")
            }
          />
        )}
      </button>

      {expanded && (
        <div id="community-comments-body" className="p-3 sm:p-4">
          {!loaded && <CommentsSkeleton />}
          <div
            key={embedKey}
            ref={mountRef}
            className={loaded ? "" : "hidden"}
          />
        </div>
      )}
    </section>
  );
}

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Composer */}
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

      {/* Sort bar */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 shimmer" />
        <div className="h-6 w-20 shimmer border border-border" />
      </div>

      {/* Comment rows */}
      {Array.from({ length: 4 }).map((_, i) => (
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
