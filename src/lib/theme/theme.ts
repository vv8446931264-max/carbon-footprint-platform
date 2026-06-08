export type ThemePreference = "light" | "dark" | "system";

/** Order the toggle cycles through. */
export const THEME_ORDER: ThemePreference[] = ["system", "light", "dark"];

export const THEME_STORAGE_KEY = "carbon-footprint-theme:v1";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * Resolves a stored preference into the concrete light/dark to render,
 * interpreting "system" against the OS setting. Pure, so it's unit-testable
 * without a DOM.
 */
export function resolveEffectiveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): "light" | "dark" {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

/** The preference after one click of the cycle (system → light → dark → …). */
export function nextPreference(current: ThemePreference): ThemePreference {
  const index = THEME_ORDER.indexOf(current);
  return THEME_ORDER[(index + 1) % THEME_ORDER.length];
}
