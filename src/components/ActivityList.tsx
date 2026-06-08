import type { LoggedActivity } from "@/types/activity";
import { suggestSwap } from "@/lib/emissions/compare";

interface ActivityListProps {
  entries: LoggedActivity[];
}

const CATEGORY_ICON: Record<LoggedActivity["activity"]["category"], string> = {
  transport: "🚗",
  energy: "⚡",
  food: "🍽️",
  shopping: "🛍️",
  waste: "🗑️",
};

/**
 * Recent-activity feed. Each entry that has a lower-carbon alternative
 * shows an inline "swap" suggestion with a quantified saving — this is
 * the "what-if simulator" surfaced contextually rather than as a separate page.
 */
export function ActivityList({ entries }: ActivityListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Nothing logged yet. Describe an activity above to get started.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => {
        const swap = suggestSwap(entry.activity);
        return (
          <li
            key={entry.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="text-xl leading-none">
                  {CATEGORY_ICON[entry.activity.category]}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {entry.description}
                  </p>
                  <time
                    dateTime={entry.loggedAt}
                    className="text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    {new Date(entry.loggedAt).toLocaleString()}
                  </time>
                </div>
              </div>
              <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {entry.emissionsKgCo2e.toFixed(2)} kg CO₂e
              </span>
            </div>

            {swap && (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                💡 {swap.label}: save about{" "}
                <strong>
                  {swap.savingsKgCo2e.toFixed(2)} kg CO₂e (
                  {swap.savingsPercent.toFixed(0)}%)
                </strong>{" "}
                on this trip.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
