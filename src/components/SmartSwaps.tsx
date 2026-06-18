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
      className="rounded-[20px] border border-stone-100/80 bg-gradient-to-br from-white via-emerald-50/15 to-white p-6 shadow-[var(--shadow-soft)] dark:border-stone-800/60 dark:from-stone-900 dark:via-emerald-950/10 dark:to-stone-900 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <h2
          id="swaps-heading"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
        >
          <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Smart Swaps
        </h2>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous swaps"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200/80 bg-white/80 text-stone-500 transition hover:border-emerald-300 hover:text-emerald-600 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-400 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next swaps"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200/80 bg-white/80 text-stone-500 transition hover:border-emerald-300 hover:text-emerald-600 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-400 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
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
              className="flex flex-col gap-3 rounded-[16px] border border-stone-100/60 bg-white/70 p-4 backdrop-blur-sm transition hover:border-emerald-200/60 hover:shadow-sm dark:border-stone-800/40 dark:bg-stone-900/60"
            >
              <span className="text-2xl" aria-hidden="true">{swap.icon}</span>
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
                className="mt-auto rounded-[10px] border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 hover:shadow-sm disabled:cursor-default disabled:opacity-60 dark:border-emerald-800/40 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
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
