import { Code2, Leaf, ShieldCheck, Trophy } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface AppHeaderProps {
  achievementsUnlocked: number;
  achievementsTotal: number;
}

export function AppHeader({
  achievementsUnlocked,
  achievementsTotal,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-emerald-100/60 bg-[var(--background)]/85 backdrop-blur-lg dark:border-emerald-900/30">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        {/* Brand mark */}
        <div className="flex items-center gap-3">
          <span className="animate-glow-pulse flex h-9 w-9 items-center justify-center rounded-[14px] bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 text-white shadow-md shadow-emerald-500/20">
            <Leaf className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-stone-900 dark:text-emerald-50">
              Carbon Coach
            </p>
            <p className="hidden text-[10px] font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400 sm:block">
              Track · reduce · thrive
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/50 dark:text-emerald-300 sm:inline-flex"
            title="Your data is stored only in this browser."
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Private by design
          </span>

          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50/80 px-2.5 py-1 text-xs font-medium text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300"
            title="Achievements unlocked"
          >
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">
              {achievementsUnlocked}/{achievementsTotal}
            </span>
            <span className="sr-only">achievements unlocked</span>
          </span>

          <ThemeToggle />

          <a
            href="https://github.com/vv8446931264-max/carbon-footprint-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-stone-500 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400"
            aria-label="View source on GitHub"
          >
            <Code2 className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}
