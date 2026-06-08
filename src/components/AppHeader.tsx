import { Code2, Leaf, ShieldCheck, Trophy } from "lucide-react";

interface AppHeaderProps {
  achievementsUnlocked: number;
  achievementsTotal: number;
}

/**
 * Sticky, translucent top bar with the product's brand mark. A consistent
 * header (logo + name + trust signal) is one of the clearest signals of an
 * intentionally-designed product versus a thrown-together page.
 */
export function AppHeader({
  achievementsUnlocked,
  achievementsTotal,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-200/70 bg-[var(--background)]/80 backdrop-blur-md dark:border-stone-800/70">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              Carbon Coach
            </p>
            <p className="hidden text-[11px] text-stone-500 dark:text-stone-400 sm:block">
              Understand · track · reduce
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 sm:inline-flex"
            title="Your data is stored only in this browser — nothing is sent to a server except the text/image you choose to analyse."
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Private by design
          </span>

          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
            title="Achievements unlocked"
          >
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">
              {achievementsUnlocked}/{achievementsTotal}
            </span>
            <span className="sr-only">achievements unlocked</span>
          </span>

          <a
            href="https://github.com/vv8446931264-max/carbon-footprint-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="View source on GitHub"
          >
            <Code2 className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}
