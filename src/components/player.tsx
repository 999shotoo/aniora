import { useEffect, useState } from "react";
import type { MappingEpisode } from "@/lib/mappings";

interface Props {
  malId: number | null;
  episode: number;
  onEpisodeChange?: (ep: number) => void;
  ep?: MappingEpisode;
  fallbackTitle?: string;
}

const FALLBACK_EP_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>
      <rect width='640' height='360' fill='#0c0c0c'/>
      <text x='50%' y='50%' fill='#333' font-family='monospace' font-size='16' text-anchor='middle'>NO PREVIEW</text>
    </svg>`,
  );

export function Player({ malId, episode, ep, fallbackTitle }: Props) {
  const [mode, setMode] = useState<"sub" | "dub">("sub");
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);

  const validEp = Number.isFinite(episode) && episode > 0;
  if (!malId || !validEp || !ep) {
    return (
      <div className="flex aspect-video w-full items-center justify-center border border-border bg-card text-xs uppercase tracking-widest text-muted-foreground">
        {!malId
          ? "stream unavailable · no mal id"
          : "waiting for episode mapping"}
      </div>
    );
  }

  const src = `https://megaplay.buzz/stream/mal/${malId}/${episode}/${mode}`;
  const title = ep?.title?.en || ep?.nameTvdb || fallbackTitle || `Episode ${episode}`;

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 6000);
    return () => window.clearTimeout(timer);
  }, [src]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden border border-border bg-black">
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card text-center">
            <div className="h-10 w-10 border border-border shimmer" />
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              loading stream source
            </div>
          </div>
        )}
        {loaded && slow && (
          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 border border-border bg-background/90 px-3 py-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground backdrop-blur">
            If the player stays black, this stream host returned no playable video for this episode.
          </div>
        )}
        <iframe
          key={`${malId}-${episode}-${mode}`}
          src={src}
          title={`Ep ${episode} — ${mode}`}
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          scrolling="no"
          frameBorder={0}
          onLoad={() => setLoaded(true)}
        />
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
        <div className="ml-auto flex border border-border">
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
