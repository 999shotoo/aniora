import { useEffect, useState } from "react";
import { Cog, Palette, PlayCircle, Keyboard, Wrench, X, RotateCcw } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSettings, DEFAULT_SETTINGS, type AnioraSettings } from "@/lib/settings";
import { SHORTCUTS } from "@/lib/shortcuts";
import * as LucideIcons from "lucide-react";

/* -------------------------------------------------------------------------- */

type SectionId = "behavior" | "appearance" | "media" | "shortcuts" | "other";

const SECTIONS: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "behavior", label: "App Behavior", icon: Cog },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "media", label: "Media Settings", icon: PlayCircle },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
  { id: "other", label: "Other Settings", icon: Wrench },
];

/* -------------------------------------------------------------------------- */

export function SettingsModal() {
  const { settings, update, reset, isOpen, closeSettings, openSettings, section, setSection } = useSettings();
  const [query, setQuery] = useState("");

  // Listen for external "show shortcuts" event.
  useEffect(() => {
    const openShortcuts = () => {
      setSection("shortcuts");
      openSettings();
    };
    window.addEventListener("aniora:shortcuts", openShortcuts);
    return () => window.removeEventListener("aniora:shortcuts", openShortcuts);
  }, [setSection, openSettings]);

  const active =
    (SECTIONS.find((s) => s.id === section)?.id as SectionId) ?? "behavior";

  // Search matches section labels AND known setting/shortcut labels — pressing
  // Enter jumps to the first matching section.
  const SEARCH_INDEX: { section: SectionId; label: string }[] = [
    ...SECTIONS.map((s) => ({ section: s.id, label: s.label })),
    { section: "behavior", label: "Auto sync AniList" },
    { section: "behavior", label: "Sync threshold" },
    { section: "behavior", label: "Hide spoilers" },
    { section: "behavior", label: "Anime card destination" },
    { section: "appearance", label: "Glass navigation bar" },
    { section: "appearance", label: "Smooth scroll" },
    { section: "appearance", label: "Watch history on home" },
    { section: "media", label: "Default language sub dub" },
    { section: "media", label: "Auto play" },
    { section: "media", label: "Auto next episode" },
    { section: "media", label: "Episodes view mode grid list thumb" },
    { section: "shortcuts", label: "Keyboard shortcuts hotkeys" },
    { section: "other", label: "Disable right click" },
    { section: "other", label: "Disable text selection" },
    { section: "other", label: "Enable sponsor popunder ads" },
    { section: "other", label: "Clear watch history" },
    { section: "other", label: "Restore default settings" },
  ];
  const q = query.trim().toLowerCase();
  const matches = q
    ? SEARCH_INDEX.filter((s) => s.label.toLowerCase().includes(q))
    : [];
  const matchedSectionIds = new Set(matches.map((m) => m.section));
  const filtered = q
    ? SECTIONS.filter((s) => matchedSectionIds.has(s.id))
    : SECTIONS;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(v) => (v ? null : closeSettings())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex h-[85vh] w-[95vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-border bg-background shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
              Settings
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">
                {SECTIONS.find((s) => s.id === active)?.label}
              </span>
            </Dialog.Title>
            <Dialog.Close
              className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[220px_1fr]">
            {/* Sidebar */}
            <aside className="hidden border-r border-border bg-card/40 md:flex md:flex-col">
              <div className="p-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filtered[0]) {
                      setSection(filtered[0].id);
                    }
                  }}
                  placeholder="Search settings…"
                  className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                />
              </div>
              <nav className="flex-1 overflow-y-auto px-2 pb-3">
                {filtered.map((s) => {
                  const Icon = s.icon;
                  const on = s.id === active;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSection(s.id)}
                      className={
                        "flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left text-xs font-medium uppercase tracking-widest transition-colors " +
                        (on
                          ? "border-primary bg-accent/40 text-foreground"
                          : "border-transparent text-muted-foreground hover:bg-accent/20 hover:text-foreground")
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {s.label}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Mobile section switcher */}
            <div className="flex overflow-x-auto border-b border-border md:hidden">
              {SECTIONS.map((s) => {
                const on = s.id === active;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={
                      "shrink-0 border-b-2 px-3 py-2 text-[0.6rem] uppercase tracking-widest " +
                      (on ? "border-primary text-foreground" : "border-transparent text-muted-foreground")
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="min-w-0 overflow-y-auto p-5">
              {active === "behavior" && <BehaviorSection settings={settings} update={update} />}
              {active === "appearance" && <AppearanceSection settings={settings} update={update} />}
              {active === "media" && <MediaSection settings={settings} update={update} />}
              {active === "shortcuts" && <ShortcutsSection />}
              {active === "other" && <OtherSection reset={reset} />}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reusable rows                                                             */
/* -------------------------------------------------------------------------- */

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 border-b border-border/60 py-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 pr-4">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {description && (
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={
        "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors " +
        (checked
          ? "border-primary bg-primary"
          : "border-border bg-muted/60")
      }
    >
      <span
        className={
          "inline-block h-4 w-4 transform rounded-full shadow-md ring-1 ring-black/20 transition-transform " +
          (checked ? "translate-x-[1.4rem] bg-white" : "translate-x-1 bg-white/90")
        }
      />
    </button>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex border border-border">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={
            "px-3 py-1.5 text-[0.65rem] uppercase tracking-widest transition-colors " +
            (value === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sections                                                                  */
/* -------------------------------------------------------------------------- */

type UpdaterProps = {
  settings: AnioraSettings;
  update: <K extends keyof AnioraSettings>(key: K, value: AnioraSettings[K]) => void;
};

function BehaviorSection({ settings, update }: UpdaterProps) {
  return (
    <div className="divide-y divide-border/60">
      <Row
        title="Auto sync with AniList"
        description="Automatically push watched episodes to your AniList list when the entry is set to Watching."
      >
        <Toggle
          checked={settings.autoSyncAniList}
          onChange={(v) => update("autoSyncAniList", v)}
        />
      </Row>
      <Row
        title="Sync threshold"
        description="Minimum episode progress percentage before we push to AniList."
      >
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={settings.syncThreshold}
            onChange={(e) => update("syncThreshold", Number(e.target.value))}
            className="w-40 accent-primary"
          />
          <span className="w-10 text-right font-mono text-xs text-foreground">
            {settings.syncThreshold}%
          </span>
        </div>
      </Row>
      <Row
        title="Hide spoilers"
        description="Blur episode thumbnails and hide episode descriptions to prevent spoilers."
      >
        <Toggle checked={settings.hideSpoilers} onChange={(v) => update("hideSpoilers", v)} />
      </Row>
      <Row
        title="Anime card destination"
        description="Where clicking an anime card takes you: full info page, or straight to watch."
      >
        <Segmented
          value={settings.defaultAnimePage}
          onChange={(v) => update("defaultAnimePage", v)}
          options={[
            { value: "info", label: "Info" },
            { value: "watch", label: "Watch" },
          ]}
        />
      </Row>
    </div>
  );
}

function AppearanceSection({ settings, update }: UpdaterProps) {
  return (
    <div className="divide-y divide-border/60">
      <Row
        title="Glass navigation bar"
        description="Blurred, translucent header. Disable on low-end devices for better performance."
      >
        <Toggle checked={settings.glassNav} onChange={(v) => update("glassNav", v)} />
      </Row>
      <Row
        title="Smooth scroll"
        description="Enable Lenis smooth scrolling site-wide. Off by default — can feel laggy on low-end devices."
      >
        <Toggle checked={settings.smoothScroll} onChange={(v) => update("smoothScroll", v)} />
      </Row>
      <Row
        title="Show watch history on home"
        description="Toggle the continue-watching row on the homepage."
      >
        <Toggle
          checked={settings.showWatchHistoryHome}
          onChange={(v) => update("showWatchHistoryHome", v)}
        />
      </Row>
    </div>
  );
}

function MediaSection({ settings, update }: UpdaterProps) {
  return (
    <div className="divide-y divide-border/60">
      <Row
        title="Default language"
        description="Preferred audio for the video player. You can switch on the fly."
      >
        <Segmented
          value={settings.defaultLanguage}
          onChange={(v) => update("defaultLanguage", v)}
          options={[
            { value: "sub", label: "Subtitles" },
            { value: "dub", label: "Dubbing" },
          ]}
        />
      </Row>
      <Row
        title="Auto play"
        description="Attempt to autoplay episodes when the player mounts."
      >
        <Toggle checked={settings.autoPlay} onChange={(v) => update("autoPlay", v)} />
      </Row>
      <Row
        title="Auto next episode"
        description="Advance to the next episode automatically. Requires the provider to signal completion."
      >
        <Toggle
          checked={settings.autoNextEpisode}
          onChange={(v) => update("autoNextEpisode", v)}
        />
      </Row>
      <Row
        title="Episodes view mode"
        description="Default layout for the episodes list. Changes here save automatically when you cycle from the panel."
      >
        <Segmented
          value={settings.episodesView}
          onChange={(v) => update("episodesView", v)}
          options={[
            { value: "thumb", label: "Thumb" },
            { value: "row", label: "Row" },
            { value: "grid", label: "Grid" },
          ]}
        />
      </Row>
    </div>
  );
}

function ShortcutsSection() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Keyboard shortcuts. Press <Kbd>Shift</Kbd> + <Kbd>?</Kbd> anywhere to open this panel.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {SHORTCUTS.map((s) => {
          const IconComp = s.icon
            ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[s.icon]
            : null;
          return (
            <div
              key={s.combo}
              className="flex items-center justify-between gap-3 border border-border bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                {IconComp ? <IconComp className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
                <span className="truncate text-xs text-foreground">{s.label}</span>
                {s.scope !== "global" && (
                  <span className="ml-1 border border-border px-1 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                    {s.scope}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {s.keys.map((k, i) => (
                  <Kbd key={i}>{k}</Kbd>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OtherSection({ reset }: { reset: () => void }) {
  return (
    <div className="divide-y divide-border/60">
      <Row title="Disable right-click menu" description="Prevent the native context menu across the app.">
        <ToggleFromSettings k="disableContextMenu" />
      </Row>
      <Row title="Disable text selection" description="Prevent text selection to reduce accidental highlights.">
        <ToggleFromSettings k="disableTextSelection" />
      </Row>
      <Row
        title="Capture browser search shortcut"
        description="Redirect the / key to Aniora's search bar instead of the browser's quick-find."
      >
        <ToggleFromSettings k="disableBrowserSearchKey" />
      </Row>
      <Row title="Clear watch history" description="Remove all watching entries locally. Does not affect AniList.">
        <button
          onClick={() => {
            try {
              localStorage.removeItem("aniora-watched");
              window.location.reload();
            } catch {}
          }}
          className="border border-destructive/60 bg-destructive/10 px-4 py-2 text-[0.65rem] uppercase tracking-widest text-destructive hover:bg-destructive/20"
        >
          Clear
        </button>
      </Row>
      <Row title="Restore default settings" description="Reset every setting to its default value.">
        <button
          onClick={reset}
          className="flex items-center gap-2 border border-border bg-background px-4 py-2 text-[0.65rem] uppercase tracking-widest text-foreground hover:bg-accent"
        >
          <RotateCcw className="h-3 w-3" /> Restore
        </button>
      </Row>
    </div>
  );
}

function ToggleFromSettings({ k }: { k: keyof AnioraSettings }) {
  const { settings, update } = useSettings();
  const v = settings[k];
  if (typeof v !== "boolean") return null;
  return <Toggle checked={v} onChange={(nv) => update(k, nv as AnioraSettings[typeof k])} />;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-[1.5rem] items-center justify-center border border-border bg-card px-1.5 py-0.5 font-mono text-[0.6rem] font-medium uppercase text-foreground shadow-[0_1px_0_0_var(--border)]">
      {children}
    </span>
  );
}

/* Ensure defaults constant is used (prevents dead-code strip complaints). */
void DEFAULT_SETTINGS;
