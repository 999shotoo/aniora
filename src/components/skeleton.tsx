interface SkeletonProps {
  className?: string;
}

/** Base shimmer block. Use with any width/height class. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={"shimmer " + className} />;
}

/** Flat muted block (no shimmer). Use for tiny secondary bars. */
export function Bar({ className = "" }: SkeletonProps) {
  return <div className={"bg-muted " + className} />;
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rise-in">
      <div className="relative aspect-[2/3] w-full border border-border">
        <Skeleton className="absolute inset-0" />
        {/* fake rank chip */}
        <div className="absolute left-1.5 top-1.5 h-4 w-8 bg-background/80" />
        {/* fake score chip */}
        <div className="absolute right-1.5 top-1.5 h-4 w-10 bg-background/80" />
        {/* fake bottom gradient bar */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/70 to-transparent" />
      </div>
      <Bar className="h-3 w-11/12" />
      <Bar className="h-2 w-2/3" />
      <div className="flex gap-1 pt-0.5">
        <Bar className="h-2 w-10" />
        <Bar className="h-2 w-8" />
        <Bar className="h-2 w-6" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 14 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Horizontal row skeleton — matches AnimeRow layout. */
export function RowSkeleton({ count = 6, label = true }: { count?: number; label?: boolean }) {
  return (
    <section className="space-y-3">
      {label && (
        <div className="flex items-end justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <Bar className="h-2 w-2" />
            <Bar className="h-3 w-40" />
          </div>
          <Bar className="h-2 w-16" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function EpisodeRowSkeleton() {
  return (
    <div className="flex items-stretch gap-3 border border-border bg-card">
      <div className="relative aspect-video w-32 shrink-0 sm:w-40">
        <Skeleton className="absolute inset-0" />
        <div className="absolute left-1.5 top-1.5 h-3 w-6 bg-background/80" />
        <div className="absolute bottom-1.5 right-1.5 h-3 w-10 bg-background/80" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 py-2 pr-3">
        <Bar className="h-3 w-3/4" />
        <Bar className="h-2 w-1/2" />
        <Bar className="h-2 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Bar className="h-2 w-10" />
          <Bar className="h-2 w-14" />
        </div>
      </div>
    </div>
  );
}

export function EpisodeThumbSkeleton() {
  return (
    <div className="flex flex-col gap-2 border border-border bg-card p-2">
      <div className="relative aspect-video w-full">
        <Skeleton className="absolute inset-0" />
        <div className="absolute left-1.5 top-1.5 h-4 w-8 bg-background/80" />
      </div>
      <Bar className="h-3 w-3/4" />
      <Bar className="h-2 w-1/2" />
    </div>
  );
}

export function EpisodeNumSkeleton() {
  return <Skeleton className="aspect-square w-full border border-border" />;
}

/** Skeleton for the whole episodes panel: toolbar + list. */
export function EpisodesPanelSkeleton({
  view = "thumbnail",
  count = 8,
}: {
  view?: "thumbnail" | "row" | "grid";
  count?: number;
}) {
  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border border-border bg-card p-2">
        <Bar className="h-8 w-32" />
        <Bar className="h-8 flex-1 min-w-[8rem]" />
        <div className="flex gap-1">
          <Bar className="h-8 w-8" />
          <Bar className="h-8 w-8" />
          <Bar className="h-8 w-8" />
        </div>
      </div>
      {/* list */}
      {view === "thumbnail" && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <EpisodeThumbSkeleton key={i} />
          ))}
        </div>
      )}
      {view === "row" && (
        <div className="space-y-2">
          {Array.from({ length: count }).map((_, i) => (
            <EpisodeRowSkeleton key={i} />
          ))}
        </div>
      )}
      {view === "grid" && (
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
          {Array.from({ length: count * 2 }).map((_, i) => (
            <EpisodeNumSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full border border-border">
        <Skeleton className="absolute inset-0" />
        {/* fake play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 border border-border bg-background/40" />
        </div>
        {/* fake scrubber */}
        <div className="absolute inset-x-3 bottom-3 h-1 bg-background/50" />
      </div>
      <div className="flex flex-wrap items-center gap-3 border border-border bg-card px-3 py-2">
        <Bar className="h-3 w-24" />
        <Bar className="h-3 flex-1 min-w-[4rem]" />
        <div className="flex gap-1">
          <Bar className="h-7 w-16" />
          <Bar className="h-7 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Full info header skeleton — matches anime.$id.tsx hero. */
export function InfoHeaderSkeleton() {
  return (
    <div className="relative border-b border-border">
      {/* fake banner */}
      <div className="absolute inset-0">
        <Skeleton className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>
      <div className="relative mx-auto flex max-w-none flex-col gap-6 px-6 lg:px-10 py-10 md:flex-row">
        {/* cover */}
        <div className="shrink-0">
          <Skeleton className="aspect-[2/3] w-32 border border-border sm:w-40 md:w-48" />
        </div>
        {/* meta column */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Bar className="h-2 w-2" />
            <Bar className="h-2 w-24" />
            <Bar className="h-2 w-12" />
          </div>
          <Bar className="h-8 w-3/4 max-w-2xl" />
          <Bar className="h-3 w-1/2 max-w-md" />

          {/* stat chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Bar key={i} className="h-6 w-20 border border-border" />
            ))}
          </div>

          {/* synopsis lines */}
          <div className="space-y-2 pt-3">
            <Bar className="h-2 w-full max-w-3xl" />
            <Bar className="h-2 w-11/12 max-w-3xl" />
            <Bar className="h-2 w-10/12 max-w-3xl" />
            <Bar className="h-2 w-9/12 max-w-3xl" />
          </div>

          {/* CTAs */}
          <div className="flex gap-2 pt-3">
            <Bar className="h-9 w-32 border border-border" />
            <Bar className="h-9 w-28 border border-border" />
            <Bar className="h-9 w-9 border border-border" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full detail-page body skeleton (tags, studios, related). */
export function InfoBodySkeleton() {
  return (
    <div className="mx-auto grid max-w-none gap-6 px-6 lg:px-10 py-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* section: details */}
        <section className="space-y-3">
          <Bar className="h-3 w-24" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1 border border-border bg-card p-3">
                <Bar className="h-2 w-16" />
                <Bar className="h-3 w-24" />
              </div>
            ))}
          </div>
        </section>
        {/* section: tags */}
        <section className="space-y-3">
          <Bar className="h-3 w-16" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <Bar
                key={i}
                className="h-6 border border-border"
                {...{ style: { width: `${50 + ((i * 17) % 60)}px` } }}
              />
            ))}
          </div>
        </section>
      </div>
      {/* aside */}
      <aside className="space-y-3">
        <Bar className="h-3 w-20" />
        <div className="aspect-video w-full">
          <Skeleton className="h-full w-full border border-border" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 border border-border bg-card p-2">
              <Skeleton className="h-12 w-8 border border-border" />
              <div className="flex-1 space-y-1">
                <Bar className="h-2 w-3/4" />
                <Bar className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

/** Search-page toolbar skeleton. */
export function SearchToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-6 lg:px-10 py-3">
      <Bar className="h-9 flex-1 min-w-[12rem]" />
      <Bar className="h-9 w-28" />
      <Bar className="h-9 w-28" />
      <Bar className="h-9 w-20" />
    </div>
  );
}
