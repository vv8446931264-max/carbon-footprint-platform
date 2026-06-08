"use client";

import { useId, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { LoggedActivity } from "@/types/activity";
import { calculateEmissionsKgCo2e } from "@/lib/emissions/calculate";

interface ActivityLoggerProps {
  onLog: (entry: LoggedActivity) => void;
}

interface ParseResponse {
  activity: LoggedActivity["activity"];
  description: string;
  confidence: "high" | "medium" | "low";
  emissionsKgCo2e: number;
}

const EXAMPLES = [
  "drove 14 km to work",
  "had a beef burger for lunch",
  "took the train 40 km",
  "used 8 kWh of electricity",
];

/**
 * Lets a person describe an activity in plain language ("drove 12km to work")
 * and turns it into a logged, quantified entry via the /api/parse-activity
 * route. Fully keyboard-operable and announces status changes to screen readers.
 * Surfaces the AI's confidence as a guardrail so low-confidence estimates are
 * clearly flagged rather than presented as fact.
 */
export function ActivityLogger({ onLog }: ActivityLoggerProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lowConfidence, setLowConfidence] = useState(false);
  const inputId = useId();
  const statusId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || status === "loading") return;

    setStatus("loading");
    setErrorMessage(null);
    setLowConfidence(false);

    try {
      const response = await fetch("/api/parse-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      const data = (await response.json()) as ParseResponse | { error: string };

      if (!response.ok || "error" in data) {
        const message =
          "error" in data ? data.error : "Could not understand that activity.";
        throw new Error(message);
      }

      onLog({
        id: crypto.randomUUID(),
        loggedAt: new Date().toISOString(),
        description: data.description,
        activity: data.activity,
        emissionsKgCo2e:
          data.emissionsKgCo2e ?? calculateEmissionsKgCo2e(data.activity),
      });

      setLowConfidence(data.confidence === "low");
      setText("");
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3"
      aria-describedby={statusId}
    >
      <label
        htmlFor={inputId}
        className="flex items-center gap-2 text-sm font-medium text-stone-800 dark:text-stone-100"
      >
        <Sparkles
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        Describe an activity in your own words
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="e.g. drove 14 km to work and had a chicken sandwich for lunch"
          className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={status === "loading" || !text.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Logging…
            </>
          ) : (
            "Log activity"
          )}
        </button>
      </div>

      {/* Example chips help people understand the input format at a glance. */}
      {status === "idle" && !text && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setText(example)}
              className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <p id={statusId} role="status" aria-live="polite" className="text-sm">
        {status === "loading" && (
          <span className="text-stone-500 dark:text-stone-400">
            Estimating emissions…
          </span>
        )}
        {status === "error" && (
          <span className="text-red-600 dark:text-red-400">{errorMessage}</span>
        )}
        {status === "idle" && lowConfidence && (
          <span className="text-amber-700 dark:text-amber-400">
            Logged as a best guess. Add an amount or detail for a more accurate
            estimate.
          </span>
        )}
      </p>
    </form>
  );
}
