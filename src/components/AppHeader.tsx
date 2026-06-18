import { Code2, Leaf, ShieldCheck, Trophy } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface AppHeaderProps {
  achievementsUnlocked: number;
  achievementsTotal: number;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "#main-content", active: true },
  { label: "Activity", href: "#recent-heading", active: false },
  { label: "Coach", href: "#coach-heading", active: false },
  { label: "Profile", href: "#goal-heading", active: false },
];

export function AppHeader({
  achievementsUnlocked,
  achievementsTotal,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/20 bg-white/15 backdrop-blur-xl dark:border-white/8 dark:bg-black/30">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        {/* Brand mark */}
        <div className="flex items-center gap-3">
          <span className="animate-glow-pulse flex h-9 w-9 items-center justify-center rounded-[14px] bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 text-white shadow-md shadow-emerald-500/20">
            <Leaf className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-stone-900 dark:text-emerald-50">
              Carbon Coach
            </p>
            <p className="hidden text-[10px] font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-400 sm:block">
              Track · reduce · thrive
            </p>
          </div>
        </div>

        {/* Nav tabs — hidden on mobile */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                item.active
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-stone-700 hover:bg-white/50 hover:text-stone-900 dark:text-stone-200 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-white/40 bg-white/30 px-2.5 py-1 text-xs font-medium text-stone-800 backdrop-blur-sm dark:border-white/15 dark:bg-white/8 dark:text-emerald-300 sm:inline-flex"
            title="Your data is stored only in this browser."
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Private by design
          </span>

          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/30 px-2.5 py-1 text-xs font-medium text-amber-800 backdrop-blur-sm dark:border-white/15 dark:bg-white/8 dark:text-amber-300"
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-600 transition hover:bg-white/40 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-emerald-400"
            aria-label="View source on GitHub"
          >
            <Code2 className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}
