import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Trash2 } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { FALLBACK_COVER } from "@/lib/anilist";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
  head: () => ({
    meta: [
      { title: "Wishlist — Zen Stream" },
      { name: "description", content: "Your saved anime, stored locally in your browser." },
    ],
  }),
});

function WishlistPage() {
  const { items, remove } = useWishlist();

  return (
    <div className="mx-auto max-w-none px-6 lg:px-10 py-6">
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
        <h1 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          ~$ cat wishlist.log
        </h1>
        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/70">
          {items.length} entries · local
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-border px-6 lg:px-10 py-16 text-center">
          <Bookmark className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            no entries yet
          </p>
          <Link
            to="/search"
            className="mt-2 inline-flex items-center border border-foreground bg-foreground px-6 lg:px-10 py-2 text-[0.7rem] uppercase tracking-widest text-background"
          >
            find something
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
          {items.map((item) => (
            <div key={item.id} className="group relative flex flex-col">
              <Link
                to="/anime/$id"
                params={{ id: String(item.id) }}
                className="relative aspect-[2/3] overflow-hidden border border-border bg-card"
              >
                <img
                  src={item.cover || FALLBACK_COVER}
                  alt={item.title}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_COVER;
                  }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
              <button
                onClick={() => remove(item.id)}
                aria-label="Remove"
                className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center border border-border bg-background/85 text-muted-foreground backdrop-blur hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <Link
                to="/anime/$id"
                params={{ id: String(item.id) }}
                className="mt-2 line-clamp-2 text-xs font-medium text-foreground hover:underline"
              >
                {item.title}
              </Link>
              <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                {item.format && <span>{item.format}</span>}
                {item.year && <span>· {item.year}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
