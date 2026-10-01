import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "FluidPlayer Test" },
      { name: "description", content: "FluidPlayer VAST test page." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TestPage,
});
declare global {
  interface Window {
    fluidPlayer?: (id: string, opts?: unknown) => unknown;
  }
}
function TestPage() {
  const initedRef = useRef(false);

  useEffect(() => {
    const SRC = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
    const init = () => {
      if (initedRef.current) return;
      if (typeof window.fluidPlayer !== "function") return;
      initedRef.current = true;
      try {
        window.fluidPlayer("video-id", {
          layoutControls: {
            controlBar: { autoHideTimeout: 3, animated: true, autoHide: true },
            htmlOnPauseBlock: { html: null, height: null, width: null },
            autoPlay: true,
            mute: true,
            allowTheatre: true,
            playPauseAnimation: true,
            playbackRateEnabled: true,
            allowDownload: true,
            playButtonShowing: true,
            fillToContainer: false,
            posterImage: "",
          },
          vastOptions: {
            adList: [
              {
                roll: "preRoll",
                vastTag: "https://s.magsrv.com/v1/vast.php?idz=5967748",
                adText: "",
              },
            ],
            adCTAText: false,
            adCTATextPosition: "",
          },
        });
      } catch (e) {
        console.error("fluidPlayer init failed", e);
      }
    };
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    if (existing) {
      if (typeof window.fluidPlayer === "function") init();
      else existing.addEventListener("load", init, { once: true });
    } else {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.onload = init;
      document.body.appendChild(s);
    }
  }, []);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-lg uppercase tracking-widest">FluidPlayer Test</h1>
      <video id="video-id" controls muted playsInline className="w-full">
        <source
          src="https://video.wixstatic.com/video/bd1bd7_43978885514d4ed5b048a2a7c84187c5/1080p/mp4/file.mp4"
          type="video/mp4"
        />
      </video>
    </main>
  );
}
