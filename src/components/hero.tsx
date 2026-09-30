import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Bookmark, BookmarkCheck } from "lucide-react";
import {
  type AniListMedia,
  FALLBACK_BANNER,
  FALLBACK_COVER,
  pickTitle,
} from "@/lib/anilist";
import { useWishlist } from "@/lib/wishlist";
import { SmartImage } from "./smart-image";

interface Props {
  items: AniListMedia[];
  intervalMs?: number;
}

export function Hero({ items, intervalMs = 6500 }: Props) {
  const { has, toggle } = useWishlist();
  const [index, setIndex] = useState(0);
  const valid = items.filter(Boolean);

  useEffect(() => {
    if (valid.length < 2) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % valid.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [valid.length, intervalMs]);

  if (valid.length === 0) {
    return (
      <div className="h-[60vh] min-h-[420px] w-full animate-pulse border-b border-border bg-card sm:h-[56vh] md:h-[60vh]" />
    );
  }

  const media = valid[index % valid.length];
  const banner =
    media.bannerImage ||
    media.coverImage?.extraLarge ||
    media.coverImage?.large ||
    FALLBACK_BANNER;
  const cover = media.coverImage?.large || FALLBACK_COVER;
  const saved = has(media.id);
  const title = pickTitle(media.title);
  const desc = (media.description || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  return (
    <section className="relative w-full overflow-hidden border-b border-border">
      {/* Crossfading banner layer */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.img
            key={banner}
            src={banner}
            alt={`${title} banner`}
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_BANNER;
            }}
            initial={{ opacity: index === 0 ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
          />
        </AnimatePresence>
        {/* Mobile: darker bottom fade, lighter top so image is visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10 md:via-background/80 md:to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent md:from-background/95 md:via-background/60" />
      </div>

      <div className="relative mx-auto flex min-h-[520px] w-full max-w-none flex-col justify-end gap-4 px-4 pb-10 pt-24 sm:min-h-[560px] sm:gap-6 sm:px-6 sm:pb-12 sm:pt-28 md:min-h-[62vh] md:flex-row md:items-end md:px-10 md:pb-16 md:pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={media.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex w-full flex-col gap-6 md:flex-row md:items-end"
          >
            <SmartImage
              src={cover}
              fallback={FALLBACK_COVER}
              alt={title}
              className="hidden aspect-[2/3] w-40 shrink-0 border border-border shadow-2xl md:block lg:w-48"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[0.6rem] uppercase tracking-widest text-muted-foreground sm:gap-2">
                <span className="border border-border bg-background/50 px-2 py-1">
                  ~$ ./featured
                </span>
                {media.format && <span>{media.format}</span>}
                {media.seasonYear && <span>· {media.seasonYear}</span>}
                {media.episodes && <span>· {media.episodes} ep</span>}
                {media.averageScore && (
                  <span>· {(media.averageScore / 10).toFixed(1)}★</span>
                )}
              </div>
              <h2 className="mb-3 max-w-3xl text-2xl font-medium leading-tight sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
                {title}
              </h2>
              {desc && (
                <p className="mb-5 line-clamp-3 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:mb-6 sm:text-sm sm:line-clamp-4">
                  {desc}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/watch/$id"
                  params={{ id: String(media.id) }}
                  className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-[0.7rem] font-medium uppercase tracking-widest text-background transition-opacity hover:opacity-90 sm:px-6"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  watch now
                </Link>
                <button
                  onClick={() => toggle(media)}
                  className="inline-flex items-center gap-2 border border-border bg-background/60 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-widest text-foreground hover:bg-accent sm:px-6"
                >
                  {saved ? (
                    <>
                      <BookmarkCheck className="h-3.5 w-3.5" /> saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-3.5 w-3.5" /> wishlist
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      {valid.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {valid.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === index % valid.length
                  ? "w-6 bg-foreground"
                  : "w-1.5 bg-foreground/30")
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
