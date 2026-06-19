"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { SWAPS } from "./swapData";

/** Number of swap cards visible at once in the carousel. */
const VISIBLE = 3;

interface SmartSwapCarouselProps {
  /** Prefill the activity logger with the chosen swap's text. */
  onApplySwap: (prefill: string) => void;
}

/**
 * Carousel of "Smart Swap" suggestions. Cycles through {@link SWAPS} and tracks
 * which have been applied so their buttons disable after use.
 */
export function SmartSwapCarousel({ onApplySwap }: SmartSwapCarouselProps) {
  const [swapOffset, setSwapOffset] = useState(0);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  const visibleSwaps = Array.from({ length: VISIBLE }, (_, i) => ({
    swap: SWAPS[(swapOffset + i) % SWAPS.length],
    globalIdx: (swapOffset + i) % SWAPS.length,
  }));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
          <Zap
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          Smart Swaps
        </h3>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() =>
              setSwapOffset((o) => (o - 1 + SWAPS.length) % SWAPS.length)
            }
            aria-label="Previous swaps"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/30 text-stone-600 backdrop-blur-sm transition hover:bg-white/50 hover:text-emerald-700 dark:border-white/15 dark:bg-white/8 dark:text-stone-300 dark:hover:bg-white/15"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setSwapOffset((o) => (o + 1) % SWAPS.length)}
            aria-label="Next swaps"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/30 text-stone-600 backdrop-blur-sm transition hover:bg-white/50 hover:text-emerald-700 dark:border-white/15 dark:bg-white/8 dark:text-stone-300 dark:hover:bg-white/15"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {visibleSwaps.map(({ swap, globalIdx }) => {
          const isApplied = applied.has(globalIdx);
          return (
            <div
              key={globalIdx}
              className="group/card relative flex flex-col items-center gap-3 rounded-[16px] border border-white/30 bg-gradient-to-b from-white/35 to-white/15 p-5 text-center backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-emerald-300/50 hover:shadow-xl hover:shadow-emerald-500/15 dark:border-white/10 dark:from-white/8 dark:to-white/3 dark:hover:border-emerald-500/30 dark:hover:shadow-emerald-500/10"
            >
              <div className="absolute inset-0 rounded-[16px] bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 transition-all duration-300 group-hover/card:from-emerald-500/5 group-hover/card:to-emerald-500/0" />
              <span
                className="relative text-3xl transition-transform duration-300 group-hover/card:scale-110"
                aria-hidden="true"
              >
                {swap.icon}
              </span>
              <div className="relative">
                <p className="text-sm font-bold text-stone-900 dark:text-stone-50">
                  {swap.from} → {swap.to}
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  -{swap.savingKg} kg CO₂ {swap.unit}
                </p>
              </div>
              <button
                type="button"
                disabled={isApplied}
                onClick={() => {
                  setApplied((s) => new Set(s).add(globalIdx));
                  onApplySwap(swap.prefill);
                }}
                className="relative mt-auto w-full rounded-full border border-emerald-200/60 bg-gradient-to-b from-white/70 to-white/40 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-emerald-300 hover:from-white/90 hover:to-white/60 hover:shadow-md active:scale-[0.97] disabled:cursor-default disabled:opacity-60 dark:border-emerald-700/30 dark:from-white/12 dark:to-white/5 dark:text-emerald-300 dark:hover:border-emerald-600/50 dark:hover:from-white/18 dark:hover:to-white/8"
              >
                {isApplied ? "✓ Applied" : "Apply Swap"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
