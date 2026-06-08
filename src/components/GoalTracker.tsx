"use client";

import { useId, useState } from "react";
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
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2
        id="goal-heading"
        className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
      >
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
              className="stroke-zinc-200 dark:stroke-zinc-800"
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
              y="44"
              textAnchor="middle"
              className="fill-zinc-900 text-[15px] font-semibold dark:fill-zinc-50"
            >
              {todayKg.toFixed(1)}
            </text>
            <text
              x="48"
              y="60"
              textAnchor="middle"
              className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
            >
              of {dailyBudgetKg.toFixed(1)} kg
            </text>
          </svg>

          <div>
            <p className="text-sm text-zinc-700 dark:text-zinc-200">
              {isOverBudget
                ? "Over today's budget — tomorrow's a fresh start."
                : "Within today's budget. Nice pace!"}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <span aria-hidden="true">🔥</span>
              {streak} day streak
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={inputId}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-300"
            >
              Set daily budget (kg CO₂e)
            </label>
            <input
              id={inputId}
              type="number"
              min="0.1"
              step="0.1"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="w-28 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-700"
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
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
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
