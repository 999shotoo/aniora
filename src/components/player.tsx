import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, RefreshCcw, Server } from "lucide-react";
import type { MappingEpisode } from "@/lib/mappings";
import { useSettings } from "@/lib/settings";
import { useServers, withAutoplay, type StreamServer } from "@/lib/servers";

interface Props {
  anilistId: number | null;
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

function pickDefault(list: StreamServer[], preferred?: string): StreamServer | null {
  if (!list.length) return null;
  if (preferred) {
    const match = list.find((s) => s.server === preferred);
    if (match) return match;
  }
  return list.find((s) => s.default) ?? list[0];
}

export function Player({ anilistId, episode, ep, fallbackTitle, onSlowLoad, reloadKey = 0 }: Props) {
  const { settings, update } = useSettings();
  const mode = settings.defaultLanguage;
  const setMode = (m: "sub" | "dub") => update("defaultLanguage", m);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [nonce, setNonce] = useState(0);
  const onSlowLoadRef = useRef(onSlowLoad);
  const wrapRef = useRef<HTMLDivElement>(null);
  const autoRetriedRef = useRef(false);
  const loadedRef = useRef(false);

  const validEp = Number.isFinite(episode) && episode > 0;
  const serversQuery = useServers(anilistId, episode);
  const modeList = serversQuery.data?.[mode] ?? [];

  const selected = useMemo(
    () => pickDefault(modeList, settings.defaultServer),
    [modeList, settings.defaultServer],
  );

  useEffect(() => {
    onSlowLoadRef.current = onSlowLoad;
  }, [onSlowLoad]);

  const enterFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  useEffect(() => {
    const onToggle = () => setMode(mode === "sub" ? "dub" : "sub");
    const onFs = () => enterFs();
    window.addEventListener("aniora:watch:toggle-lang", onToggle);
    window.addEventListener("aniora:watch:fullscreen", onFs);
    return () => {
      window.removeEventListener("aniora:watch:toggle-lang", onToggle);
      window.removeEventListener("aniora:watch:fullscreen", onFs);
    };
  }, [mode]);

  const src = selected ? withAutoplay(selected.url, settings.autoPlay) : "";
  const title = ep?.title?.en || ep?.nameTvdb || fallbackTitle || `Episode ${episode}`;

  useEffect(() => {
    setReadySrc(null);
    setLoaded(false);
    loadedRef.current = false;
    autoRetriedRef.current = false;
    if (!src) return;

    const mountTimer = window.setTimeout(() => setReadySrc(src), 80);
    const retryTimer = window.setTimeout(() => {
      if (loadedRef.current || autoRetriedRef.current) return;
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
    loadedRef.current = false;
    autoRetriedRef.current = false;
    setNonce((n) => n + 1);
  };

  if (!anilistId || !validEp || !ep) {
    return (
      <div className="flex aspect-video w-full items-center justify-center border border-border bg-card text-xs uppercase tracking-widest text-muted-foreground">
        {!anilistId ? "stream unavailable · no id" : "waiting for episode mapping"}
      </div>
    );
  }

  const noServers = serversQuery.isSuccess && modeList.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div ref={wrapRef} className="relative aspect-video w-full overflow-hidden border border-border bg-black">
        {(!readySrc || !loaded) && !noServers && (
          <div className="absolute inset-0 z-10 bg-card shimmer" />
        )}
        {noServers && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-xs uppercase tracking-widest text-muted-foreground">
            no {mode} servers available
          </div>
        )}
        {readySrc && (
          <iframe
            key={`${readySrc}-${reloadKey}-${nonce}`}
            src={readySrc}
            title={`Ep ${episode} — ${mode}`}
            className="h-full w-full"
            style={{ visibility: loaded ? "visible" : "hidden" }}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            scrolling="no"
            frameBorder={0}
            onLoad={() => {
              loadedRef.current = true;
              setLoaded(true);
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border border-border bg-card px-3 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            episode {String(episode).padStart(2, "0")}
          </span>
        </div>
        <span className="line-clamp-1 flex-1 text-xs text-card-foreground">{title}</span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Server dropdown */}
          <label className="inline-flex items-center gap-1.5 border border-border bg-background px-2 py-1 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            <Server className="h-3 w-3" />
            <select
              value={selected?.server ?? ""}
              onChange={(e) => update("defaultServer", e.target.value)}
              disabled={modeList.length === 0}
              className="bg-transparent text-[0.65rem] uppercase tracking-widest text-foreground focus:outline-none disabled:opacity-40"
            >
              {modeList.length === 0 && <option value="">—</option>}
              {modeList.map((s) => (
                <option key={s.server} value={s.server} className="bg-background text-foreground">
                  {s.server}
                  {s.default ? " ★" : ""}
                </option>
              ))}
            </select>
          </label>

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
