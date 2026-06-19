"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sprout,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryTotal } from "@/lib/emissions/aggregate";
import type { CoachReport } from "@/types/ai";

const SWAPS = [
  { icon: "🥘", from: "Mutton curry", to: "Paneer curry", savingKg: 4.0, unit: "per meal", prefill: "chose paneer curry instead of mutton for dinner" },
  { icon: "🚗", from: "Car", to: "Auto/Bus", savingKg: 2.5, unit: "per trip", prefill: "took public transport instead of driving" },
  { icon: "🌀", from: "Tumble dryer", to: "Line dry", savingKg: 1.5, unit: "per load", prefill: "air-dried clothes instead of using tumble dryer" },
  { icon: "🥛", from: "Buffalo milk", to: "Plant milk", savingKg: 0.8, unit: "per litre", prefill: "switched to plant-based milk instead of dairy" },
  { icon: "🍛", from: "Chicken biryani", to: "Veg biryani", savingKg: 3.0, unit: "per meal", prefill: "chose vegetable biryani instead of chicken" },
  { icon: "✈️", from: "Flight", to: "Train", savingKg: 80.0, unit: "per trip", prefill: "took the train instead of flying" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SWAP_REDUCTION = 0.40;

interface CoachHubProps {
  totalKgCo2e: number;
  periodDays: number;
  topCategories: CategoryTotal[];
  hasEntries: boolean;
  dailyBudgetKg?: number;
  onApplySwap: (prefill: string) => void;
}

export function CoachHub({
  totalKgCo2e,
  periodDays,
  dailyBudgetKg,
  topCategories,
  hasEntries,
  onApplySwap,
}: CoachHubProps) {
  const [report, setReport] = useState<CoachReport | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [swapOffset, setSwapOffset] = useState(0);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  const currentMonthIdx = new Date().getMonth();
  const dailyKg = totalKgCo2e / Math.max(periodDays, 1);
  const annualTonnes = (dailyKg * 365) / 1000;
  const swapAnnualTonnes = annualTonnes * (1 - SWAP_REDUCTION);
  const goalExceedPct =
    swapAnnualTonnes > 0 && swapAnnualTonnes < 2
      ? Math.round(((2 - swapAnnualTonnes) / 2) * 100)
      : 0;

  const chartData = MONTHS.map((month, i) => {
    const frac = (i + 1) / 12;
    return {
      month,
      current: hasEntries ? +(annualTonnes * frac).toFixed(2) : null,
      projected:
        hasEntries && i >= Math.max(0, currentMonthIdx - 1)
          ? +(swapAnnualTonnes * frac).toFixed(2)
          : null,
    };
  });

  const yMax = hasEntries
    ? Math.max(2.5, Math.ceil(annualTonnes * 1.25 * 4) / 4)
    : 2.5;

  async function handleGenerate() {
    if (status === "loading") return;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalKgCo2e,
          periodDays,
          topCategories: topCategories.map(({ category, kgCo2e }) => ({
            category,
            kgCo2e,
          })),
          dailyBudgetKg,
          previousSummary: report?.summary ?? null,
        }),
      });
      const data = (await res.json()) as CoachReport | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Could not generate a report.");
      }
      setReport(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const visibleSwaps = [0, 1, 2].map((i) => ({
    swap: SWAPS[(swapOffset + i) % SWAPS.length],
    globalIdx: (swapOffset + i) % SWAPS.length,
  }));

  return (
    <section aria-labelledby="coach-heading" className="glass-card rounded-[24px] p-6 sm:p-8">
      {/* ── Header ── */}
      <div className="mb-6 space-y-4">
        {/* Progress bar */}
        <div className="flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200/40 shadow-inner dark:bg-stone-800/40">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-700 ${
                status === "loading" ? "animate-ai-progress" : "w-[85%]"
              }`}
            />
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-stone-500 dark:text-stone-400">
            {status === "loading" ? "Analysing..." : "85%"}
          </span>
        </div>

        {/* Title + button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="coach-heading"
              className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-emerald-50 sm:text-3xl"
            >
              Interactive AI Coach Hub
            </h2>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
              Powered by Vertex AI
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={status === "loading" || !hasEntries}
            className="inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-emerald-500 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-600/35 hover:brightness-110 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {status === "loading" ? "Thinking..." : report ? "Regenerate" : "Get report"}
          </button>
        </div>
      </div>

      {/* ── Body: 5-column grid ── */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* ── Left (3/5): AI Analysis card + Smart Swaps ── */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Vertex AI Analysis card */}
          <div className="relative flex-1 overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-800 via-emerald-800 to-emerald-900 p-5 shadow-lg shadow-emerald-900/30 dark:from-emerald-950/90 dark:to-emerald-950/70">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-600/10 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl" />
            <div className="relative mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/40 shadow-sm shadow-emerald-500/20">
                <Sprout className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Vertex AI Analysis
              </span>
            </div>

            {status === "loading" && (
              <>
                <h3 className="mb-4 text-base font-bold text-white">
                  Vertex AI Analysis: Weekly Report
                </h3>
                <div className="flex flex-col gap-2.5">
                  {[100, 83, 91, 67].map((w) => (
                    <div
                      key={w}
                      style={{ width: `${w}%` }}
                      className="h-3 animate-pulse rounded-full bg-emerald-700/60"
                    />
                  ))}
                </div>
              </>
            )}

            {status === "error" && (
              <p className="text-sm text-red-300">{errorMessage}</p>
            )}

            {status !== "loading" && !report && status !== "error" && (
              <>
                <h3 className="mb-2 text-base font-bold text-white">
                  {!hasEntries
                    ? "Start tracking to unlock"
                    : "Vertex AI Analysis: Weekly Report"}
                </h3>
                <p className="text-sm leading-relaxed text-emerald-100/80">
                  {!hasEntries
                    ? "🌱 Log a few activities to unlock your personalised carbon coaching report."
                    : "✨ Your activity data is ready. Click 'Get report' for a short, encouraging analysis with personalised tips."}
                </p>
              </>
            )}

            {status === "idle" && report && (
              <>
                <h3 className="mb-3 text-base font-bold text-white">
                  Vertex AI Analysis: Weekly Report
                </h3>
                <p className="mb-2 text-sm leading-relaxed text-emerald-100">
                  {report.summary}
                </p>
                <p className="mb-3 text-sm font-semibold text-emerald-300">
                  {report.encouragement}
                </p>
                <ul className="flex flex-col gap-2">
                  {report.tips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg bg-white/10 px-3 py-2 text-sm text-emerald-100"
                    >
                      <Sprout
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                        aria-hidden="true"
                      />
                      {tip}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Smart Swaps carousel */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Smart Swaps
              </h3>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSwapOffset((o) => (o - 1 + SWAPS.length) % SWAPS.length)}
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
                    <span className="relative text-3xl transition-transform duration-300 group-hover/card:scale-110" aria-hidden="true">{swap.icon}</span>
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
        </div>

        {/* ── Right (2/5): Projected Impact chart ── */}
        <div className="flex flex-col rounded-[20px] border border-white/20 bg-gradient-to-br from-white/35 to-white/15 p-5 shadow-lg shadow-stone-900/5 backdrop-blur-md transition-shadow duration-300 hover:shadow-xl hover:shadow-stone-900/8 dark:border-white/10 dark:from-white/8 dark:to-white/3 dark:shadow-black/10 lg:col-span-2">
          <h3 className="text-base font-bold text-stone-900 dark:text-emerald-50">
            Projected Impact
          </h3>
          <p className="mb-4 text-xs font-medium text-stone-500 dark:text-stone-400">
            Yearly Goal: 2-Tonne Target
          </p>

          {!hasEntries ? (
            <div className="flex flex-1 items-center justify-center rounded-xl bg-stone-50/60 p-8 text-center dark:bg-stone-800/30">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                📈 Log activities to see your projected annual impact
              </p>
            </div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="hubCurFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="hubProjFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#94a3b8"
                      strokeOpacity={0.2}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      unit="t"
                      width={32}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, yMax]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => [
                        `${Number(value).toFixed(2)}t CO₂e`,
                        name === "current" ? "Current trajectory" : "With adopted swaps",
                      ] as [string, string]}
                    />
                    <ReferenceLine
                      y={2}
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      label={{
                        value: "Yearly Goal: 2-Tonne Target",
                        position: "insideTopRight",
                        fontSize: 9,
                        fill: "#ef4444",
                        fontWeight: 600,
                        offset: -4,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="current"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fill="url(#hubCurFill)"
                      dot={{ r: 3, fill: "#047857", stroke: "#fff", strokeWidth: 1.5 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="projected"
                      stroke="#6ee7b7"
                      strokeDasharray="6 3"
                      strokeWidth={2}
                      fill="url(#hubProjFill)"
                      dot={{ r: 2.5, fill: "#6ee7b7", stroke: "#fff", strokeWidth: 1.5 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-stone-500 dark:text-stone-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-5 rounded-full bg-emerald-600" />
                  Current trajectory
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0 w-5 border-t-2 border-dashed border-emerald-400" />
                  Projected with adopted swaps
                </span>
              </div>

              {/* Impact summary */}
              {swapAnnualTonnes > 0 && (
                <p className="mt-4 rounded-xl bg-emerald-50/60 px-4 py-3 text-sm leading-relaxed text-stone-700 dark:bg-emerald-950/30 dark:text-stone-300">
                  Adopting suggested swaps could reduce your yearly emissions to{" "}
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    {swapAnnualTonnes.toFixed(1)} tonne
                  </strong>
                  {goalExceedPct > 0 && (
                    <>
                      , surpassing your goal by{" "}
                      <strong className="text-emerald-700 dark:text-emerald-400">
                        {goalExceedPct}%
                      </strong>
                    </>
                  )}
                  .
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
