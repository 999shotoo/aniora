import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
 * Image with a shimmer placeholder that fades in when loaded, cross-fades to
 * a fallback on error, and finally renders a terminal-styled "image not found"
 * card if both the source and the fallback fail.
 *
 * Handles the cached-image case where the browser resolves the request
 * synchronously — before React attaches the onLoad handler — by checking
 * `img.complete && naturalWidth > 0` on every src change.
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

  // Detect images already resolved from cache before onLoad wires up.
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [current]);

  if (broken) {
    return <ImageNotFound className={className} label={alt} />;
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted/40", className)}>
      <AnimatePresence>
        {!loaded && (
          <motion.div
            key="shimmer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 shimmer"
          />
        )}
      </AnimatePresence>
      <motion.img
        ref={imgRef}
        key={current}
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
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 1.02 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
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
