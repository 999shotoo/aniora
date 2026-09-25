import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSettings } from "@/lib/settings";

export type ShortcutScope = "global" | "watch" | "player";

export interface Shortcut {
  keys: string[]; // primary combo, e.g. ["Shift", "S"]
  altKeys?: string[]; // alternative combo, shown after "/"
  combo: string; // matcher, e.g. "shift+s"
  scope: ShortcutScope;
  label: string;
  icon?: string; // lucide icon name
}

export const SHORTCUTS: Shortcut[] = [
  // Global / app
  { keys: ["Shift", "?"], combo: "shift+?", scope: "global", label: "Open Shortcuts", icon: "Keyboard" },
  { keys: ["Ctrl", ","], altKeys: ["⌘", ","], combo: "mod+,", scope: "global", label: "Open Settings", icon: "Settings" },
  { keys: ["/"], altKeys: ["Ctrl", "S"], combo: "/", scope: "global", label: "Focus Search", icon: "Search" },
  { keys: ["Shift", "M"], combo: "shift+m", scope: "global", label: "Open Notifications", icon: "Bell" },
  { keys: ["Shift", "T"], altKeys: ["V"], combo: "shift+t", scope: "global", label: "Open Side Menu", icon: "Menu" },
  { keys: ["Shift", "D"], combo: "shift+d", scope: "global", label: "Toggle Theme", icon: "SunMoon" },
  { keys: ["G", "H"], combo: "g h", scope: "global", label: "Go to Home", icon: "Home" },
  { keys: ["G", "A"], combo: "g a", scope: "global", label: "Go to Anime", icon: "Clapperboard" },
  { keys: ["G", "M"], combo: "g m", scope: "global", label: "Go to Movies", icon: "Film" },
  { keys: ["G", "W"], combo: "g w", scope: "global", label: "Go to Wishlist", icon: "Bookmark" },
  { keys: ["G", "Y"], combo: "g y", scope: "global", label: "Go to History", icon: "History" },
  { keys: ["G", "P"], combo: "g p", scope: "global", label: "Go to Profile", icon: "User" },
  { keys: ["Esc"], combo: "escape", scope: "global", label: "Close Modals", icon: "X" },

  // Watching / episodes
  { keys: ["Shift", "P"], altKeys: ["B"], combo: "shift+p", scope: "watch", label: "Previous Episode", icon: "ChevronLeft" },
  { keys: ["Shift", "N"], combo: "shift+n", scope: "watch", label: "Next Episode", icon: "ChevronRight" },

  // Player controls (display-only — most are provider-native)
  { keys: ["K"], altKeys: ["Space"], combo: "k", scope: "player", label: "Play/Pause Toggle", icon: "Play" },
  { keys: ["J"], combo: "j", scope: "player", label: "Seek Backward 10 Seconds", icon: "Rewind" },
  { keys: ["L"], combo: "l", scope: "player", label: "Seek Forward 10 Seconds", icon: "FastForward" },
  { keys: ["F"], combo: "f", scope: "player", label: "Toggle Fullscreen", icon: "Maximize" },
  { keys: ["T"], combo: "t", scope: "player", label: "Toggle Theater Mode", icon: "RectangleHorizontal" },
  { keys: ["M"], combo: "m", scope: "player", label: "Toggle Mute", icon: "VolumeX" },
  { keys: ["Shift", "S"], combo: "shift+s", scope: "player", label: "Screenshot Player", icon: "Camera" },
  { keys: ["Shift", "\\"], combo: "shift+\\", scope: "player", label: "Skip Intro/Outro (otherwise skip 85s)", icon: "SkipForward" },
  { keys: ["↑"], combo: "arrowup", scope: "player", label: "Increase Volume", icon: "Volume2" },
  { keys: ["↓"], combo: "arrowdown", scope: "player", label: "Decrease Volume", icon: "Volume1" },
  { keys: ["→"], combo: "arrowright", scope: "player", label: "Seek Forward 5 Seconds", icon: "ChevronsRight" },
  { keys: ["←"], combo: "arrowleft", scope: "player", label: "Seek Backward 5 Seconds", icon: "ChevronsLeft" },
  { keys: [">"], combo: ">", scope: "player", label: "Increase Playback Speed", icon: "Gauge" },
  { keys: ["<"], combo: "<", scope: "player", label: "Decrease Playback Speed", icon: "Gauge" },
  { keys: ["Hold Space"], altKeys: ["Hold Player"], combo: "hold-space", scope: "player", label: "2× Speed (hold)", icon: "Zap" },
  { keys: ["0-9"], combo: "0-9", scope: "player", label: "Jump to Percentage (0-90%)", icon: "SlidersHorizontal" },
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
    const focusSearch = () => {
      const input = document.querySelector<HTMLInputElement>('input[aria-label="Search anime"]');
      if (input) input.focus();
    };

    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }

      const mod = e.ctrlKey || e.metaKey;

      // Open settings — Ctrl/Cmd/Shift + ,
      if (e.key === "," && (mod || e.shiftKey)) {
        e.preventDefault();
        openSettings();
        return;
      }

      // Open shortcuts help — Shift+?
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        openHelp();
        return;
      }

      // Focus search — "/" or Ctrl/Cmd+S
      if (e.key === "/" && !mod && settings.disableBrowserSearchKey) {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        focusSearch();
        return;
      }

      // Open side menu — Shift+T or V
      if ((e.shiftKey && e.key.toLowerCase() === "t") || (!mod && !e.shiftKey && e.key.toLowerCase() === "v")) {
        // Only hijack Shift+T outside /watch (T is player theater key there)
        if (pathname.startsWith("/watch") && e.shiftKey && e.key.toLowerCase() === "t") return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("aniora:menu"));
        return;
      }

      // Toggle theme — Shift+D
      if (e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("aniora:theme"));
        return;
      }

      if (e.key === "Escape") {
        window.dispatchEvent(new CustomEvent("aniora:escape"));
        return;
      }

      // "g" prefix combos
      if (!gPending && e.key.toLowerCase() === "g" && !mod && !e.altKey && !e.shiftKey) {
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

      // Watch-scoped keys
      if (pathname.startsWith("/watch")) {
        const dispatch = (name: string) =>
          window.dispatchEvent(new CustomEvent(`aniora:watch:${name}`));
        const k = e.key.toLowerCase();
        if (e.shiftKey && (k === "p" || k === "b")) { e.preventDefault(); dispatch("prev"); }
        else if (e.shiftKey && k === "n") { e.preventDefault(); dispatch("next"); }
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
