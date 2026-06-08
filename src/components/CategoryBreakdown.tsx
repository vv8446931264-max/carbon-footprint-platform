"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryTotal } from "@/lib/emissions/aggregate";

interface CategoryBreakdownProps {
  totals: CategoryTotal[];
}

const CATEGORY_LABELS: Record<CategoryTotal["category"], string> = {
  transport: "Transport",
  energy: "Energy",
  food: "Food",
  shopping: "Shopping",
  waste: "Waste",
};

/**
 * Bar chart of emissions by category. Pairs the visual chart with a real
 * <table> of the same data (visually hidden but screen-reader accessible)
 * so the information isn't locked behind a canvas/SVG for assistive tech.
 */
export function CategoryBreakdown({ totals }: CategoryBreakdownProps) {
  const data = totals.map((t) => ({ name: CATEGORY_LABELS[t.category], kg: t.kgCo2e }));

  if (totals.length === 0) {
    return (
      <section
        aria-labelledby="breakdown-heading"
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 id="breakdown-heading" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Breakdown by category
        </h2>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          No activities logged yet — add one above to see your breakdown.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="breakdown-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="breakdown-heading" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Breakdown by category
      </h2>

      <div className="mt-4 h-64" role="img" aria-label={describeChart(totals)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-zinc-200 dark:stroke-zinc-800" />
            <XAxis type="number" tick={{ fontSize: 12 }} unit=" kg" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)} kg CO₂e`, "Emissions"]}
            />
            <Bar dataKey="kg" fill="#059669" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>Emissions by category, in kilograms of CO₂ equivalent</caption>
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
    </section>
  );
}

function describeChart(totals: CategoryTotal[]): string {
  const parts = totals.map((t) => `${CATEGORY_LABELS[t.category]}: ${t.kgCo2e.toFixed(1)} kilograms`);
  return `Bar chart of CO2 emissions by category. ${parts.join(", ")}.`;
}
