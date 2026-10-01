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
  const adInitedRef = useRef(false);

  // ClickAdilla "Overlay video – JS code" loader for zone #7196013 (admpid 447226).
  // The overlay script reads the CSS selector you set in ClickAdilla's
  // dashboard (should be "#video-id") and attaches itself there once it loads.
  useEffect(() => {
    if (adInitedRef.current) return;
    adInitedRef.current = true;

    const ADILLA_SCRIPT_SRC = "https://js.wpadmngr.com/static/adManager.js";
    const ADILLA_ADMPID = "447226";

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${ADILLA_SCRIPT_SRC}"]`,
    );
    if (!existing) {
      const s = document.createElement("script");
      s.src = ADILLA_SCRIPT_SRC;
      s.async = true;
      s.setAttribute("data-admpid", ADILLA_ADMPID);
      s.onload = () => {
        console.log("ClickAdilla overlay script loaded");
      };
      s.onerror = () => {
        console.error("ClickAdilla overlay script failed to load");
      };
      document.body.appendChild(s);
    }
  }, []);

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
          // No vastOptions here: ClickAdilla's overlay JS script (loaded
          // above) handles ad serving on its own via the CSS selector you
          // set in the dashboard. Mixing VAST-in-FluidPlayer with the JS
          // overlay on the same element can double-serve ads or conflict,
          // so pick one integration type per zone.
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
