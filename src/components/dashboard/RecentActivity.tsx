"use client";

import { useMemo, useState } from "react";
import { Download, Search, Trash2, X } from "lucide-react";
import type { ActivityCategory, LoggedActivity } from "@/types/activity";
import { estimateCostUsd } from "@/lib/emissions/cost";
import { CATEGORY_LABELS, CATEGORY_VISUALS } from "@/lib/ui/categories";
import { ActivityList } from "../ActivityList";

/** How many activities to show before the "Show more" control appears. */
const DEFAULT_VISIBLE = 5;

const ALL_CATEGORIES = Object.keys(CATEGORY_VISUALS) as ActivityCategory[];

type SortOrder = "newest" | "emissions" | "cost";

interface RecentActivityProps {
  /** Activities within the dashboard's reporting window, newest first. */
  recentEntries: LoggedActivity[];
  /** Remove a single entry by id. */
  onDelete: (id: string) => void;
  /** Prefill the logger with example text and scroll to it. */
  onSelectExample: (text: string) => void;
  /** Download the full activity log as JSON. */
  onExport: () => void;
  /** Clear every logged activity. */
  onClearAll: () => void;
}

/**
 * The "Recent activity" panel: search, category filter, sort, paginated list,
 * and the export / clear-all controls. Owns its own filter and pagination
 * state since nothing outside this section depends on it.
 */
export function RecentActivity({
  recentEntries,
  onDelete,
  onSelectExample,
  onExport,
  onClearAll,
}: RecentActivityProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ActivityCategory>(
    "all",
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE);
  const [confirmingClear, setConfirmingClear] = useState(false);

  // Any change to the filters resets pagination — done in the handlers (not an
  // effect) so the state transition stays in one place and stays lint-clean.
  function changeSearch(value: string) {
    setSearchQuery(value);
    setVisibleCount(DEFAULT_VISIBLE);
  }
  function changeCategory(value: "all" | ActivityCategory) {
    setCategoryFilter(value);
    setVisibleCount(DEFAULT_VISIBLE);
  }
  function changeSort(value: SortOrder) {
    setSortOrder(value);
    setVisibleCount(DEFAULT_VISIBLE);
  }

  const filteredEntries = useMemo(() => {
    let result = recentEntries;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.description.toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") {
      result = result.filter((e) => e.activity.category === categoryFilter);
    }
    if (sortOrder === "emissions") {
      result = [...result].sort(
        (a, b) => b.emissionsKgCo2e - a.emissionsKgCo2e,
      );
    } else if (sortOrder === "cost") {
      result = [...result].sort(
        (a, b) => estimateCostUsd(b.activity) - estimateCostUsd(a.activity),
      );
    }
    return result;
  }, [recentEntries, searchQuery, categoryFilter, sortOrder]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const remainingCount = filteredEntries.length - visibleCount;
  const isFiltered = !!(searchQuery.trim() || categoryFilter !== "all");

  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="recent-heading"
          className="text-base font-semibold text-stone-900 dark:text-stone-50"
        >
          Recent activity
        </h2>
        {recentEntries.length > 0 &&
          (confirmingClear ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-stone-500 dark:text-stone-400">
                Clear everything?
              </span>
              <button
                type="button"
                onClick={() => {
                  setConfirmingClear(false);
                  onClearAll();
                }}
                className="rounded-md bg-rose-600 px-2 py-1 font-semibold text-white transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="rounded-md px-2 py-1 font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
              >
                Cancel
              </button>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={onExport}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-stone-500 transition hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-stone-400 dark:hover:text-emerald-400"
                title="Download your activity log as a JSON file"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-stone-500 transition hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-stone-400 dark:hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Clear all
              </button>
            </span>
          ))}
      </div>

      {recentEntries.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search activities…"
              className="w-full rounded-lg border border-white/40 bg-white/60 py-2 pl-9 pr-9 text-sm outline-none backdrop-blur-sm transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-white/15 dark:bg-white/10 dark:text-stone-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => changeSearch("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) =>
              changeCategory(e.target.value as "all" | ActivityCategory)
            }
            aria-label="Filter by category"
            className="rounded-lg border border-white/40 bg-white/60 px-2.5 py-2 text-sm text-stone-700 outline-none backdrop-blur-sm transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-white/15 dark:bg-white/10 dark:text-stone-200"
          >
            <option value="all">All</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => changeSort(e.target.value as SortOrder)}
            aria-label="Sort activities"
            className="rounded-lg border border-white/40 bg-white/60 px-2.5 py-2 text-sm text-stone-700 outline-none backdrop-blur-sm transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-white/15 dark:bg-white/10 dark:text-stone-200"
          >
            <option value="newest">Newest</option>
            <option value="emissions">Highest CO₂e</option>
            <option value="cost">Highest cost</option>
          </select>
        </div>
      )}

      {/* Tell people (and screen readers) what the filters returned. */}
      {recentEntries.length > 0 && isFiltered && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-stone-500 dark:text-stone-400"
        >
          Showing {filteredEntries.length} of {recentEntries.length} activities
        </p>
      )}

      <div
        className={
          filteredEntries.length > 6
            ? "max-h-[28rem] overflow-y-auto overscroll-contain rounded-xl"
            : undefined
        }
      >
        <ActivityList
          entries={visibleEntries}
          onDelete={onDelete}
          onSelectExample={onSelectExample}
          isFiltered={isFiltered}
        />

        {remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + DEFAULT_VISIBLE)}
            className="mt-1 w-full rounded-xl border border-white/30 bg-white/20 py-2.5 text-sm font-medium text-stone-700 backdrop-blur-sm transition hover:bg-white/40 hover:border-emerald-300 hover:text-emerald-700 dark:border-white/15 dark:bg-white/8 dark:text-stone-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
          >
            Show {Math.min(remainingCount, DEFAULT_VISIBLE)} more
            <span className="ml-1 text-stone-400 dark:text-stone-500">
              ({remainingCount} remaining)
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
