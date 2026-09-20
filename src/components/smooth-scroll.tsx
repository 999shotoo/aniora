import { useEffect } from "react";
import { useSetting } from "@/lib/settings";

export function SmoothScrollMount() {
  const enabled = useSetting("smoothScroll");

  useEffect(() => {
    if (!enabled) return;
    let lenis: { destroy: () => void; raf: (t: number) => void } | null = null;
    let rafId = 0;
    let cancelled = false;

    (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;
      lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1 });
      const loop = (t: number) => {
        lenis?.raf(t);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, [enabled]);

  return null;
}
