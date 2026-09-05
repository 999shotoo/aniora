import { Link } from "@tanstack/react-router";
import { Play, Bookmark, BookmarkCheck } from "lucide-react";
import {
  type AniListMedia,
  FALLBACK_BANNER,
  FALLBACK_COVER,
  pickTitle,
} from "@/lib/anilist";
import { useWishlist } from "@/lib/wishlist";

export function Hero({ media }: { media: AniListMedia | null }) {
  const { has, toggle } = useWishlist();

  if (!media) {
    return (
      <div className="mx-auto h-[52vh] max-w-7xl animate-pulse border-b border-border bg-card px-4" />
    );
  }

  const banner =
    media.bannerImage ||
    media.coverImage?.extraLarge ||
    media.coverImage?.large ||
    FALLBACK_BANNER;
  const saved = has(media.id);
  const title = pickTitle(media.title);
  const desc = (media.description || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  return (
    <section className="relative w-full overflow-hidden border-b border-border">
      <div className="absolute inset-0">
        <img
          src={banner}
          alt=""
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_BANNER;
          }}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[62vh] max-w-7xl flex-col gap-6 px-4 py-10 sm:min-h-[68vh] sm:py-16 md:flex-row md:items-end">
        <img
          src={media.coverImage?.large || FALLBACK_COVER}
          alt={title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_COVER;
          }}
          className="hidden aspect-[2/3] w-40 shrink-0 border border-border object-cover shadow-2xl md:block lg:w-48"
        />
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            <span className="border border-border bg-background/50 px-2 py-1 backdrop-blur">
              ~$ ./featured
            </span>
            {media.format && <span>{media.format}</span>}
            {media.seasonYear && <span>· {media.seasonYear}</span>}
            {media.episodes && <span>· {media.episodes} ep</span>}
            {media.averageScore && (
              <span>· {(media.averageScore / 10).toFixed(1)}★</span>
            )}
          </div>
          <h1 className="mb-4 max-w-3xl text-3xl font-medium leading-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {desc && (
            <p className="mb-6 line-clamp-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:line-clamp-4">
              {desc}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              to="/anime/$id"
              params={{ id: String(media.id) }}
              className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-[0.7rem] font-medium uppercase tracking-widest text-background transition-opacity hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              watch now
            </Link>
            <button
              onClick={() => toggle(media)}
              className="inline-flex items-center gap-2 border border-border bg-background/60 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-widest text-foreground backdrop-blur hover:bg-accent"
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
      </div>
    </section>
  );
}
