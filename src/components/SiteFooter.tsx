import { Leaf, Lock } from "lucide-react";

/**
 * Footer with credibility + trust signals: data sources, a privacy note, and
 * attribution. Small touches like this read as "real product" rather than demo.
 */
export function SiteFooter() {
  return (
    <footer className="mt-4 w-full border-t border-stone-200/70 dark:border-stone-800/70">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-xs text-stone-500 dark:text-stone-400 sm:px-8">
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
          <Leaf
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span className="font-semibold">Carbon Coach</span>
        </div>

        <p className="max-w-2xl">
          Emission factors are published averages (DEFRA / EPA-style) and the ~2
          t CO₂e/year goal reflects a science-based, Paris-aligned per-capita
          target. Figures are directional estimates, not an audited inventory.
          See <em>“How we calculate this”</em> above.
        </p>

        <p className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Your activity log is stored only in your browser (localStorage).
          Nothing is uploaded except the text or image you choose to analyse.
        </p>

        <p className="text-stone-400 dark:text-stone-500">
          Built for the Carbon Footprint Awareness challenge · Powered by Google
          Cloud Vertex AI (Gemini).
        </p>
      </div>
    </footer>
  );
}
