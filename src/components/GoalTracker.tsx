"use client";

import { useId, useState } from "react";
import { Flame, Gauge } from "lucide-react";
import type { Achievement } from "@/lib/gamification/streaks";

interface GoalTrackerProps {
  dailyBudgetKg: number;
  onChangeBudget: (kg: number) => void;
  todayKg: number;
  streak: number;
  achievements: Achievement[];
}

/**
 * Personal carbon "budget" with a visual progress ring, streak counter,
 * and unlocked achievement badges. This is the gamification layer that
 * turns "personalized insights" into an ongoing, motivating habit loop
 * rather than a one-off number.
 */
export function GoalTracker({
  dailyBudgetKg,
  onChangeBudget,
  todayKg,
  streak,
  achievements,
}: GoalTrackerProps) {
  const [draft, setDraft] = useState(String(dailyBudgetKg));
  const inputId = useId();

  const ratio = dailyBudgetKg > 0 ? Math.min(todayKg / dailyBudgetKg, 1.5) : 0;
  const isOverBudget = todayKg > dailyBudgetKg;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - Math.min(ratio, 1));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(draft);
    if (Number.isFinite(value) && value > 0) {
      onChangeBudget(value);
    }
  }

  return (
    <section
      aria-labelledby="goal-heading"
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <h2
        id="goal-heading"
        className="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-stone-50"
      >
        <Gauge
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        Daily carbon budget
      </h2>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            role="img"
            aria-label={`Today: ${todayKg.toFixed(1)} of ${dailyBudgetKg.toFixed(1)} kilograms CO2 equivalent budget, ${
              isOverBudget ? "over budget" : "within budget"
            }`}
          >
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              strokeWidth="8"
              className="stroke-stone-200 dark:stroke-stone-800"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              transform="rotate(-90 48 48)"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={
                isOverBudget
                  ? "stroke-amber-500"
                  : "stroke-emerald-600 dark:stroke-emerald-400"
              }
            />
            <text
              x="48"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-stone-900 text-[22px] font-bold dark:fill-stone-50"
            >
              {todayKg.toFixed(1)}
            </text>
            <text
              x="48"
              y="66"
              textAnchor="middle"
              className="fill-stone-500 text-[10px] dark:fill-stone-400"
            >
              of {dailyBudgetKg.toFixed(1)} kg
            </text>
          </svg>

          <div>
            <p className="text-sm text-stone-700 dark:text-stone-200">
              {isOverBudget
                ? "Over today's budget. Tomorrow is a fresh start."
                : "Within today's budget. Nice pace!"}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <Flame className="h-4 w-4" aria-hidden="true" />
              {streak} day streak
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={inputId}
              className="text-xs font-medium text-stone-600 dark:text-stone-300"
            >
              Daily goal (kg CO₂e)
            </label>
            <input
              id={inputId}
              type="number"
              min="0.1"
              step="0.1"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="w-28 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Save
          </button>
        </form>
      </div>

      {achievements.length > 0 && (
        <ul
          className="mt-5 flex flex-wrap gap-2"
          aria-label="Unlocked achievements"
        >
          {achievements.map((achievement) => (
            <li
              key={achievement.id}
              title={achievement.description}
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              <span aria-hidden="true">{achievement.icon}</span>
              {achievement.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
