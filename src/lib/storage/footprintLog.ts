import { z } from "zod";
import type { LoggedActivity } from "@/types/activity";
import { activitySchema } from "@/lib/ai/activitySchema";

const STORAGE_KEY = "carbon-footprint-log:v1";

/**
 * localStorage is user-editable, shared with extensions, and survives app
 * versions — it is an UNTRUSTED input, same as an API body. The previous
 * implementation cast `JSON.parse` output straight to `LoggedActivity[]`;
 * one hand-edited or stale-schema entry (string emissions, missing activity)
 * would crash the dashboard or poison every total with NaN. Each entry is
 * now validated against the same schema the AI guardrails use; invalid
 * entries are dropped individually instead of nuking the whole log.
 */
const loggedActivitySchema = z.object({
  id: z.string().min(1),
  loggedAt: z.string().min(1),
  description: z.string().max(500),
  activity: activitySchema,
  emissionsKgCo2e: z.number().finite().nonnegative(),
});

/**
 * Loads and validates the activity log from storage. Treats stored data as
 * untrusted: each entry is parsed against {@link loggedActivitySchema} and any
 * invalid entry is dropped individually rather than failing the whole load.
 *
 * @param storage - Storage to read from; defaults to `window.localStorage`.
 *   Returns `[]` during SSR (no `window`) or on any parse error.
 * @returns The validated activity log, newest entries first.
 */
export function loadLog(storage?: Pick<Storage, "getItem">): LoggedActivity[] {
  const target =
    storage ?? (typeof window === "undefined" ? null : window.localStorage);
  if (!target) return [];

  const raw = target.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((candidate) => {
      const result = loggedActivitySchema.safeParse(candidate);
      return result.success ? [result.data as LoggedActivity] : [];
    });
  } catch {
    return [];
  }
}

/**
 * Persists the activity log to storage. Never throws: on quota errors it
 * retries with a trimmed log, and as a last resort logs a warning instead of
 * crashing the UI over persistence.
 *
 * @param entries - The full activity log to persist.
 * @param storage - Storage to write to; defaults to `window.localStorage`.
 *   No-ops during SSR (no `window`).
 */
export function saveLog(
  entries: LoggedActivity[],
  storage?: Pick<Storage, "setItem">,
): void {
  const target =
    storage ?? (typeof window === "undefined" ? null : window.localStorage);
  if (!target) return;

  try {
    target.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded (private mode, full disk). Keep the most recent entries
    // rather than silently losing everything — and never crash the UI over
    // persistence.
    try {
      target.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 100)));
    } catch {
      console.warn("Could not persist the activity log (storage unavailable).");
    }
  }
}

export function appendEntry(
  entries: LoggedActivity[],
  entry: LoggedActivity,
  maxEntries = 500,
): LoggedActivity[] {
  return [entry, ...entries].slice(0, maxEntries);
}
