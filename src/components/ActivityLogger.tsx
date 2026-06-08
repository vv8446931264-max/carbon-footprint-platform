"use client";

import { useId, useState } from "react";
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

/**
 * Lets a person describe an activity in plain language ("drove 12km to work")
 * and turns it into a logged, quantified entry via the /api/parse-activity
 * route. Fully keyboard-operable and announces status changes to screen readers.
 */
export function ActivityLogger({ onLog }: ActivityLoggerProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputId = useId();
  const statusId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || status === "loading") return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/parse-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      const data = (await response.json()) as ParseResponse | { error: string };

      if (!response.ok || "error" in data) {
        const message = "error" in data ? data.error : "Could not understand that activity.";
        throw new Error(message);
      }

      onLog({
        id: crypto.randomUUID(),
        loggedAt: new Date().toISOString(),
        description: data.description,
        activity: data.activity,
        emissionsKgCo2e: data.emissionsKgCo2e ?? calculateEmissionsKgCo2e(data.activity),
      });

      setText("");
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" aria-describedby={statusId}>
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
        Describe an activity in your own words
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="e.g. drove 14 km to work and had a chicken sandwich for lunch"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={status === "loading" || !text.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Logging…" : "Log activity"}
        </button>
      </div>
      <p id={statusId} role="status" aria-live="polite" className="text-sm">
        {status === "loading" && <span className="text-zinc-500">Estimating emissions…</span>}
        {status === "error" && <span className="text-red-600 dark:text-red-400">{errorMessage}</span>}
      </p>
    </form>
  );
}
