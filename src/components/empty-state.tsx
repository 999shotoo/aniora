import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface Props {
  icon?: ReactNode;
  title: string;
  message?: string;
  hint?: string;
  actions?: ReactNode;
  variant?: "default" | "large";
}

/**
 * Terminal-styled empty state card. Use `variant="large"` for full-page /
 * player-slot fallbacks; default sits inside lists and sidebars.
 */
export function EmptyState({
  icon,
  title,
  message,
  hint,
  actions,
  variant = "default",
}: Props) {
  const large = variant === "large";
  return (
    <div
      className={
        "rise-in relative flex flex-col items-center justify-center gap-4 border border-dashed border-border bg-card text-center " +
        (large ? "min-h-[420px] px-6 py-16" : "px-6 py-10")
      }
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background:repeating-linear-gradient(45deg,transparent_0_10px,var(--color-foreground)_10px_11px)]" />
      {icon && (
        <div
          className={
            "relative grid place-items-center border border-border bg-background text-muted-foreground " +
            (large ? "h-16 w-16" : "h-12 w-12")
          }
        >
          {icon}
        </div>
      )}
      <div className="relative space-y-1">
        {hint && (
          <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            {hint}
          </div>
        )}
        <h3
          className={
            "font-medium text-foreground " + (large ? "text-xl sm:text-2xl" : "text-base")
          }
        >
          {title}
        </h3>
        {message && (
          <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {message}
          </p>
        )}
      </div>
      {actions && (
        <div className="relative mt-2 flex flex-wrap justify-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/** Convenience: default "back home" action for empty pages. */
export function BackHomeAction() {
  return (
    <Link
      to="/"
      className="border border-border bg-background px-4 py-2 text-[0.65rem] uppercase tracking-widest text-foreground hover:bg-accent"
    >
      ← back home
    </Link>
  );
}
