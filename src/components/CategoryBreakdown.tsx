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
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <h2
        id="breakdown-heading"
        className="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-stone-50"
      >
        <BarChart3
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        Breakdown by category
      </h2>

      {totals.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
          No activities logged yet. Add one above to see your breakdown.
        </p>
      ) : (
        <>
          <div
            className="mt-4 h-64"
            role="img"
            aria-label={describeChart(totals)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  className="stroke-stone-200 dark:stroke-stone-800"
                />
                <XAxis type="number" tick={{ fontSize: 12 }} unit=" kg" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: "rgba(120,113,108,0.08)" }}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)} kg CO₂e`,
                    "Emissions",
                  ]}
                />
                <Bar dataKey="kg" radius={[0, 4, 4, 0]}>
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
