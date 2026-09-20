import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  fallback: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  loading?: "eager" | "lazy";
}

/**
 * Lightweight image with CSS fade-in, fallback swap, and a "not found" card.
 * Uses plain CSS transitions instead of framer-motion to stay cheap when
 * rendered hundreds of times across grids.
 */
export function SmartImage({
  src,
  fallback,
  alt = "",
  className,
  imgClassName,
  loading = "lazy",
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(src || fallback);
  const [broken, setBroken] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setLoaded(false);
    setBroken(false);
    setCurrent(src || fallback);
  }, [src, fallback]);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [current]);

  if (broken) return <ImageNotFound className={className} label={alt} />;

  return (
    <div className={cn("relative overflow-hidden bg-muted/40", className)}>
      {!loaded && <div className="absolute inset-0 shimmer" />}
      <img
        ref={imgRef}
        src={current}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (current !== fallback && fallback) {
            setLoaded(false);
            setCurrent(fallback);
          } else {
            setBroken(true);
          }
        }}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 250ms ease-out" }}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  );
}


export function ImageNotFound({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden border border-dashed border-border bg-card text-muted-foreground",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:14px_14px]" />
      <ImageOff className="h-6 w-6" strokeWidth={1.5} />
      <div className="mt-2 font-mono text-[0.55rem] uppercase tracking-widest">
        image_not_found
      </div>
      {label && (
        <div className="mt-1 line-clamp-1 max-w-[85%] px-2 text-center text-[0.55rem] text-muted-foreground/70">
          {label}
        </div>
      )}
    </div>
  );
}
