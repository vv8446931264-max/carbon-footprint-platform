"use client";

import { Car, Leaf, UtensilsCrossed, Zap, ShoppingBag } from "lucide-react";

interface EmptyStateProps {
  onSelectExample: (text: string) => void;
}

const QUICK_ACTIONS = [
  {
    Icon: Car,
    text: "drove 15 km to office",
    color: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  },
  {
    Icon: UtensilsCrossed,
    text: "had chicken biryani for lunch",
    color: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
  {
    Icon: Zap,
    text: "used 10 kWh of electricity",
    color: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  {
    Icon: ShoppingBag,
    text: "bought groceries for $30",
    color: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  },
];

export function EmptyState({ onSelectExample }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-stone-300 bg-gradient-to-br from-white to-emerald-50/30 px-6 py-12 text-center dark:border-stone-700 dark:from-stone-900 dark:to-emerald-950/10">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
        <Leaf className="h-7 w-7 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
          Log your first activity 🌱
        </h3>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Start with something simple — your commute, a meal, or last
          night&apos;s AC. You&apos;ll see your impact in seconds.
        </p>
      </div>

      <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
        {QUICK_ACTIONS.map(({ Icon, text, color }) => (
          <button
            key={text}
            type="button"
            onClick={() => onSelectExample(text)}
            className={`flex items-center gap-3 rounded-xl border border-transparent p-3 text-left transition hover:border-stone-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:border-stone-700 ${color}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
