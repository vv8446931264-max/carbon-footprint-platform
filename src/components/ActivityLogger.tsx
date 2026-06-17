"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Leaf, Sparkles } from "lucide-react";

const LOADING_MESSAGES = [
  "Estimating emissions…",
  "Reading activity…",
  "Calculating CO₂e…",
  "Almost there…",
];
import type { LoggedActivity } from "@/types/activity";
import { calculateEmissionsKgCo2e } from "@/lib/emissions/calculate";

interface ActivityLoggerProps {
  onLog: (entry: LoggedActivity) => void;
  /** Pre-filled text, e.g. from the EmptyState quick-action chips. */
  prefill?: string;
}

interface ParseResponse {
  activity: LoggedActivity["activity"];
  description: string;
  confidence: "high" | "medium" | "low";
  emissionsKgCo2e: number;
}

const EXAMPLES = [
  "drove 14 km to work",
  "had chicken biryani for lunch",
  "took the train 40 km",
  "used 8 kWh of electricity",
];

const CHAR_LIMIT = 500;

export function ActivityLogger({ onLog, prefill }: ActivityLoggerProps) {
  const [text, setText] = useState(prefill ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputId = useId();
  const statusId = useId();

  // Sync prefill when parent updates it (e.g. EmptyState chip click)
  useEffect(() => {
    if (prefill !== undefined) setText(prefill);
  }, [prefill]);

  // Rotate loading message every 1.5 s
  useEffect(() => {
    if (status !== "loading") return;
    const id = setInterval(
      () => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length),
      1500,
    );
    return () => clearInterval(id);
  }, [status]);

  // Clean up success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const charCount = text.length;
  const isNearLimit = charCount > 420;
  const isOverLimit = charCount > CHAR_LIMIT;

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
      setStatus("success");

      // Reset to idle after 2 seconds so button returns to normal
      successTimerRef.current = setTimeout(() => setStatus("idle"), 2000);
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
      className="flex flex-col gap-4"
      aria-describedby={statusId}
    >
      <label
        htmlFor={inputId}
        className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-100"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/60">
          <Sparkles
            className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400"
            aria-hidden="true"
          />
        </span>
        What did you do today?
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            id={inputId}
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, CHAR_LIMIT))}
            placeholder="e.g. drove 10 km to work"
            className={`w-full rounded-[14px] border bg-white/80 px-4 py-3 pr-14 text-sm text-stone-900 outline-none backdrop-blur-sm transition-all duration-200 dark:bg-stone-800/60 dark:text-stone-100 ${
              isOverLimit
                ? "border-rose-300 shadow-sm shadow-rose-100 focus-visible:border-rose-400 focus-visible:ring-2 focus-visible:ring-rose-400/30 dark:border-rose-700 dark:shadow-rose-900/20"
                : "border-stone-200 shadow-sm focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30 focus-visible:shadow-md focus-visible:shadow-emerald-100/50 dark:border-stone-700 dark:focus-visible:border-emerald-600 dark:focus-visible:shadow-emerald-900/20"
            }`}
          />
          {charCount > 0 && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs tabular-nums ${
                isOverLimit
                  ? "text-rose-500"
                  : isNearLimit
                    ? "text-amber-500"
                    : "text-stone-400 dark:text-stone-500"
              }`}
            >
              {charCount}/{CHAR_LIMIT}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !text.trim() || isOverLimit}
          className={`inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            status === "success"
              ? "bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600"
              : "bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-emerald-600/30 hover:from-emerald-500 hover:to-emerald-800 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98]"
          }`}
        >
          {status === "loading" ? (
            <>
              <Leaf className="h-4 w-4 animate-pulse" aria-hidden="true" />
              <span className="hidden sm:inline">{LOADING_MESSAGES[loadingMsgIdx]}</span>
              <span className="sm:hidden">Logging…</span>
            </>
          ) : status === "success" ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Logged!
            </>
          ) : (
            <>
              <Leaf className="h-4 w-4" aria-hidden="true" />
              Log activity
            </>
          )}
        </button>
      </div>

      {/* Example chips */}
      {status === "idle" && !text && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setText(example)}
              className="rounded-full border border-stone-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-stone-600 backdrop-blur-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <p id={statusId} role="status" aria-live="polite" className="text-sm">
        {status === "loading" && (
          <span className="text-stone-500 dark:text-stone-400">
            {LOADING_MESSAGES[loadingMsgIdx]}
          </span>
        )}
        {status === "error" && (
          <span className="text-red-600 dark:text-red-400">{errorMessage}</span>
        )}
        {(status === "idle" || status === "success") && lowConfidence && (
          <span className="text-amber-700 dark:text-amber-400">
            Logged as a best guess. Add an amount or detail for a more accurate
            estimate.
          </span>
        )}
      </p>
    </form>
  );
}
