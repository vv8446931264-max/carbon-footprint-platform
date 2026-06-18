"use client";

import { memo } from "react";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryTotal } from "@/lib/emissions/aggregate";
import { CATEGORY_LABELS, CATEGORY_VISUALS } from "@/lib/ui/categories";

interface CategoryBreakdownProps {
  totals: CategoryTotal[];
}

/**
 * Bar chart of emissions by category, coloured per category for quick scanning.
 * Pairs the visual chart with a real <table> of the same data (visually hidden
 * but screen-reader accessible) so the information isn't locked behind an SVG
 * for assistive tech. Memoised so logging an activity elsewhere doesn't force a
 * full chart re-draw when this data is unchanged.
 */
function CategoryBreakdownComponent({ totals }: CategoryBreakdownProps) {
  const data = totals.map((t) => ({
    name: CATEGORY_LABELS[t.category],
    kg: t.kgCo2e,
    color: CATEGORY_VISUALS[t.category].chartColor,
  }));

  return (
    <section
      aria-labelledby="breakdown-heading"
      className="rounded-[20px] border border-stone-100/80 bg-gradient-to-br from-white via-emerald-50/15 to-white p-6 shadow-[var(--shadow-soft)] dark:border-stone-800/60 dark:from-stone-900 dark:via-emerald-950/10 dark:to-stone-900 sm:p-8"
    >
      <h2
        id="breakdown-heading"
        className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
      >
        <BarChart3
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        Breakdown by category
      </h2>

      {totals.length === 0 ? (
        <div className="mt-6 rounded-xl bg-stone-50/60 p-4 dark:bg-stone-800/30">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            📊 No activities logged yet. Add one above to see your breakdown.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mt-6 h-64 rounded-xl bg-gradient-to-b from-emerald-50/30 to-white p-3 dark:from-emerald-950/20 dark:to-stone-900/50"
            role="img"
            aria-label={describeChart(totals)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  horizontal={false}
                  className="stroke-stone-200/40 dark:stroke-stone-700/40"
                  strokeOpacity={0.3}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  unit=" kg"
                  axisLine={{ stroke: "#e2e8f0", strokeOpacity: 0.3 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  width={80}
                  axisLine={{ stroke: "#e2e8f0", strokeOpacity: 0.3 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(16,185,129,0.06)" }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)} kg CO₂e`,
                    "Emissions",
                  ]}
                />
                <Bar dataKey="kg" radius={[0, 6, 6, 0]}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <table className="sr-only">
            <caption>
              Emissions by category, in kilograms of CO₂ equivalent
            </caption>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Emissions (kg CO₂e)</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((t) => (
                <tr key={t.category}>
                  <th scope="row">{CATEGORY_LABELS[t.category]}</th>
                  <td>{t.kgCo2e.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

function describeChart(totals: CategoryTotal[]): string {
  const parts = totals.map(
    (t) => `${CATEGORY_LABELS[t.category]}: ${t.kgCo2e.toFixed(1)} kilograms`,
  );
  return `Bar chart of CO2 emissions by category. ${parts.join(", ")}.`;
}

export const CategoryBreakdown = memo(CategoryBreakdownComponent);
