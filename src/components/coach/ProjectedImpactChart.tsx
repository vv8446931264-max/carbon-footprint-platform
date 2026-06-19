"use client";

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
import { buildProjection } from "./projection";

interface ProjectedImpactChartProps {
  /** Whether any activities have been logged (gates the chart vs. an empty state). */
  hasEntries: boolean;
  totalKgCo2e: number;
  periodDays: number;
}

/**
 * Right-hand panel of the coach hub: an area chart projecting annual emissions
 * at the current pace vs. the post-swap trajectory, against the 2-tonne target.
 */
export function ProjectedImpactChart({
  hasEntries,
  totalKgCo2e,
  periodDays,
}: ProjectedImpactChartProps) {
  const { chartData, yMax, swapAnnualTonnes, goalExceedPct } = buildProjection(
    totalKgCo2e,
    periodDays,
    hasEntries,
  );

  return (
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
                  formatter={(value, name) =>
                    [
                      `${Number(value).toFixed(2)}t CO₂e`,
                      name === "current"
                        ? "Current trajectory"
                        : "With adopted swaps",
                    ] as [string, string]
                  }
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
  );
}
