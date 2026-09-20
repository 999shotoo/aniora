import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";

/**
 * Ad slot. Renders an ad by default and falls back to a self-serve
 * placeholder ("Ads go here — email me@aniora.qzz.io") if nothing loads.
 *
 * Wire real ads by injecting an <ins> tag or an <iframe> via `renderAd`.
 * Until then, this ships as a clean, monetize-ready surface.
 */
export interface AdSlotProps {
  slot: string; // stable id — used as data-attr for future ad wiring
  format?: "banner" | "leaderboard" | "square" | "sidebar" | "native";
  className?: string;
  label?: string;
}

const FORMAT_SIZES: Record<NonNullable<AdSlotProps["format"]>, string> = {
  banner: "min-h-[90px]",
  leaderboard: "min-h-[90px] md:min-h-[100px]",
  square: "aspect-square",
  sidebar: "min-h-[250px]",
  native: "min-h-[120px]",
};

export function AdSlot({ slot, format = "banner", className = "", label = "advertisement" }: AdSlotProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Give ad networks 2.5s to inject content; if the slot is still empty,
    // show the placeholder. Wire your ad tag inside this effect when ready.
    const timer = window.setTimeout(() => {
      if (!ref.current) return;
      const hasChild = ref.current.querySelector("iframe, ins, img, script");
      setLoaded(Boolean(hasChild));
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [slot]);

  return (
    <aside
      className={`relative w-full overflow-hidden border border-dashed border-border bg-card/40 ${FORMAT_SIZES[format]} ${className}`}
      aria-label={label}
      data-ad-slot={slot}
    >
      <div ref={ref} className="absolute inset-0" />
      {!loaded && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
          <span className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/70">
            {label} · {slot}
          </span>
          <p className="text-xs text-foreground/80">Ads go here</p>
          <a
            href="mailto:me@aniora.qzz.io?subject=Ad%20placement%20on%20Aniora"
            className="mt-1 inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1 text-[0.6rem] uppercase tracking-widest text-foreground hover:bg-accent"
          >
            <Mail className="h-3 w-3" /> me@aniora.qzz.io
          </a>
        </div>
      )}
    </aside>
  );
}
