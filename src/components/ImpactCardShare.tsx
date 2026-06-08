"use client";

import { useRef, useState } from "react";
import {
  drawImpactCard,
  IMPACT_CARD_DIMENSIONS,
  type ImpactCardData,
} from "@/lib/share/impactCard";

interface ImpactCardShareProps {
  data: ImpactCardData;
}

/**
 * Renders a downloadable, shareable "impact card" PNG — useful for posting
 * progress to social media (and conveniently doubles as a quick way to produce
 * an image for a LinkedIn post). Generation happens entirely client-side via
 * the Canvas API: no server round-trip, no extra dependencies, no AI cost.
 */
export function ImpactCardShare({ data }: ImpactCardShareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");

  function handleGenerate() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus("error");
      return;
    }

    canvas.width = IMPACT_CARD_DIMENSIONS.width;
    canvas.height = IMPACT_CARD_DIMENSIONS.height;
    drawImpactCard(ctx, data);
    setStatus("ready");
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas || status !== "ready") return;

    const link = document.createElement("a");
    link.download = "my-carbon-impact-card.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <section
      aria-labelledby="share-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2
        id="share-heading"
        className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
      >
        Share your progress
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Generate a shareable image summarizing your impact — perfect for
        inspiring others.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-700"
        >
          Generate impact card
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={status !== "ready"}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Download PNG
        </button>
      </div>

      {status === "error" && (
        <p
          role="status"
          className="mt-3 text-sm text-red-600 dark:text-red-400"
        >
          Couldn&apos;t generate an image in this browser.
        </p>
      )}

      <canvas
        ref={canvasRef}
        role="img"
        aria-label={
          status === "ready"
            ? `Shareable card showing ${data.totalKgCo2e.toFixed(1)} kilograms of CO2 equivalent over ${data.periodDays} days and a ${data.streak}-day streak`
            : "Impact card preview, not yet generated"
        }
        className="mt-4 w-full max-w-xs rounded-xl border border-zinc-200 dark:border-zinc-800"
      />
    </section>
  );
}
