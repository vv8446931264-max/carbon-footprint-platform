"use client";

import { useId, useRef, useState } from "react";
import type { Activity, LoggedActivity } from "@/types/activity";

interface ReceiptItem {
  description: string;
  confidence: "high" | "medium" | "low";
  activity: Activity;
  emissionsKgCo2e: number;
  costUsd: number;
}

interface ReceiptResponse {
  sourceLabel: string | null;
  items: ReceiptItem[];
}

interface ReceiptUploadProps {
  onLogMany: (entries: LoggedActivity[]) => void;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 6 * 1024 * 1024;

const CATEGORY_ICON: Record<Activity["category"], string> = {
  transport: "🚗",
  energy: "⚡",
  food: "🍽️",
  shopping: "🛍️",
  waste: "🗑️",
};

/**
 * Bill / receipt interpreter (multimodal). A person snaps a photo of a grocery
 * receipt or utility bill; Gemini Vision extracts the carbon-relevant line
 * items, which are previewed (with per-item confidence) and added to the log in
 * one tap. The image is read client-side to base64 and sent to a rate-limited,
 * size-capped API route — it is never stored.
 */
export function ReceiptUpload({ onLogMany }: ReceiptUploadProps) {
  const [status, setStatus] = useState<
    "idle" | "reading" | "loading" | "ready" | "error"
  >("idle");
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  function reset() {
    setItems([]);
    setSourceLabel(null);
    setMessage(null);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      setStatus("error");
      setMessage("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setMessage("That image is larger than 6 MB — try a smaller photo.");
      return;
    }

    setStatus("reading");
    setMessage(null);

    let base64: string;
    try {
      base64 = await readAsBase64(file);
    } catch {
      setStatus("error");
      setMessage("Couldn't read that file. Please try another image.");
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = (await response.json()) as
        | ReceiptResponse
        | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error(
          "error" in data ? data.error : "Could not read that image.",
        );
      }

      if (data.items.length === 0) {
        setStatus("error");
        setMessage(
          "No carbon-relevant items found. Try a clearer photo of a receipt or bill.",
        );
        return;
      }

      setItems(data.items);
      setSourceLabel(data.sourceLabel);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  }

  function handleAddAll() {
    const now = new Date().toISOString();
    const entries: LoggedActivity[] = items.map((item) => ({
      id: crypto.randomUUID(),
      loggedAt: now,
      description: item.description,
      activity: item.activity,
      emissionsKgCo2e: item.emissionsKgCo2e,
    }));
    onLogMany(entries);
    reset();
  }

  const totalKg = items.reduce((sum, i) => sum + i.emissionsKgCo2e, 0);

  return (
    <section
      aria-labelledby="receipt-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2
        id="receipt-heading"
        className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
      >
        Scan a receipt or bill
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Upload a photo of a grocery receipt, fuel slip, or utility bill and AI
        will extract the activities for you.
      </p>

      <div className="mt-4">
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <span aria-hidden="true">📷</span>
          {status === "loading" || status === "reading"
            ? "Reading image…"
            : "Choose image"}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          disabled={status === "loading" || status === "reading"}
          className="sr-only"
        />
      </div>

      <div role="status" aria-live="polite" className="mt-3">
        {status === "loading" && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Extracting activities from your image…
          </p>
        )}
        {status === "error" && message && (
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        )}
      </div>

      {status === "ready" && items.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {sourceLabel ? `${sourceLabel} — ` : ""}
            {items.length} item{items.length === 1 ? "" : "s"} found (
            {totalKg.toFixed(1)} kg CO₂e)
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <span className="flex items-start gap-2">
                  <span aria-hidden="true">
                    {CATEGORY_ICON[item.activity.category]}
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-100">
                    {item.description}
                    <span className="ml-1 text-xs text-zinc-400">
                      ({item.confidence} confidence)
                    </span>
                  </span>
                </span>
                <span className="whitespace-nowrap font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {item.emissionsKgCo2e.toFixed(2)} kg
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleAddAll}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Add {items.length}{" "}
              {items.length === 1 ? "activity" : "activities"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected file read result."));
        return;
      }
      // Strip the "data:<mime>;base64," prefix — the API wants raw base64.
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}
