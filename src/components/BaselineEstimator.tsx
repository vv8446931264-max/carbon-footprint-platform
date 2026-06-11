"use client";

import { useId, useState } from "react";
import { Compass, X } from "lucide-react";
import {
  BASELINE_QUESTIONS,
  estimateAnnualTonnes,
  isComplete,
  type BaselineAnswers,
} from "@/lib/baseline/estimate";
import {
  INDIA_URBAN_AVERAGE_ANNUAL_TONNES,
  PARIS_ALIGNED_ANNUAL_TONNES,
} from "@/lib/emissions/calculate";
import type { StoredBaseline } from "@/lib/storage/baseline";

interface BaselineEstimatorProps {
  onComplete: (baseline: StoredBaseline) => void;
  onSkip: () => void;
}

/**
 * First-run estimator. A new user shouldn't have to log activities before they
 * can *understand* their footprint, so we ask five quick lifestyle questions and
 * show a directional starting estimate — framed against the Paris-aligned 2 t
 * target and the global average, the same framing the live dashboard uses. The
 * deterministic maths lives in `lib/baseline/estimate.ts`.
 */
export function BaselineEstimator({
  onComplete,
  onSkip,
}: BaselineEstimatorProps) {
  const [answers, setAnswers] = useState<BaselineAnswers>({});
  const headingId = useId();

  const complete = isComplete(answers);
  const tonnes = estimateAnnualTonnes(answers);
  const answered = BASELINE_QUESTIONS.filter((q) => answers[q.id]).length;

  const vsTarget = tonnes / PARIS_ALIGNED_ANNUAL_TONNES;
  const vsUrbanIndia = Math.round(
    (1 - tonnes / INDIA_URBAN_AVERAGE_ANNUAL_TONNES) * 100,
  );

  function choose(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function handleSave() {
    if (!complete) return;
    onComplete({
      answers,
      annualTonnes: tonnes,
      completedAt: new Date().toISOString(),
    });
  }

  return (
    <section
      aria-labelledby={headingId}
      className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-stone-900"
    >
      <button
        type="button"
        onClick={onSkip}
        aria-label="Skip the estimate for now"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <h2
        id={headingId}
        className="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-stone-50"
      >
        <Compass
          className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        Estimate your footprint in 30 seconds
      </h2>
      <p className="mt-1 max-w-prose text-sm text-stone-600 dark:text-stone-300">
        Answer five quick questions to see your starting point. Logging real
        activities below will refine it over time.
      </p>

      <div className="mt-5 flex flex-col gap-5">
        {BASELINE_QUESTIONS.map((question) => (
          <fieldset key={question.id}>
            <legend className="mb-2 text-sm font-medium text-stone-800 dark:text-stone-100">
              {question.prompt}
            </legend>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(question.id, option.value)}
                    className={
                      selected
                        ? "rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition"
                        : "rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-emerald-600 dark:hover:text-emerald-300"
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6 border-t border-emerald-200/60 pt-4 dark:border-emerald-900/40">
        {complete ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Your estimated footprint
              </p>
              <p className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
                  ≈ {tonnes.toFixed(1)}
                </span>
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  tonnes CO₂e / year
                </span>
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                {vsTarget > 1
                  ? `That's ${vsTarget.toFixed(1)}× the Paris-aligned 2 t target`
                  : "At or below the Paris-aligned 2 t target — India's national average is ~2 t, but urban households typically reach 4–5 t"}
                {vsTarget > 1 &&
                  (vsUrbanIndia > 0
                    ? ` · ${vsUrbanIndia}% below the urban India average`
                    : ` · above the urban India average of ~4.5 t`)}
                .
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Save my baseline
            </button>
          </div>
        ) : (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {answered} of {BASELINE_QUESTIONS.length} answered. Pick one from
            each to see your estimate.
          </p>
        )}
      </div>
    </section>
  );
}
