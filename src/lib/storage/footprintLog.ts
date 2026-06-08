import type { LoggedActivity } from "@/types/activity";

const STORAGE_KEY = "carbon-footprint-log:v1";

/**
 * Thin persistence layer over localStorage. Isolated here so the storage
 * mechanism (and any future swap to a real backend) doesn't leak into
 * components, and so it can be unit-tested without a browser.
 */
export function loadLog(storage?: Pick<Storage, "getItem">): LoggedActivity[] {
  const target = storage ?? (typeof window === "undefined" ? null : window.localStorage);
  if (!target) return [];

  const raw = target.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LoggedActivity[]) : [];
  } catch {
    return [];
  }
}

export function saveLog(entries: LoggedActivity[], storage?: Pick<Storage, "setItem">): void {
  const target = storage ?? (typeof window === "undefined" ? null : window.localStorage);
  if (!target) return;

  target.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function appendEntry(
  entries: LoggedActivity[],
  entry: LoggedActivity,
  maxEntries = 500,
): LoggedActivity[] {
  return [entry, ...entries].slice(0, maxEntries);
}
