"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

/**
 * Route-level error boundary. Without this file, any uncaught render error in
 * a client component replaces the whole app with a blank screen — the worst
 * possible demo moment. The person's data is safe (localStorage), so the
 * honest recovery is: say so, and offer a one-click retry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Internal detail goes to the console/monitoring, not the UI.
    console.error("Unhandled UI error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
        Something went wrong on this screen
      </h1>
      <p className="max-w-md text-sm leading-6 text-stone-600 dark:text-stone-300">
        Your logged activities are safe — they live in your browser. Try
        reloading this view; if it keeps happening, clearing the page and
        re-opening usually resolves it.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </main>
  );
}
