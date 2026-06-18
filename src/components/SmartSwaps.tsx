"use client";

import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useState } from "react";

interface Swap {
  icon: string;
  from: string;
  to: string;
  savingKg: number;
  unit: string;
  prefill: string;
}

const SWAPS: Swap[] = [
  { icon: "🥩", from: "Beef", to: "Lentils", savingKg: 5.0, unit: "per meal", prefill: "chose lentils instead of beef for dinner" },
  { icon: "🚗", from: "Car", to: "Bike", savingKg: 2.0, unit: "per trip", prefill: "cycled to work instead of driving" },
  { icon: "🌀", from: "Tumble Dryer", to: "Air Dry", savingKg: 1.5, unit: "per load", prefill: "air-dried laundry instead of using the tumble dryer" },
  { icon: "🥛", from: "Dairy milk", to: "Oat milk", savingKg: 0.6, unit: "per litre", prefill: "switched to oat milk instead of dairy milk" },
  { icon: "🍔", from: "Burger", to: "Veggie burger", savingKg: 2.5, unit: "per meal", prefill: "chose veggie burger instead of beef burger" },
  { icon: "✈️", from: "Short flight", to: "Train", savingKg: 80.0, unit: "per trip", prefill: "took the train instead of flying" },
];

interface SmartSwapsProps {
  onApplySwap: (prefill: string) => void;
}

export function SmartSwaps({ onApplySwap }: SmartSwapsProps) {
  const [offset, setOffset] = useState(0);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  function prev() {
    setOffset((o) => (o - 1 + SWAPS.length) % SWAPS.length);
  }
  function next() {
    setOffset((o) => (o + 1) % SWAPS.length);
  }

  const visible = [0, 1, 2].map((i) => ({
    swap: SWAPS[(offset + i) % SWAPS.length],
    globalIdx: (offset + i) % SWAPS.length,
  }));

  return (
    <section
      aria-labelledby="swaps-heading"
      className="glass-card rounded-[20px] p-6 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <h2
          id="swaps-heading"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
        >
          <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Smart Swaps
        </h2>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous swaps"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/30 text-stone-600 backdrop-blur-sm transition hover:bg-white/50 hover:text-emerald-700 dark:border-white/15 dark:bg-white/8 dark:text-stone-300 dark:hover:bg-white/15"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next swaps"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/30 text-stone-600 backdrop-blur-sm transition hover:bg-white/50 hover:text-emerald-700 dark:border-white/15 dark:bg-white/8 dark:text-stone-300 dark:hover:bg-white/15"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {visible.map(({ swap, globalIdx }) => {
          const isApplied = applied.has(globalIdx);
          return (
            <div
              key={globalIdx}
              className="flex flex-col items-center gap-3 rounded-[20px] border border-white/40 bg-white/25 p-5 text-center backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:bg-white/40 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <span className="text-3xl" aria-hidden="true">{swap.icon}</span>
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold text-stone-900 dark:text-stone-50">
                  {swap.from} → {swap.to}
                </p>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  −{swap.savingKg} kg CO₂ {swap.unit}
                </p>
              </div>
              <button
                type="button"
                disabled={isApplied}
                onClick={() => {
                  setApplied((s) => new Set(s).add(globalIdx));
                  onApplySwap(swap.prefill);
                }}
                className="mt-auto w-full rounded-full border border-white/60 bg-white/50 px-4 py-2 text-xs font-bold text-emerald-800 backdrop-blur-sm transition hover:bg-white/70 disabled:cursor-default disabled:opacity-60 dark:border-white/20 dark:bg-white/10 dark:text-emerald-300 dark:hover:bg-white/20"
              >
                {isApplied ? "✓ Applied" : "Apply Swap"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
