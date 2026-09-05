import { createFileRoute, Link } from "@tanstack/react-router";
import { useAniListViewer, useAniListLogout } from "@/lib/anilist-auth";
import { getAniListAuthUrl } from "@/lib/anilist-config";
import { useWishlist } from "@/lib/wishlist";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { viewer, isLoading, hasToken } = useAniListViewer();
  const logout = useAniListLogout();
  const { items } = useWishlist();
  const authUrl = getAniListAuthUrl();

  if (isLoading && hasToken) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-40 w-full animate-pulse border border-border bg-card" />
      </div>
    );
  }

  if (!viewer) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center font-mono">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          ~$ whoami
        </div>
        <h1 className="mt-3 text-2xl font-medium">not signed in</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          AniList login is optional. Sign in to sync your profile.
          Your local wishlist works without an account ({items.length} saved).
        </p>
        {authUrl ? (
          <a
            href={authUrl}
            className="mt-5 border border-foreground bg-foreground px-4 py-2 text-[0.7rem] uppercase tracking-widest text-background"
          >
            login with anilist
          </a>
        ) : (
          <div className="mt-5 border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
            set <span className="text-foreground">VITE_ANILIST_CLIENT_ID</span> to enable login
          </div>
        )}
      </div>
    );
  }

  const stats = viewer.statistics?.anime;
  const banner = viewer.bannerImage;

  return (
    <div>
      <div className="relative border-b border-border">
        {banner && (
          <div className="absolute inset-0">
            <img src={banner} alt="" className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
        )}
        <div className="relative mx-auto flex max-w-4xl items-center gap-4 px-4 py-8">
          {viewer.avatar?.large && (
            <img
              src={viewer.avatar.large}
              alt={viewer.name}
              className="h-20 w-20 border border-border object-cover sm:h-24 sm:w-24"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              ~$ whoami · anilist
            </div>
            <h1 className="mt-1 text-2xl font-medium sm:text-3xl">{viewer.name}</h1>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 border border-border px-3 py-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" /> logout
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-3 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="anime watched" value={stats?.count ?? 0} />
        <Stat label="episodes" value={stats?.episodesWatched ?? 0} />
        <Stat
          label="hours"
          value={stats ? Math.round(stats.minutesWatched / 60) : 0}
        />
        <Stat
          label="mean score"
          value={stats ? stats.meanScore.toFixed(1) : "—"}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-10">
        <div className="border border-border bg-card p-4">
          <div className="mb-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            ~$ cat local/wishlist.log
          </div>
          <p className="text-sm text-card-foreground">
            {items.length} entries in your local wishlist.
          </p>
          <Link
            to="/wishlist"
            className="mt-3 inline-block border border-border px-3 py-1.5 text-[0.65rem] uppercase tracking-widest hover:bg-accent"
          >
            open wishlist
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-border bg-card px-4 py-3">
      <div className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl text-foreground">{value}</div>
    </div>
  );
}
