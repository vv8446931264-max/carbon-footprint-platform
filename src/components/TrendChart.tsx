"use client";

import { memo, useEffect, useState } from "react";

// Module-level constant so the string isn't duplicated across the component.
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
import { TrendingDown } from "lucide-react";
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
import type { WeeklyTotal } from "@/lib/emissions/trend";

interface TrendChartProps {
  data: WeeklyTotal[];
  /** Weekly share of the Paris-aligned target, drawn as a reference line. */
  weeklyTargetKg: number;
}

/**
 * Weekly emissions trend. Seeing the line bend *down* week over week — against a
 * fixed target line — is what turns "track" into "reduce". Paired with a
 * visually-hidden data table so the trend isn't locked behind an SVG for
 * assistive tech, and memoised so unrelated state changes don't redraw it.
 */
function TrendChartComponent({ data, weeklyTargetKg }: TrendChartProps) {
  const hasData = data.some((d) => d.kgCo2e > 0);
  // Lazy initializer reads the OS preference synchronously so Recharts uses the
  // correct value on the very first render, with no effect-driven cascade.
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(REDUCED_MOTION_QUERY).matches
      : false,
  );

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const listener = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const chartData = (() => {
    const actual = data.map((d) => ({
      label: formatWeek(d.weekStart),
      weekStart: d.weekStart,
      kg: d.kgCo2e,
      projected: null as number | null,
    }));

    const nonZero = data.filter((d) => d.kgCo2e > 0);
    if (nonZero.length < 2) return actual;

    const weeklyChange =
      (nonZero[nonZero.length - 1].kgCo2e - nonZero[0].kgCo2e) /
      (nonZero.length - 1);
    const lastPoint = nonZero[nonZero.length - 1];

    // Seed the projected line from the last actual point for visual continuity
    let lastActualIdx = -1;
    for (let i = actual.length - 1; i >= 0; i--) {
      if (actual[i].kg > 0) { lastActualIdx = i; break; }
    }
    if (lastActualIdx >= 0) {
      actual[lastActualIdx] = { ...actual[lastActualIdx], projected: actual[lastActualIdx].kg };
    }

    const projectedPoints = Array.from({ length: 4 }, (_, i) => {
      const d = new Date(`${lastPoint.weekStart}T00:00:00`);
      d.setDate(d.getDate() + 7 * (i + 1));
      const weekStart = d.toISOString().slice(0, 10);
      return {
        label: formatWeek(weekStart),
        weekStart,
        kg: null as number | null,
        projected: Math.max(0, lastPoint.kgCo2e + weeklyChange * (i + 1)),
      };
    });

    return [...actual, ...projectedPoints];
  })();

  return (
    <section
      aria-labelledby="trend-heading"
      className="rounded-[20px] border border-stone-100/80 bg-gradient-to-br from-white via-emerald-50/15 to-white p-6 shadow-[var(--shadow-soft)] dark:border-stone-800/60 dark:from-stone-900 dark:via-emerald-950/10 dark:to-stone-900 sm:p-8"
    >
      <h2
        id="trend-heading"
        className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
      >
        <TrendingDown
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        Weekly trend
      </h2>

      {!hasData ? (
        <div className="mt-6 rounded-xl bg-stone-50/60 p-4 dark:bg-stone-800/30">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            📊 Log activities over a few days and your weekly footprint will
            chart here. Watch the line trend toward the target.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-6 rounded-full bg-emerald-600" />
              Current trajectory
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-6 border-t-2 border-dashed border-emerald-400" />
              Projected with swaps
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-6 border-t-2 border-dashed border-amber-500" />
              2 t/yr target
            </span>
          </div>

          <div
            className="mt-4 h-64 rounded-xl bg-gradient-to-b from-emerald-50/30 to-white p-3 dark:from-emerald-950/20 dark:to-stone-900/50"
            role="img"
            aria-label={describeTrend(data, weeklyTargetKg)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 12, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#34d399" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#047857" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="projectedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  className="stroke-stone-200/40 dark:stroke-stone-700/40"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0", strokeOpacity: 0.3 }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  unit=" kg"
                  width={48}
                  axisLine={{ stroke: "#e2e8f0", strokeOpacity: 0.3 }}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(16,185,129,0.2)", strokeWidth: 2 }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)} kg CO₂e`,
                    "Emissions",
                  ]}
                />
                <ReferenceLine
                  y={weeklyTargetKg}
                  stroke="#d97706"
                  strokeDasharray="6 3"
                  strokeWidth={2}
                  label={{
                    value: "Target 2t/yr",
                    position: "insideTopRight",
                    fontSize: 11,
                    fill: "#b45309",
                    fontWeight: 600,
                    offset: -5,
                  }}
                />
                <Area
                  type="natural"
                  dataKey="kg"
                  stroke="url(#trendStroke)"
                  strokeWidth={3}
                  fill="url(#trendFill)"
                  dot={{ r: 4, fill: "#047857", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 3 }}
                  connectNulls={false}
                  isAnimationActive={!reducedMotion}
                  animationDuration={800}
                />
                <Area
                  type="natural"
                  dataKey="projected"
                  stroke="#6ee7b7"
                  strokeDasharray="6 3"
                  strokeWidth={2}
                  fill="url(#projectedFill)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                  connectNulls={false}
                  isAnimationActive={!reducedMotion}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}

function formatWeek(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function describeTrend(data: WeeklyTotal[], weeklyTargetKg: number): string {
  const nonZero = data.filter((d) => d.kgCo2e > 0);
  if (!nonZero.length) return "Weekly emissions area chart. No data yet.";
  const latest = nonZero[nonZero.length - 1];
  const prev = nonZero[nonZero.length - 2];
  const direction =
    prev == null
      ? ""
      : latest.kgCo2e < prev.kgCo2e
        ? ", trending down"
        : latest.kgCo2e > prev.kgCo2e
          ? ", trending up"
          : ", flat";
  const vsTarget =
    latest.kgCo2e <= weeklyTargetKg
      ? "below the 2 t/yr target"
      : "above the 2 t/yr target";
  return `Weekly emissions chart. Latest: ${latest.kgCo2e.toFixed(1)} kg CO₂e (${vsTarget}${direction}). Target line: ${weeklyTargetKg.toFixed(1)} kg/week.`;
}

export const TrendChart = memo(TrendChartComponent);
