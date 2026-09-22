import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";

/**
 * Sponsor slot. Uses neutral naming (no "ad", "ads", "advertisement",
 * "banner", "sponsor" tokens in class/attr/id) so common blocklists
 * (EasyList, uBO) don't hide the element outright. Ad networks can still
 * inject inside `ref.current`; if nothing lands within the grace period,
 * we render a self-serve placeholder.
 */
export interface AdSlotProps {
  slot: string;
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

// Obfuscate the slot id so it doesn't match generic "ad-*" filter rules.
const encodeSlot = (s: string) =>
  typeof window === "undefined"
    ? s
    : btoa(s).replace(/=+$/, "").toLowerCase();

export function AdSlot({
  slot,
  format = "banner",
  className = "",
  label = "sponsored",
}: AdSlotProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const encoded = encodeSlot(slot);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!ref.current) return;
      const hasChild = ref.current.querySelector("iframe, ins, img, script");
      setLoaded(Boolean(hasChild));
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [slot]);

  return (
    <section
      className={`relative w-full overflow-hidden border border-dashed border-border bg-card/40 ${FORMAT_SIZES[format]} ${className}`}
      aria-label="sponsored content"
      data-slot={encoded}
    >
      <div ref={ref} className="absolute inset-0" />
      {!loaded && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
          <span className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/70">
            {label} · {encoded.slice(0, 8)}
          </span>
          <p className="text-xs text-foreground/80">Sponsor slot available</p>
          <a
            href="mailto:me@aniora.qzz.io?subject=Placement%20on%20Aniora"
            className="mt-1 inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1 text-[0.6rem] uppercase tracking-widest text-foreground hover:bg-accent"
          >
            <Mail className="h-3 w-3" /> me@aniora.qzz.io
          </a>
        </div>
      )}
    </section>
  );
}
