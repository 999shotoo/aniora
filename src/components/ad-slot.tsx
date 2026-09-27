import { useEffect } from "react";

/**
 * Single sponsor script mount. Always injects once per session.
 * Skips Brave (which blocks + can crash on this provider) and defers
 * injection to idle time so it never blocks LCP / hydration / SEO paint.
 */
const SPONSOR_SRC =
  "//smooth-survey.com/c.D/9b6PbD2b5_ltSSWwQN9nN/zlEP4QN-jQMu5/MYyN0A3hMtTngb2MMxzskg3i";

export function SocialBarMount() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector('script[data-sb="1"]')) return;

    const nav = navigator as unknown as { brave?: { isBrave?: () => Promise<boolean> } };
    let cancelled = false;

    const inject = () => {
      if (cancelled) return;
      try {
        const s = document.createElement("script");
        s.src = SPONSOR_SRC;
        s.async = true;
        s.referrerPolicy = "no-referrer-when-downgrade";
        s.setAttribute("data-sb", "1");
        (s as unknown as { settings?: Record<string, unknown> }).settings = {};
        s.onerror = () => {
          try {
            s.remove();
          } catch {
            /* noop */
          }
        };
        document.body.appendChild(s);
      } catch {
        /* ignore */
      }
    };

    const maybeInject = async () => {
      try {
        if (nav.brave?.isBrave && (await nav.brave.isBrave())) return;
      } catch {
        /* ignore */
      }
      const ric = (window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (ric) ric(inject, { timeout: 2000 });
      else window.setTimeout(inject, 500);
    };

    const t = window.setTimeout(() => {
      void maybeInject();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  return null;
}
