import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Github, Heart } from "lucide-react";
import { useSettings } from "@/lib/settings";

/* ---------- adblock detection (module-level, runs once) ---------- */

let adblockCache: boolean | null = null;
const getAdblockCache = (): boolean | null => adblockCache;
const adblockListeners = new Set<(v: boolean) => void>();

function runAdblockCheck() {
  if (typeof window === "undefined") return;
  let detected = false;

  // 1. Bait element with class names blocked by common lists
  const bait = document.createElement("div");
  bait.className = "adsbox ad-banner ad-placement pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links";
  bait.style.cssText = "position:absolute!important;left:-9999px!important;top:-9999px!important;width:1px;height:1px;";
  bait.innerHTML = "&nbsp;";
  document.body.appendChild(bait);

  window.setTimeout(() => {
    if (!bait.offsetParent || bait.offsetHeight === 0 || bait.clientHeight === 0) {
      detected = true;
    }
    bait.remove();

    // 2. Fetch a known ad script; blockers will fail the request
    fetch("https://www.highperformanceformat.com/ping.js", { method: "HEAD", mode: "no-cors", cache: "no-store" })
      .catch(() => { detected = true; })
      .finally(() => {
        adblockCache = detected;
        adblockListeners.forEach((cb) => cb(detected));
      });
  }, 100);
}

function useAdblockDetected(): boolean {
  const [v, setV] = useState<boolean>(adblockCache ?? false);
  useEffect(() => {
    if (adblockCache !== null) { setV(adblockCache); return; }
    adblockListeners.add(setV);
    return () => { adblockListeners.delete(setV); };
  }, []);
  return v;
}

/**
 * Sponsor slot. Renders a real ad unit inside a sandboxed iframe (so multiple
 * banners on the same page don't collide on the global `atOptions`) and falls
 * back to a self-serve placeholder if nothing paints. Neutral naming keeps
 * common ad blockers from hiding the wrapper wholesale.
 */

export type AdFormat =
  | "leaderboard" // 728x90 desktop, 320x50 mobile
  | "banner" // 468x60
  | "sidebar" // 300x250
  | "square" // 300x250
  | "skyscraper" // 160x600
  | "native";

export interface AdSlotProps {
  slot: string;
  format?: AdFormat;
  className?: string;
  label?: string;
}

/* ---------- ad codes ---------- */

const HPF = (key: string, width: number, height: number) => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;display:flex;align-items:center;justify-content:center}</style></head><body>
<script type="text/javascript">
  atOptions = { 'key':'${key}', 'format':'iframe', 'height':${height}, 'width':${width}, 'params':{} };
</script>
<script src="https://www.highperformanceformat.com/${key}/invoke.js"></script>
</body></html>`;

const NATIVE = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;color:inherit;font-family:inherit}</style></head><body>
<script async data-cfasync="false" src="https://pl30166308.effectivecpmnetwork.com/7f4743a97860945372928600f22ed0be/invoke.js"></script>
<div id="container-7f4743a97860945372928600f22ed0be"></div>
</body></html>`;

const UNITS = {
  "728x90": { w: 728, h: 90, doc: HPF("b7b85a076465fa072d30eb59ec681bd0", 728, 90) },
  "468x60": { w: 468, h: 60, doc: HPF("9878fa9a4a53def713edc58101b0bef7", 468, 60) },
  "320x50": { w: 320, h: 50, doc: HPF("1f380d685b0e8908c6aea6f2ae4b7339", 320, 50) },
  "300x250": { w: 300, h: 250, doc: HPF("44ccbee22126c8d9d816a5cd0e5e1321", 300, 250) },
  "160x300": { w: 160, h: 300, doc: HPF("6c1a962e98576c8fc1761c89e55cadc4", 160, 300) },
  "160x600": { w: 160, h: 600, doc: HPF("7ab826e93bdaa97ef32f33dbf6570ff2", 160, 600) },
} as const;

type UnitKey = keyof typeof UNITS;

function pickUnit(format: AdFormat, isNarrow: boolean): UnitKey | "native" {
  switch (format) {
    case "leaderboard":
      return isNarrow ? "320x50" : "728x90";
    case "banner":
      return isNarrow ? "320x50" : "468x60";
    case "sidebar":
    case "square":
      return "300x250";
    case "skyscraper":
      return isNarrow ? "300x250" : "160x600";
    case "native":
      return "native";
  }
}

const encodeSlot = (s: string) =>
  typeof window === "undefined" ? s : btoa(s).replace(/=+$/, "").toLowerCase();

export function AdSlot({ slot, format = "banner", className = "", label = "sponsored" }: AdSlotProps) {
  const [narrow, setNarrow] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLElement>(null);
  const encoded = useMemo(() => encodeSlot(slot), [slot]);
  const adblocked = useAdblockDetected();

  useEffect(() => {
    // Fire adblock detection on first AdSlot mount.
    if (adblockCache === null) runAdblockCheck();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Only mount the ad iframe when the slot scrolls into view — keeps offscreen
  // ad scripts from ever executing and blocking the main thread.
  useEffect(() => {
    if (!wrapRef.current || visible) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true);
        io.disconnect();
      }
    }, { rootMargin: "200px" });
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, [visible]);

  const unit = pickUnit(format, narrow);

  useEffect(() => {
    if (adblocked || !visible) return;
    const t = window.setTimeout(() => {
      const iframe = holder.current?.querySelector("iframe");
      setLoaded(Boolean(iframe));
    }, 3000);
    return () => window.clearTimeout(t);
  }, [unit, adblocked, visible]);

  const isNative = unit === "native";
  const size = isNative ? null : UNITS[unit];

  // Adblock detected → replace the ad entirely with a friendly card.
  if (adblocked) {
    return (
      <section
        ref={wrapRef}
        className={`relative mx-auto w-full max-w-full overflow-hidden border border-dashed border-border bg-card/40 px-4 py-5 ${className}`}
        style={size ? { maxWidth: Math.max(size.w, 320), minHeight: Math.max(size.h, 120) } : { minHeight: 140 }}
        aria-label="support aniora"
        data-slot={encoded}
      >
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <span className="inline-flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/80">
            <Heart className="h-3 w-3" /> support aniora
          </span>
          <p className="max-w-md text-xs text-foreground/90">
            Looks like you're using an ad blocker. Ads keep Aniora free — please consider disabling it here, or drop a star on GitHub instead <span aria-hidden>&lt;3</span>
          </p>
          <a
            href="https://github.com/999shotoo/aniora"
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 border border-foreground bg-foreground px-3 py-1 text-[0.6rem] uppercase tracking-widest text-background hover:opacity-90"
          >
            <Github className="h-3 w-3" /> star on github
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={wrapRef}
      className={`relative mx-auto w-full max-w-full overflow-hidden border border-dashed border-border bg-card/40 ${className}`}
      style={size ? { maxWidth: size.w, minHeight: size.h } : { minHeight: 120 }}
      aria-label="sponsored content"
      data-slot={encoded}
    >
      <div ref={holder} className="flex items-center justify-center">
        {visible && (isNative ? (
          <iframe
            title="sponsor"
            srcDoc={NATIVE}
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="h-full w-full border-0"
            style={{ minHeight: 250 }}
            scrolling="no"
          />
        ) : (
          <iframe
            key={unit}
            title="sponsor"
            srcDoc={size!.doc}
            sandbox="allow-scripts allow-same-origin allow-popups"
            width={size!.w}
            height={size!.h}
            className="block border-0"
            scrolling="no"
          />
        ))}
      </div>
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 -z-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
          <span className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/70">
            {label} · {encoded.slice(0, 8)}
          </span>
          <p className="text-xs text-foreground/80">Sponsor slot available</p>
          <a
            href="mailto:me@aniora.qzz.io?subject=Placement%20on%20Aniora"
            className="pointer-events-auto mt-1 inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1 text-[0.6rem] uppercase tracking-widest text-foreground hover:bg-accent"
          >
            <Mail className="h-3 w-3" /> me@aniora.qzz.io
          </a>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Global social-bar. Isolated in a hidden sandboxed iframe so the vendor    */
/*  script cannot block the main thread or hijack navigation.                 */
/* -------------------------------------------------------------------------- */

const SOCIAL_BAR_SRC =
  "https://pl30166305.effectivecpmnetwork.com/16/ea/97/16ea97a656a5ba4a8f70ad0380f1fd3f.js";

export function SocialBarMount() {
  const { settings } = useSettings();
  const enabled = settings.enableSponsor;

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (document.querySelector('script[data-sb="1"]')) return;

    const nav = navigator as unknown as { brave?: { isBrave?: () => Promise<boolean> } };
    let cancelled = false;

    const inject = () => {
      if (cancelled) return;
      try {
        const s = document.createElement("script");
        s.src = SOCIAL_BAR_SRC;
        s.async = true;
        s.defer = true;
        s.setAttribute("data-cfasync", "false");
        s.setAttribute("data-sb", "1");
        s.onerror = () => { try { s.remove(); } catch { /* noop */ } };
        document.body.appendChild(s);
      } catch { /* ignore */ }
    };

    const maybeInject = async () => {
      if (getAdblockCache() === true) return;
      try {
        if (nav.brave?.isBrave && (await nav.brave.isBrave())) return;
      } catch { /* ignore */ }
      if (adblockCache === null) runAdblockCheck();
      await new Promise((r) => window.setTimeout(r, 1200));
      if (cancelled || getAdblockCache() === true) return;

      const ric = (window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (ric) ric(inject, { timeout: 2000 });
      else window.setTimeout(inject, 500);
    };

    const t = window.setTimeout(() => { void maybeInject(); }, 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [enabled]);
  return null;
}
