import { useEffect } from "react";
import { useSetting } from "@/lib/settings";

/**
 * Sponsor popunder mount.
 *
 * Opt-in only via Settings → "Enable sponsor popunder ads". Off by default
 * because the provider has historically been flagged by Google Safe Browsing;
 * users who opt in accept that risk. The script is injected client-side only,
 * so it never ships in the SSR HTML crawlers see — protecting SEO / Safe
 * Browsing status for the domain itself.
 */
const SPONSOR_SRC = "//pl24000000.profitableratecpm.com/8e/6c/94/8e6c94a1c9c1b9f9c5e6a7b2c3d4e5f6.js";

export function SocialBarMount() {
  const enabled = useSetting("enableSponsor");

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === "undefined") return;
    if (document.getElementById("aniora-sponsor-script")) return;

    const s = document.createElement("script");
    s.id = "aniora-sponsor-script";
    s.src = SPONSOR_SRC;
    s.async = true;
    s.dataset.cfasync = "false";
    document.body.appendChild(s);

    return () => {
      s.remove();
    };
  }, [enabled]);

  return null;
}
