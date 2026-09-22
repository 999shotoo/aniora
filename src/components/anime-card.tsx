import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Star } from "lucide-react";
import { type AniListMedia, FALLBACK_COVER, pickTitle } from "@/lib/anilist";
import { useWishlist } from "@/lib/wishlist";
import { useSetting } from "@/lib/settings";
import { SmartImage } from "./smart-image";

export function AnimeCard({ media }: { media: AniListMedia }) {
  const { has, toggle } = useWishlist();
  const dest = useSetting("defaultAnimePage");
  const saved = has(media.id);
  const cover =
    media.coverImage?.large ||
    media.coverImage?.extraLarge ||
    media.coverImage?.medium ||
    FALLBACK_COVER;
  const linkProps =
    dest === "watch"
      ? ({ to: "/watch/$id", params: { id: String(media.id) } } as const)
      : ({ to: "/anime/$id", params: { id: String(media.id) } } as const);

  return (
    <div className="group relative flex flex-col">
      <Link
        {...linkProps}
        className="relative block aspect-[2/3] w-full overflow-hidden border border-border bg-card"
      >
        <SmartImage
          src={cover}
          fallback={FALLBACK_COVER}
          alt={pickTitle(media.title)}
          className="h-full w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-white/80">
            {media.format && <span>{media.format}</span>}
            {media.episodes && <span>· {media.episodes} ep</span>}
            {media.averageScore && (
              <span className="ml-auto flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                {(media.averageScore / 10).toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="absolute right-1 top-1 flex items-center gap-1">
          {media.format && (
            <span className="border border-border bg-background/80 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-widest text-muted-foreground">
              {media.format}
            </span>
          )}
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          toggle(media);
        }}
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center border border-border bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
      >
        {saved ? (
          <BookmarkCheck className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <Bookmark className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="mt-2 flex flex-col gap-0.5">
        <Link
          {...linkProps}
          className="line-clamp-2 text-xs font-medium text-foreground hover:underline"
          title={pickTitle(media.title)}
        >
          {pickTitle(media.title)}
        </Link>
        <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          {media.seasonYear && <span>{media.seasonYear}</span>}
          {media.averageScore && (
            <span className="ml-auto">{(media.averageScore / 10).toFixed(1)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
