import { Car, Home, TreePine, Plane } from "lucide-react";

interface EmissionEquivalenciesProps {
  kgCo2e: number;
}

const EQUIVALENCIES = [
  { Icon: Car, label: "km driven (petrol)", factor: 0.192 },
  { Icon: TreePine, label: "trees needed for a year", factor: 21 },
  { Icon: Home, label: "days of home electricity", factor: 8.2 },
  { Icon: Plane, label: "km flown (domestic)", factor: 0.255 },
] as const;

export function EmissionEquivalencies({ kgCo2e }: EmissionEquivalenciesProps) {
  if (kgCo2e < 0.01) return null;

  return (
    <div
      aria-label="Emission equivalencies"
      className="grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-4 dark:bg-stone-800/50 sm:grid-cols-4"
    >
      {EQUIVALENCIES.map(({ Icon, label, factor }) => {
        const value = kgCo2e / factor;
        return (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <Icon className="h-5 w-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
            <span className="text-lg font-bold tabular-nums text-stone-900 dark:text-stone-50">
              {value < 1 ? value.toFixed(1) : Math.round(value).toLocaleString()}
            </span>
            <span className="text-xs leading-tight text-stone-500 dark:text-stone-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
