import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Github, Heart } from "lucide-react";

/* ---------- adblock detection (module-level, runs once) ---------- */

let adblockCache: boolean | null = null;
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
  const holder = useRef<HTMLDivElement>(null);
  const encoded = useMemo(() => encodeSlot(slot), [slot]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const unit = pickUnit(format, narrow);

  useEffect(() => {
    // Give the iframe a moment to paint; if nothing meaningful loaded, show placeholder.
    const t = window.setTimeout(() => {
      const iframe = holder.current?.querySelector("iframe");
      setLoaded(Boolean(iframe));
    }, 3000);
    return () => window.clearTimeout(t);
  }, [unit]);

  const isNative = unit === "native";
  const size = isNative ? null : UNITS[unit];

  return (
    <section
      className={`relative mx-auto w-full max-w-full overflow-hidden border border-dashed border-border bg-card/40 ${className}`}
      style={size ? { maxWidth: size.w, minHeight: size.h } : { minHeight: 120 }}
      aria-label="sponsored content"
      data-slot={encoded}
    >
      <div ref={holder} className="flex items-center justify-center">
        {isNative ? (
          <iframe
            title="sponsor"
            srcDoc={NATIVE}
            className="h-full w-full border-0"
            style={{ minHeight: 250 }}
            scrolling="no"
          />
        ) : (
          <iframe
            key={unit}
            title="sponsor"
            srcDoc={size!.doc}
            width={size!.w}
            height={size!.h}
            className="block border-0"
            scrolling="no"
          />
        )}
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
/*  Global social-bar (mounts once). Kept minimal — one script, no UI.        */
/* -------------------------------------------------------------------------- */

export function SocialBarMount() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("aniora-sb")) return;
    const s = document.createElement("script");
    s.id = "aniora-sb";
    s.src = "https://pl30166307.effectivecpmnetwork.com/c1/04/32/c10432c1376985f6b1714e6e8c84df87.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);
  return null;
}
