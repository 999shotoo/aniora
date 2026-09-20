import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSettings } from "@/lib/settings";

export interface Shortcut {
  keys: string[]; // display, e.g. ["Shift", "S"]
  combo: string; // matcher, e.g. "shift+s"
  scope: "global" | "watch";
  label: string;
  icon?: string; // lucide icon name (rendered by help modal)
}

export const SHORTCUTS: Shortcut[] = [
  { keys: ["/"], combo: "/", scope: "global", label: "Focus search", icon: "Search" },
  { keys: ["Shift", "S"], combo: "shift+s", scope: "global", label: "Open settings", icon: "Settings" },
  { keys: ["Shift", "?"], combo: "shift+?", scope: "global", label: "Show shortcuts", icon: "Keyboard" },
  { keys: ["G", "H"], combo: "g h", scope: "global", label: "Go to home", icon: "Home" },
  { keys: ["G", "A"], combo: "g a", scope: "global", label: "Go to anime", icon: "Clapperboard" },
  { keys: ["G", "M"], combo: "g m", scope: "global", label: "Go to movies", icon: "Film" },
  { keys: ["G", "W"], combo: "g w", scope: "global", label: "Go to wishlist", icon: "Bookmark" },
  { keys: ["G", "Y"], combo: "g y", scope: "global", label: "Go to history", icon: "History" },
  { keys: ["G", "P"], combo: "g p", scope: "global", label: "Go to profile", icon: "User" },
  { keys: ["["], combo: "[", scope: "watch", label: "Previous episode", icon: "ChevronLeft" },
  { keys: ["]"], combo: "]", scope: "watch", label: "Next episode", icon: "ChevronRight" },
  { keys: ["F"], combo: "f", scope: "watch", label: "Fullscreen player", icon: "Maximize" },
  { keys: ["T"], combo: "t", scope: "watch", label: "Toggle sub / dub", icon: "Languages" },
  { keys: ["Esc"], combo: "escape", scope: "global", label: "Close modals", icon: "X" },
];

/* -------------------------------------------------------------------------- */
/*  Global shortcut handler                                                   */
/* -------------------------------------------------------------------------- */

const isEditable = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
};

export function GlobalShortcuts() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { settings, openSettings } = useSettings();

  useEffect(() => {
    let gPending = false;
    let gTimer: number | null = null;

    const clearG = () => {
      gPending = false;
      if (gTimer) window.clearTimeout(gTimer);
    };

    const openHelp = () => window.dispatchEvent(new CustomEvent("aniora:shortcuts"));

    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }

      // "/" → focus search
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && settings.disableBrowserSearchKey) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Search anime"]');
        if (input) input.focus();
        return;
      }

      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        openHelp();
        return;
      }

      if (e.key === "S" && e.shiftKey) {
        e.preventDefault();
        openSettings();
        return;
      }

      if (e.key === "Escape") {
        window.dispatchEvent(new CustomEvent("aniora:escape"));
        return;
      }

      // "g" prefix combos
      if (!gPending && e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        gPending = true;
        gTimer = window.setTimeout(clearG, 900);
        return;
      }
      if (gPending) {
        clearG();
        const to =
          { h: "/", a: "/anime", m: "/movies", w: "/wishlist", y: "/history", p: "/profile" }[
            e.key.toLowerCase()
          ] ?? null;
        if (to) {
          e.preventDefault();
          navigate({ to }).catch(() => {});
        }
        return;
      }

      // Watch-scoped keys are handled per page — dispatch a custom event.
      if (pathname.startsWith("/watch")) {
        const dispatch = (name: string) =>
          window.dispatchEvent(new CustomEvent(`aniora:watch:${name}`));
        if (e.key === "[") { e.preventDefault(); dispatch("prev"); }
        else if (e.key === "]") { e.preventDefault(); dispatch("next"); }
        else if (e.key.toLowerCase() === "f") { e.preventDefault(); dispatch("fullscreen"); }
        else if (e.key.toLowerCase() === "t") { e.preventDefault(); dispatch("toggle-lang"); }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearG();
    };
  }, [navigate, openSettings, pathname, settings.disableBrowserSearchKey]);

  return null;
}
