import { useEffect, useRef, useState } from "react";
import { Maximize2, RefreshCcw } from "lucide-react";
import type { MappingEpisode } from "@/lib/mappings";
import { useSettings } from "@/lib/settings";

interface Props {
  malId: number | null;
  episode: number;
  onEpisodeChange?: (ep: number) => void;
  ep?: MappingEpisode;
  fallbackTitle?: string;
  onSlowLoad?: () => void;
  reloadKey?: number;
}

const FALLBACK_EP_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>
      <rect width='640' height='360' fill='#0c0c0c'/>
      <text x='50%' y='50%' fill='#333' font-family='monospace' font-size='16' text-anchor='middle'>NO PREVIEW</text>
    </svg>`,
  );

export function Player({ malId, episode, ep, fallbackTitle, onSlowLoad, reloadKey = 0 }: Props) {
  const { settings, update } = useSettings();
  const mode = settings.defaultLanguage;
  const setMode = (m: "sub" | "dub") => update("defaultLanguage", m);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [nonce, setNonce] = useState(0); // forces internal iframe remount
  const onSlowLoadRef = useRef(onSlowLoad);
  const wrapRef = useRef<HTMLDivElement>(null);
  const autoRetriedRef = useRef(false);

  useEffect(() => {
    onSlowLoadRef.current = onSlowLoad;
  }, [onSlowLoad]);

  const enterFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  // React to shortcut events.
  useEffect(() => {
    const onToggle = () => setMode(mode === "sub" ? "dub" : "sub");
    const onFs = () => enterFs();
    window.addEventListener("aniora:watch:toggle-lang", onToggle);
    window.addEventListener("aniora:watch:fullscreen", onFs);
    return () => {
      window.removeEventListener("aniora:watch:toggle-lang", onToggle);
      window.removeEventListener("aniora:watch:fullscreen", onFs);
    };
  }, []);

  const validEp = Number.isFinite(episode) && episode > 0;
  const autoParam = settings.autoPlay ? "?autoplay=1" : "";
  const src = malId && validEp && ep
    ? `https://megaplay.buzz/stream/mal/${malId}/${episode}/${mode}${autoParam}`
    : "";
  const title = ep?.title?.en || ep?.nameTvdb || fallbackTitle || `Episode ${episode}`;

  // Mount + auto-retry lifecycle. If iframe hasn't fired onLoad within 4s,
  // silently remount once. If still not loaded by 8s, surface the warning.
  // Once loaded, both timers are inert — no reloads during playback.
  useEffect(() => {
    setReadySrc(null);
    setLoaded(false);
    autoRetriedRef.current = false;
    if (!src) return;

    const mountTimer = window.setTimeout(() => setReadySrc(src), 80);
    const retryTimer = window.setTimeout(() => {
      if (loadedRef.current) return;
      if (autoRetriedRef.current) return;
      autoRetriedRef.current = true;
      setNonce((n) => n + 1);
    }, 4200);
    const slowTimer = window.setTimeout(() => {
      if (loadedRef.current) return;
      onSlowLoadRef.current?.();
    }, 8000);

    return () => {
      window.clearTimeout(mountTimer);
      window.clearTimeout(retryTimer);
      window.clearTimeout(slowTimer);
    };
  }, [src, reloadKey]);

  const manualReload = () => {
    setLoaded(false);
    setNonce((n) => n + 1);
  };

  if (!malId || !validEp || !ep) {
    return (
      <div className="flex aspect-video w-full items-center justify-center border border-border bg-card text-xs uppercase tracking-widest text-muted-foreground">
        {!malId
          ? "stream unavailable · no mal id"
          : "waiting for episode mapping"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={wrapRef} className="relative aspect-video w-full overflow-hidden border border-border bg-black">
        {(!readySrc || !loaded) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card text-center">
            <div className="h-10 w-10 border border-border shimmer" />
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              loading stream source
            </div>
          </div>
        )}
        {readySrc && (
          <iframe
            key={`${readySrc}-${reloadKey}-${nonce}`}
            src={readySrc}
            title={`Ep ${episode} — ${mode}`}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            scrolling="no"
            frameBorder={0}
            onLoad={() => setLoaded(true)}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border border-border bg-card px-3 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            episode {String(episode).padStart(2, "0")}
          </span>
        </div>
        <span className="line-clamp-1 flex-1 text-xs text-card-foreground">
          {title}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={manualReload}
            title="Reload stream (R)"
            aria-label="Reload stream"
            className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1 text-[0.6rem] uppercase tracking-widest text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <RefreshCcw className="h-3 w-3" />
            reload
          </button>
          <button
            onClick={enterFs}
            title="Fullscreen (F)"
            aria-label="Fullscreen"
            className="inline-flex h-[26px] w-[26px] items-center justify-center border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          <div className="flex border border-border">
            {(["sub", "dub"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  "px-3 py-1 text-[0.6rem] uppercase tracking-widest transition-colors " +
                  (mode === m
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {ep?.overview && (
        <p className="border border-dashed border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {ep.overview}
        </p>
      )}
    </div>
  );
}

export function PlayerPlaceholder({ message = "select an episode to start watching" }: { message?: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center border border-border bg-card text-xs uppercase tracking-widest text-muted-foreground">
      {message}
    </div>
  );
}

export { FALLBACK_EP_IMAGE };

