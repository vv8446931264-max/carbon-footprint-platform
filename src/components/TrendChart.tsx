"use client";

import { memo } from "react";
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

  const chartData = data.map((d) => ({
    label: formatWeek(d.weekStart),
    weekStart: d.weekStart,
    kg: d.kgCo2e,
  }));

  return (
    <section
      aria-labelledby="trend-heading"
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <h2
        id="trend-heading"
        className="flex items-center gap-2 text-sm font-medium text-stone-500 dark:text-stone-400"
      >
        <TrendingDown
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        Weekly trend
      </h2>

      {!hasData ? (
        <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
          Log activities over a few days and your weekly footprint will chart
          here. Watch the line trend toward the target.
        </p>
      ) : (
        <>
          <div
            className="mt-4 h-56"
            role="img"
            aria-label={describeTrend(data, weeklyTargetKg)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-stone-200 dark:stroke-stone-800"
                />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" kg" width={48} />
                <Tooltip
                  cursor={{ stroke: "rgba(120,113,108,0.3)" }}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)} kg CO₂e`,
                    "This week",
                  ]}
                />
                <ReferenceLine
                  y={weeklyTargetKg}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  label={{
                    value: "2 t/yr pace",
                    position: "insideTopRight",
                    fontSize: 11,
                    fill: "#d97706",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="kg"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#trendFill)"
                  dot={{ r: 3, fill: "#059669" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <table className="sr-only">
            <caption>
              Weekly emissions in kilograms of CO₂ equivalent. The target pace
              is {weeklyTargetKg.toFixed(1)} kg per week.
            </caption>
            <thead>
              <tr>
                <th scope="col">Week starting</th>
                <th scope="col">Emissions (kg CO₂e)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.weekStart}>
                  <th scope="row">{d.weekStart}</th>
                  <td>{d.kgCo2e.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  const parts = data
    .filter((d) => d.kgCo2e > 0)
    .map((d) => `week of ${d.weekStart}: ${d.kgCo2e.toFixed(1)} kg`);
  return `Area chart of weekly CO2 emissions against a ${weeklyTargetKg.toFixed(
    1,
  )} kg weekly target. ${parts.join(", ")}.`;
}

export const TrendChart = memo(TrendChartComponent);
