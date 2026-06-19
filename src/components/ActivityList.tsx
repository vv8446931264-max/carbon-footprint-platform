import { Lightbulb, Search, Trash2 } from "lucide-react";
import type { LoggedActivity } from "@/types/activity";
import { suggestSwap } from "@/lib/emissions/compare";
import { estimateCostUsd } from "@/lib/emissions/cost";
import { CATEGORY_VISUALS } from "@/lib/ui/categories";
import { EmptyState } from "./EmptyState";

interface ActivityListProps {
  entries: LoggedActivity[];
  onDelete?: (id: string) => void;
  /** When provided, empty state shows quick-action chips that fill this text. */
  onSelectExample?: (text: string) => void;
  /** Non-empty means a search filter is active and returned no results. */
  isFiltered?: boolean;
}

export function ActivityList({ entries, onDelete, onSelectExample, isFiltered }: ActivityListProps) {
  if (entries.length === 0) {
    if (isFiltered) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/50 px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900/40">
          <Search className="h-8 w-8 text-stone-300 dark:text-stone-600" aria-hidden="true" />
          <p className="text-sm text-stone-500 dark:text-stone-400">No activities match your search.</p>
        </div>
      );
    }
    if (onSelectExample) {
      return <EmptyState onSelectExample={onSelectExample} />;
    }
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/50 px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900/40">
        <p className="text-sm text-stone-500 dark:text-stone-400">Nothing logged yet.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => {
        const swap = suggestSwap(entry.activity);
        const costUsd = estimateCostUsd(entry.activity);
        const { Icon, chip } = CATEGORY_VISUALS[entry.activity.category];
        return (
          <li
            key={entry.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${chip}`}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {entry.description}
                  </p>
                  <time
                    dateTime={entry.loggedAt}
                    className="text-xs text-stone-500 dark:text-stone-400"
                  >
                    {new Date(entry.loggedAt).toLocaleString()}
                  </time>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="flex flex-col items-end whitespace-nowrap text-right">
                  <span className="text-sm font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                    {entry.emissionsKgCo2e.toFixed(2)} kg CO₂e
                  </span>
                  <span className="flex items-center gap-1.5">
                    {entry.confidence && (
                      <span
                        title={
                          entry.confidence === "high" ? "High confidence estimate" :
                          entry.confidence === "medium" ? "Medium confidence, some details estimated" :
                          "Low confidence, rough estimate"
                        }
                        className={`inline-block h-2 w-2 rounded-full ${
                          entry.confidence === "high" ? "bg-emerald-500" :
                          entry.confidence === "medium" ? "bg-amber-400" :
                          "bg-rose-400"
                        }`}
                        aria-label={`${entry.confidence} confidence`}
                      />
                    )}
                    {costUsd > 0 && (
                      <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">
                        ≈ ${costUsd.toFixed(2)}
                      </span>
                    )}
                  </span>
                </span>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    aria-label={`Remove “${entry.description}”`}
                    className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-stone-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {swap && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
                <Lightbulb
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {swap.label}: save about{" "}
                  <strong>
                    {swap.savingsKgCo2e.toFixed(2)} kg CO₂e (
                    {swap.savingsPercent.toFixed(0)}%)
                  </strong>
                  {swap.costSavingUsd > 0 && (
                    <>
                      {" "}
                      and roughly{" "}
                      <strong>${swap.costSavingUsd.toFixed(2)}</strong>
                    </>
                  )}{" "}
                  on this trip.
                </span>
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
