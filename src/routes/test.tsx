import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "ArtPlayer VAST Test" },
      { name: "description", content: "ArtPlayer + vast-player VAST test page." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TestArtPage,
});

declare global {
  interface Window {
    Artplayer?: any;
    VASTPlayer?: any;
  }
}

// Try this tag first, then fall back to the second if it errors / no-fills.
const VAST_TAG_PRIMARY = "https://s.magsrv.com/v1/vast.php?idz=5967748";
const VAST_TAG_FALLBACK = "https://vast.yomeno.xyz/vast?spot_id=1495679";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      // Already loaded or loading — just wait a tick and resolve.
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(s);
  });
}

function TestArtPage() {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const initedRef = useRef(false);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    let art: any;
    let vastPlayer: any;

    const init = async () => {
      try {
        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js"),
          loadScript(
            "https://cdn.jsdelivr.net/npm/vast-player@latest/dist/vast-player.min.js",
          ),
        ]);

        if (!videoContainerRef.current || !adContainerRef.current) return;
        if (!window.Artplayer || !window.VASTPlayer) {
          console.error("Artplayer or VASTPlayer failed to attach to window");
          return;
        }

        // Set up the main ArtPlayer instance, paused until the ad finishes.
        art = new window.Artplayer({
          container: videoContainerRef.current,
          url: "https://video.wixstatic.com/video/bd1bd7_43978885514d4ed5b048a2a7c84187c5/1080p/mp4/file.mp4",
          autoplay: false,
          muted: true,
          volume: 0.5,
          isLive: false,
          playsInline: true,
          autoSize: false,
          fullscreen: true,
          fullscreenWeb: true,
          setting: true,
        });

        // Hide the real player behind the ad overlay until the ad resolves.
        adContainerRef.current.style.display = "block";

        vastPlayer = new window.VASTPlayer(adContainerRef.current);

        const runAd = async (tagUrl: string, isFallback: boolean) => {
          try {
            await vastPlayer.load(tagUrl);
            await vastPlayer.startAd();
            console.log(
              `VAST ad started successfully (${isFallback ? "fallback" : "primary"} tag)`,
            );
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const isEmptyNoFill = message.includes(
              "Reduce of empty array with no initial value",
            );
            if (isEmptyNoFill) {
              console.warn(
                `No ad available (empty VAST response) on ${isFallback ? "fallback" : "primary"} tag`,
              );
            } else {
              console.error(
                `VAST ad failed on ${isFallback ? "fallback" : "primary"} tag:`,
                err,
              );
            }
            if (!isFallback) {
              // Primary tag failed — try the fallback tag once.
              await runAd(VAST_TAG_FALLBACK, true);
            } else {
              // Both tags failed — skip the ad and show the real player.
              console.warn("Both VAST tags failed. Falling back to content.");
              if (adContainerRef.current) {
                adContainerRef.current.style.display = "none";
              }
              art.play();
            }
          }
        };

        vastPlayer.once("AdStopped", () => {
          console.log("Ad finished playback, starting main content");
          if (adContainerRef.current) {
            adContainerRef.current.style.display = "none";
          }
          art.play();
        });

        runAd(VAST_TAG_PRIMARY, false);
      } catch (e) {
        console.error("ArtPlayer/VAST init failed", e);
      }
    };

    init();

    return () => {
      art?.destroy?.();
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-lg uppercase tracking-widest">
        ArtPlayer VAST Test
      </h1>
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <div
          ref={adContainerRef}
          className="absolute inset-0 z-10"
          style={{ display: "none" }}
        />
        <div ref={videoContainerRef} className="absolute inset-0" />
      </div>
    </main>
  );
}
