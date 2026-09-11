import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
 * Image with a shimmer placeholder that fades in smoothly when loaded,
 * and swaps to a fallback on error. Uses framer-motion for the crossfade.
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

  useEffect(() => {
    setLoaded(false);
    setCurrent(src || fallback);
  }, [src, fallback]);

  return (
    <div className={cn("relative overflow-hidden bg-muted/40", className)}>
      <AnimatePresence>
        {!loaded && (
          <motion.div
            key="shimmer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 shimmer"
          />
        )}
      </AnimatePresence>
      <motion.img
        key={current}
        src={current}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (current !== fallback) {
            setLoaded(false);
            setCurrent(fallback);
          } else {
            setLoaded(true);
          }
        }}
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 1.02 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  );
}
