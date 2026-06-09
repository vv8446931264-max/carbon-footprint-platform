"use client";

import { useId, useState } from "react";
import {
  Car,
  RotateCcw,
  SlidersHorizontal,
  Smartphone,
  TreePine,
} from "lucide-react";
import { carbonEquivalencies } from "@/lib/emissions/equivalencies";
import {
  GLOBAL_AVERAGE_ANNUAL_TONNES,
  PARIS_ALIGNED_ANNUAL_TONNES,
} from "@/lib/emissions/calculate";
import {
  LEVER_CONFIG,
  PRESETS,
  simulate,
  ZERO_LEVERS,
  type AnnualBreakdown,
  type LeverId,
  type Levers,
} from "@/lib/simulator/reductionSimulator";

interface ReductionSimulatorProps {
  breakdown: AnnualBreakdown;
  /** Where the base footprint came from, for honest framing. */
  source: "logged" | "estimate";
}

/**
 * Interactive "what if" planner. Most calculators stop at telling you your
 * number; this lets a person drag levers for realistic lifestyle changes and
 * instantly see their projected annual footprint move toward the 2 t target,
 * with the saving translated into relatable terms. The projection is pure,
 * deterministic maths (see lib/simulator), so the numbers are trustworthy.
 */
export function ReductionSimulator({
  breakdown,
  source,
}: ReductionSimulatorProps) {
  const [levers, setLevers] = useState<Levers>(ZERO_LEVERS);
  const headingId = useId();

  const result = simulate(breakdown, levers);
  const eq = carbonEquivalencies(result.savedAnnualKg);

  const scaleMax = Math.max(6, Math.ceil(result.baseTonnes));
  const pos = (tonnes: number) =>
    Math.min(Math.max(tonnes / scaleMax, 0), 1) * 100;

  function setLever(id: LeverId, value: number) {
    setLevers((current) => ({ ...current, [id]: value }));
  }

  const pctReduction = Math.round(result.pctReduction * 100);

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-sm font-medium text-stone-500 dark:text-stone-400"
        >
          <SlidersHorizontal
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          What-if studio
        </h2>
        <div className="flex items-center gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setLevers(preset.levers)}
              className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 transition hover:border-emerald-300 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setLevers(ZERO_LEVERS)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-stone-500 transition hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-stone-400 dark:hover:text-stone-100"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
        {source === "logged"
          ? "Based on your logged activity. "
          : "Based on your quick estimate. "}
        Drag the sliders to see how everyday changes move your yearly footprint.
      </p>

      <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
        {LEVER_CONFIG.map((config) => (
          <Lever
            key={config.id}
            label={config.label}
            hint={config.hint}
            max={config.max}
            value={levers[config.id]}
            onChange={(value) => setLever(config.id, value)}
          />
        ))}
      </div>

      <div
        className="mt-6 rounded-xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/40"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Projected footprint
            </p>
            <p className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
                {result.newTonnes.toFixed(1)}
              </span>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                t CO₂e / yr
              </span>
            </p>
          </div>
          {result.savedAnnualKg > 0 && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold tabular-nums text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              ▼ {result.savedTonnes.toFixed(1)} t saved ({pctReduction}%)
            </span>
          )}
        </div>

        {/* Now vs projected on a target-aware scale. */}
        <div className="mt-4">
          <div
            className="relative h-3 w-full rounded-full bg-stone-200 dark:bg-stone-800"
            role="img"
            aria-label={`Projected ${result.newTonnes.toFixed(
              1,
            )} tonnes per year, down from ${result.baseTonnes.toFixed(
              1,
            )}. The target is 2 tonnes and the global average is 4.7 tonnes.`}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-stone-300 dark:bg-stone-700"
              style={{ width: `${pos(result.baseTonnes)}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-[width] duration-300"
              style={{ width: `${pos(result.newTonnes)}%` }}
            />
            <div
              className="absolute -inset-y-0.5 w-0.5 rounded bg-emerald-700 dark:bg-emerald-400"
              style={{ left: `${pos(PARIS_ALIGNED_ANNUAL_TONNES)}%` }}
              aria-hidden="true"
            />
            <div
              className="absolute -inset-y-0.5 w-0.5 rounded bg-stone-400 dark:bg-stone-500"
              style={{ left: `${pos(GLOBAL_AVERAGE_ANNUAL_TONNES)}%` }}
              aria-hidden="true"
            />
          </div>
          <div
            className="relative mt-1.5 h-4 text-[10px] text-stone-500 dark:text-stone-400"
            aria-hidden="true"
          >
            <span
              className="absolute -translate-x-1/2 whitespace-nowrap font-medium text-emerald-700 dark:text-emerald-400"
              style={{ left: `${pos(PARIS_ALIGNED_ANNUAL_TONNES)}%` }}
            >
              Target 2t
            </span>
            <span
              className="absolute -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${pos(GLOBAL_AVERAGE_ANNUAL_TONNES)}%` }}
            >
              Avg 4.7t
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm text-stone-700 dark:text-stone-200">
          {result.savedAnnualKg <= 0 ? (
            "Try a slider or a preset above to model your savings."
          ) : result.meetsTarget ? (
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              🎯 This reaches the Paris-aligned 2-tonne target. Saving{" "}
              {Math.round(result.savedAnnualKg).toLocaleString()} kg CO₂e a
              year.
            </span>
          ) : (
            <>
              That cuts{" "}
              <strong>
                {Math.round(result.savedAnnualKg).toLocaleString()} kg CO₂e
              </strong>{" "}
              a year, closing {pctReduction}% of your footprint.
            </>
          )}
        </p>

        {result.savedAnnualKg > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-600 dark:text-stone-300">
            <li className="flex items-center gap-1.5">
              <TreePine
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              Like <strong>{eq.treesForAYear.toLocaleString()}</strong> trees
              absorbing CO₂ for a year
            </li>
            <li className="flex items-center gap-1.5">
              <Car
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <strong>{eq.carKmAvoided.toLocaleString()}</strong> km not driven
            </li>
            <li className="flex items-center gap-1.5">
              <Smartphone
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <strong>{eq.phoneCharges.toLocaleString()}</strong> phone charges
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}

interface LeverProps {
  label: string;
  hint: string;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

function Lever({ label, hint, max, value, onChange }: LeverProps) {
  const id = useId();
  const hintId = useId();
  return (
    <div>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-medium text-stone-800 dark:text-stone-100"
        >
          {label}
        </label>
        <span className="text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-describedby={hintId}
        className="mt-2 w-full accent-emerald-600"
      />
      <p
        id={hintId}
        className="mt-1 text-xs text-stone-500 dark:text-stone-400"
      >
        {hint}
      </p>
    </div>
  );
}
