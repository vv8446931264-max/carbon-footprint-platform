import { Lightbulb, Sprout } from "lucide-react";
import type { LoggedActivity } from "@/types/activity";
import { suggestSwap } from "@/lib/emissions/compare";
import { estimateCostUsd } from "@/lib/emissions/cost";
import { CATEGORY_VISUALS } from "@/lib/ui/categories";

interface ActivityListProps {
  entries: LoggedActivity[];
}

/**
 * Recent-activity feed. Each entry that has a lower-carbon alternative shows an
 * inline "swap" suggestion with a quantified carbon AND cash saving — the
 * what-if simulator surfaced contextually rather than as a separate page.
 */
export function ActivityList({ entries }: ActivityListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/50 px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900/40">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Sprout className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Nothing logged yet. Describe an activity or scan a receipt above to
          get started.
        </p>
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
              <span className="flex flex-col items-end whitespace-nowrap text-right">
                <span className="text-sm font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                  {entry.emissionsKgCo2e.toFixed(2)} kg CO₂e
                </span>
                {costUsd > 0 && (
                  <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">
                    ≈ ${costUsd.toFixed(2)}
                  </span>
                )}
              </span>
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
