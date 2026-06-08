import type { LoggedActivity } from "@/types/activity";

export interface ExportBundle {
  app: string;
  version: number;
  exportedAt: string;
  entryCount: number;
  entries: LoggedActivity[];
}

/**
 * Wraps the activity log in a small, self-describing envelope so an exported
 * file is portable and future-proof (versioned, timestamped) rather than a bare
 * array. Pure and unit-testable.
 */
export function buildExportBundle(
  entries: LoggedActivity[],
  now: Date = new Date(),
): ExportBundle {
  return {
    app: "Carbon Coach",
    version: 1,
    exportedAt: now.toISOString(),
    entryCount: entries.length,
    entries,
  };
}

export function serializeLog(entries: LoggedActivity[], now?: Date): string {
  return JSON.stringify(buildExportBundle(entries, now), null, 2);
}
