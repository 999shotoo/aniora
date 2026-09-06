interface SkeletonProps {
  className?: string;
}

/** Base shimmer block. Use with any width/height class. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={
        "shimmer border border-border " + className
      }
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-[2/3] w-full" />
      <Skeleton className="h-3 w-3/4 border-0 bg-muted" />
      <Skeleton className="h-2 w-1/2 border-0 bg-muted" />
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EpisodeRowSkeleton() {
  return (
    <div className="flex items-stretch gap-3 border border-border bg-card">
      <Skeleton className="aspect-video w-32 shrink-0 border-0 sm:w-40" />
      <div className="flex flex-1 flex-col justify-center gap-2 py-2 pr-3">
        <Skeleton className="h-3 w-3/4 border-0 bg-muted" />
        <Skeleton className="h-2 w-1/2 border-0 bg-muted" />
        <Skeleton className="h-2 w-2/3 border-0 bg-muted" />
      </div>
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-video w-full" />
      <div className="flex items-center gap-3 border border-border bg-card px-3 py-2">
        <Skeleton className="h-3 w-24 border-0 bg-muted" />
        <Skeleton className="h-3 flex-1 border-0 bg-muted" />
        <Skeleton className="h-6 w-24 border-0 bg-muted" />
      </div>
    </div>
  );
}

export function InfoHeaderSkeleton() {
  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-none flex-col gap-6 px-6 lg:px-10 py-10 md:flex-row">
        <Skeleton className="aspect-[2/3] w-32 shrink-0 sm:w-40 md:w-48" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-32 border-0 bg-muted" />
          <Skeleton className="h-8 w-2/3 border-0 bg-muted" />
          <Skeleton className="h-3 w-1/3 border-0 bg-muted" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-28 border-0 bg-muted" />
            <Skeleton className="h-8 w-24 border-0 bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
