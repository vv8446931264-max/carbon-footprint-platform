"use client";

import { useId, useRef, useState } from "react";
import { Images, ScanLine } from "lucide-react";
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

interface ReceiptGroup {
  fileName: string;
  sourceLabel: string | null;
  items: ReceiptItem[];
}

interface ReceiptUploadProps {
  onLogMany: (entries: LoggedActivity[]) => void;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 5;

async function processFile(file: File): Promise<ReceiptGroup> {
  const prepared = await prepareImageForUpload(file);
  const response = await fetch("/api/parse-receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64: prepared.base64,
      mimeType: prepared.mimeType,
    }),
  });
  const data = (await response.json()) as ReceiptResponse | { error: string };
  if (!response.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Could not read that image.");
  }
  return { fileName: file.name, sourceLabel: data.sourceLabel, items: data.items };
}

/**
 * Multi-receipt interpreter. Accepts up to MAX_FILES images at once, processes
 * them in parallel, and presents all extracted activities grouped by receipt.
 * Partial failures are surfaced as a warning while successful receipts still show.
 */
export function ReceiptUpload({ onLogMany }: ReceiptUploadProps) {
  const [status, setStatus] = useState<"idle" | "processing" | "ready" | "error">("idle");
  const [groups, setGroups] = useState<ReceiptGroup[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failedCount, setFailedCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef(0);
  const inputId = useId();

  const busy = status === "processing";
  const allItems = groups.flatMap((g) => g.items);
  const totalKg = allItems.reduce((sum, i) => sum + i.emissionsKgCo2e, 0);

  function reset() {
    setGroups([]);
    setProgress(null);
    setFailedCount(0);
    setMessage(null);
    setStatus("idle");
    doneRef.current = 0;
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).slice(0, MAX_FILES);

    const badFile = files.find((f) => !ALLOWED.includes(f.type));
    if (badFile) {
      setStatus("error");
      setMessage(`"${badFile.name}" is not a JPEG, PNG, or WebP image.`);
      return;
    }

    setStatus("processing");
    setMessage(null);
    setGroups([]);
    setFailedCount(0);
    doneRef.current = 0;
    setProgress({ done: 0, total: files.length });

    const results = await Promise.allSettled(
      files.map(async (file) => {
        const result = await processFile(file);
        doneRef.current += 1;
        setProgress({ done: doneRef.current, total: files.length });
        return result;
      }),
    );

    const succeeded: ReceiptGroup[] = [];
    let failed = 0;
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.items.length > 0) {
        succeeded.push(result.value);
      } else {
        failed += 1;
      }
    }

    setGroups(succeeded);
    setFailedCount(failed);
    setProgress(null);

    if (succeeded.length === 0) {
      setStatus("error");
      setMessage(
        files.length === 1
          ? "No carbon-relevant items found. Try a clearer photo of a receipt or bill."
          : "None of the images contained readable receipts. Try clearer photos.",
      );
    } else {
      setStatus("ready");
    }
  }

  function handleAddAll() {
    const now = new Date().toISOString();
    const entries: LoggedActivity[] = allItems.map((item) => ({
      id: crypto.randomUUID(),
      loggedAt: now,
      description: item.description,
      activity: item.activity,
      emissionsKgCo2e: item.emissionsKgCo2e,
    }));
    onLogMany(entries);
    reset();
  }

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
        Scan receipts or bills
      </h2>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
        Upload up to {MAX_FILES} photos of grocery receipts, fuel slips, or
        utility bills — AI extracts all activities at once.
      </p>

      <div className="mt-4">
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 focus-within:ring-2 focus-within:ring-emerald-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          <Images className="h-4 w-4" aria-hidden="true" />
          {busy ? "Processing…" : "Choose images"}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFiles}
          disabled={busy}
          className="sr-only"
        />
      </div>

      <div role="status" aria-live="polite" className="mt-3 flex flex-col gap-1">
        {busy && progress && (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {progress.done === 0
              ? `Preparing ${progress.total} image${progress.total === 1 ? "" : "s"}…`
              : `Analysed ${progress.done} of ${progress.total}…`}
          </p>
        )}
        {status === "error" && message && (
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        )}
        {status === "ready" && failedCount > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {failedCount} image{failedCount === 1 ? "" : "s"} couldn&apos;t be
            read and {failedCount === 1 ? "was" : "were"} skipped.
          </p>
        )}
      </div>

      {status === "ready" && groups.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
            {allItems.length} item{allItems.length === 1 ? "" : "s"} found
            {groups.length > 1 ? ` across ${groups.length} receipts` : ""}
            {" "}({totalKg.toFixed(1)} kg CO₂e)
          </p>

          <div className="mt-3 flex flex-col gap-4">
            {groups.map((group, gi) => (
              <div key={gi}>
                {groups.length > 1 && (
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                    {group.sourceLabel ?? group.fileName}
                  </p>
                )}
                <ul className="flex flex-col gap-2">
                  {group.items.map((item, index) => {
                    const { Icon, chip } = CATEGORY_VISUALS[item.activity.category];
                    return (
                      <li
                        key={`${gi}-${index}-${item.description}`}
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
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleAddAll}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Add {allItems.length}{" "}
              {allItems.length === 1 ? "activity" : "activities"}
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
