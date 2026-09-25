import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Types & defaults                                                          */
/* -------------------------------------------------------------------------- */

export interface AnioraSettings {
  // App behavior
  autoSyncAniList: boolean;
  syncThreshold: number; // percentage
  hideSpoilers: boolean;
  defaultAnimePage: "info" | "watch";

  // Appearance
  glassNav: boolean;
  smoothScroll: boolean;
  showWatchHistoryHome: boolean;

  // Media
  defaultLanguage: "sub" | "dub";
  autoPlay: boolean;
  autoNextEpisode: boolean;
  episodesView: "thumb" | "row" | "grid";

  // Behavior
  disableContextMenu: boolean;
  disableTextSelection: boolean;
  disableBrowserSearchKey: boolean; // catch "/" to focus in-app search

  // Monetization
  enableSponsor: boolean; // opt-in popunder script (off by default; can crash Brave)
}

export const DEFAULT_SETTINGS: AnioraSettings = {
  autoSyncAniList: true,
  syncThreshold: 80,
  hideSpoilers: false,
  defaultAnimePage: "info",

  glassNav: true,
  smoothScroll: false,
  showWatchHistoryHome: true,

  defaultLanguage: "sub",
  autoPlay: false,
  autoNextEpisode: false,
  episodesView: "thumb",

  disableContextMenu: false,
  disableTextSelection: false,
  disableBrowserSearchKey: true,

  enableSponsor: false,
};

const STORAGE_KEY = "aniora-settings-v1";

/* -------------------------------------------------------------------------- */
/*  Context                                                                   */
/* -------------------------------------------------------------------------- */

interface Ctx {
  settings: AnioraSettings;
  update: <K extends keyof AnioraSettings>(key: K, value: AnioraSettings[K]) => void;
  reset: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  isOpen: boolean;
  section: string;
  setSection: (s: string) => void;
}

const SettingsCtx = createContext<Ctx | null>(null);

function loadInitial(): AnioraSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AnioraSettings>(loadInitial);
  const [isOpen, setOpen] = useState(false);
  const [section, setSection] = useState<string>("behavior");

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);


  // Apply body-level side effects.
  useEffect(() => {
    const body = document.body;
    if (settings.disableTextSelection) {
      body.classList.add("no-select");
    } else {
      body.classList.remove("no-select");
    }
    const onCtx = (e: MouseEvent) => {
      if (settings.disableContextMenu) e.preventDefault();
    };
    document.addEventListener("contextmenu", onCtx);
    return () => document.removeEventListener("contextmenu", onCtx);
  }, [settings.disableContextMenu, settings.disableTextSelection]);

  const update: Ctx["update"] = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);
  const openSettings = useCallback(() => setOpen(true), []);
  const closeSettings = useCallback(() => setOpen(false), []);

  const value = useMemo<Ctx>(
    () => ({ settings, update, reset, openSettings, closeSettings, isOpen, section, setSection }),
    [settings, update, reset, openSettings, closeSettings, isOpen, section],
  );

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export function useSetting<K extends keyof AnioraSettings>(key: K): AnioraSettings[K] {
  return useSettings().settings[key];
}
