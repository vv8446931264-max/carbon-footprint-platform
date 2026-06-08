import {
  Car,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ActivityCategory } from "@/types/activity";

/**
 * Centralised, design-system-style mapping of each activity category to its
 * icon, label, accent colour, and chart colour. Keeping this in one place
 * (rather than re-declaring emoji maps in every component) is what keeps the
 * visual language consistent across the app.
 */
interface CategoryVisual {
  label: string;
  Icon: LucideIcon;
  /** Tailwind classes for a tinted icon "chip" (bg + foreground). */
  chip: string;
  /** Hex used for the bar chart, matched to the chip hue. */
  chartColor: string;
}

export const CATEGORY_VISUALS: Record<ActivityCategory, CategoryVisual> = {
  transport: {
    label: "Transport",
    Icon: Car,
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    chartColor: "#0284c7",
  },
  energy: {
    label: "Energy",
    Icon: Zap,
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    chartColor: "#d97706",
  },
  food: {
    label: "Food",
    Icon: UtensilsCrossed,
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    chartColor: "#e11d48",
  },
  shopping: {
    label: "Shopping",
    Icon: ShoppingBag,
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    chartColor: "#7c3aed",
  },
  waste: {
    label: "Waste",
    Icon: Trash2,
    chip: "bg-stone-200 text-stone-700 dark:bg-stone-500/15 dark:text-stone-300",
    chartColor: "#78716c",
  },
};

export const CATEGORY_LABELS: Record<ActivityCategory, string> =
  Object.fromEntries(
    (Object.keys(CATEGORY_VISUALS) as ActivityCategory[]).map((key) => [
      key,
      CATEGORY_VISUALS[key].label,
    ]),
  ) as Record<ActivityCategory, string>;
