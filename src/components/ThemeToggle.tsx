"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  isThemePreference,
  nextPreference,
  resolveEffectiveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme/theme";

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;
const LABELS = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
} as const;

/** Applies the effective light/dark class to <html> for a given preference. */
function applyPreference(preference: ThemePreference) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effective = resolveEffectiveTheme(preference, systemDark);
  document.documentElement.classList.toggle("dark", effective === "dark");
}

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "system";
}

/** Server (and first hydration) render: no storage access, assume "system". */
function getServerSnapshot(): ThemePreference {
  return "system";
}

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  // In "system" mode, track live OS theme changes and re-apply the class.
  const onMedia = () => {
    applyPreference(readPreference());
    onChange();
  };
  window.addEventListener("storage", onChange);
  media.addEventListener("change", onMedia);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
    media.removeEventListener("change", onMedia);
  };
}

function setPreference(preference: ThemePreference) {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyPreference(preference);
  listeners.forEach((listener) => listener());
}

/**
 * Light / dark / system theme switch. State lives in localStorage (an external
 * store), read via useSyncExternalStore so it stays in sync without effects and
 * hydrates cleanly (server assumes "system"). The actual class is applied
 * before paint by the inline script in layout.tsx, so there's no flash on load.
 */
export function ThemeToggle() {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    getServerSnapshot,
  );

  const Icon = ICONS[preference];
  const label = `${LABELS[preference]}. Click to change.`;

  return (
    <button
      type="button"
      onClick={() => setPreference(nextPreference(preference))}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
