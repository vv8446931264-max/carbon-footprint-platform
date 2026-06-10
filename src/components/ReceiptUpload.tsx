"use client";

import { useId, useRef, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import type { Activity, LoggedActivity } from "@/types/activity";
import { prepareImageForUpload } from "@/lib/images/prepareImageForUpload";
import { CATEGORY_VISUALS } from "@/lib/ui/categories";

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

/**
 * Bill / receipt interpreter (multimodal). A person snaps a photo of a grocery
 * receipt or utility bill; Gemini Vision extracts the carbon-relevant line
 * items, which are previewed (with per-item confidence) and added to the log in
 * one tap. The image is downscaled client-side (a 4 MB phone photo becomes a
 * few hundred KB with no loss the vision model cares about), then sent to a
 * rate-limited, size-capped API route — it is never stored.
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

  const busy = status === "loading" || status === "reading";

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
      setMessage("That image is larger than 6 MB. Try a smaller photo.");
      return;
    }

    setStatus("reading");
    setMessage(null);

    // Downscale + re-encode in the browser so we never ship a multi-megabyte
    // original over the wire (or into the vision model's token budget).
    let prepared: Awaited<ReturnType<typeof prepareImageForUpload>>;
    try {
      prepared = await prepareImageForUpload(file);
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
        body: JSON.stringify({
          imageBase64: prepared.base64,
          mimeType: prepared.mimeType,
        }),
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
      aria-busy={busy}
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <h2
        id="receipt-heading"
        className="flex items-center gap-2 text-sm font-medium text-stone-500 dark:text-stone-400"
      >
        <ScanLine
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        Scan a receipt or bill
      </h2>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
        Upload a photo of a grocery receipt, fuel slip, or utility bill and AI
        will extract the activities for you.
      </p>

      <div className="mt-4">
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 focus-within:ring-2 focus-within:ring-emerald-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          {busy ? "Reading image…" : "Choose image"}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          disabled={busy}
          className="sr-only"
        />
      </div>

      <div role="status" aria-live="polite" className="mt-3">
        {status === "loading" && (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Extracting activities from your image…
          </p>
        )}
        {status === "error" && message && (
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        )}
      </div>

      {status === "ready" && items.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
            {sourceLabel ? `${sourceLabel} · ` : ""}
            {items.length} item{items.length === 1 ? "" : "s"} found (
            {totalKg.toFixed(1)} kg CO₂e)
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {items.map((item, index) => {
              const { Icon, chip } = CATEGORY_VISUALS[item.activity.category];
              return (
                <li
                  key={`${index}-${item.description}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 p-3 text-sm dark:border-stone-800"
                >
                  <span className="flex min-w-0 items-start gap-2.5">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${chip}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 text-stone-800 dark:text-stone-100">
                      {item.description}
                      <span className="ml-1.5 text-xs text-stone-500 dark:text-stone-400">
                        ({item.confidence} confidence)
                      </span>
                    </span>
                  </span>
                  <span className="whitespace-nowrap font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                    {item.emissionsKgCo2e.toFixed(2)} kg
                  </span>
                </li>
              );
            })}
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
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
