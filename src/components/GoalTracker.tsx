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
      className="glass-card rounded-[20px] p-6 sm:p-8"
    >
      <h2
        id="goal-heading"
        className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
      >
        <Gauge
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        Daily carbon budget
      </h2>

      <div className="mt-6 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          {/* Enhanced SVG gauge with gradient background */}
          <svg
            width="110"
            height="110"
            viewBox="0 0 96 96"
            role="img"
            aria-label={`Today: ${todayKg.toFixed(1)} of ${dailyBudgetKg.toFixed(1)} kilograms CO2 equivalent budget, ${
              isOverBudget ? "over budget" : "within budget"
            }`}
            className="drop-shadow-lg"
          >
            <defs>
              <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              strokeWidth="8"
              className="stroke-stone-100 dark:stroke-stone-800"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="url(#circleGradient)"
              fillOpacity="0.1"
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
              className={`transition-[stroke-dashoffset] duration-700 ease-out ${
                isOverBudget
                  ? "stroke-amber-500 drop-shadow-md drop-shadow-amber-500/20"
                  : "stroke-emerald-500 drop-shadow-md drop-shadow-emerald-500/30 dark:stroke-emerald-400"
              }`}
            />
            <text
              x="48"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-stone-900 text-[24px] font-extrabold dark:fill-emerald-50"
            >
              {todayKg.toFixed(1)}
            </text>
            <text
              x="48"
              y="66"
              textAnchor="middle"
              className="fill-stone-500 text-[10px] font-medium dark:fill-stone-400"
            >
              of {dailyBudgetKg.toFixed(1)} kg
            </text>
          </svg>

          <div className="flex flex-col gap-3">
            <p className={`text-sm font-medium ${
              isOverBudget
                ? "text-amber-700 dark:text-amber-400"
                : "text-emerald-700 dark:text-emerald-400"
            }`}>
              {isOverBudget
                ? "🎯 Over budget — tomorrow's a reset"
                : "✨ Within budget — great pace!"}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1.5 dark:border-amber-800/40 dark:bg-amber-950/50">
              <Flame className="h-4 w-4 animate-pulse text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span className="font-bold text-amber-900 dark:text-amber-200">
                {streak}-day streak
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={inputId}
              className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
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
              className="w-32 rounded-[12px] border border-stone-200 bg-white/80 px-3 py-2 text-sm font-semibold text-stone-900 backdrop-blur-sm outline-none transition-all focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30 focus-visible:shadow-md focus-visible:shadow-emerald-100/50 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-[12px] bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Save goal
          </button>
        </form>
      </div>

      {achievements.length > 0 && (
        <ul
          className="mt-6 flex flex-wrap gap-2"
          aria-label="Unlocked achievements"
        >
          {achievements.map((achievement) => (
            <li
              key={achievement.id}
              title={achievement.description}
              className="flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition-all hover:bg-emerald-100 hover:shadow-sm dark:border-emerald-800/40 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
            >
              <span aria-hidden="true" className="text-sm">{achievement.icon}</span>
              {achievement.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
