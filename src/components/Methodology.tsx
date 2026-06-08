import { BookOpen } from "lucide-react";

/**
 * "How we calculate this" disclosure. Credible carbon calculators are judged
 * heavily on **methodology transparency** — being explicit about factors,
 * sources, and limitations builds trust and sets honest expectations. It also
 * doubles as a guardrail against over-claiming precision.
 *
 * Implemented as a native <details> so it's keyboard-accessible and needs no
 * JavaScript to expand/collapse.
 */
export function Methodology() {
  return (
    <details className="group rounded-2xl border border-stone-200 bg-white/70 p-5 dark:border-stone-800 dark:bg-stone-900/60">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700 marker:content-none dark:text-stone-200">
        <BookOpen
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        How we calculate this
        <span className="ml-auto text-xs text-stone-400 transition group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="mt-4 space-y-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
        <p>
          Each activity is converted to kg CO₂e using published average{" "}
          <strong>emission factors</strong> (DEFRA / EPA-style figures):
          transport per km, energy per kWh, food per kg, shopping per dollar of
          spend, and waste per kg. The maths is deterministic and lives in a
          small, fully unit-tested engine. The AI is used only to turn your free
          text or a receipt photo into structured data, never to invent the
          numbers.
        </p>
        <p>
          Your progress is measured against a{" "}
          <strong>science-based target of ~2 tonnes CO₂e per year</strong>, the
          per-person level broadly consistent with keeping warming well below 2
          °C. It is a more meaningful goal than simply beating today&apos;s
          global average of ~4.7 t/year.
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          <strong>Limitations:</strong> these are illustrative averages, not
          region- or product-specific lifecycle figures, so treat results as a
          directional guide rather than an audited inventory. Factors are
          centralised in <code>lib/emissions/factors.ts</code> and easy to
          refine with localised data.
        </p>
      </div>
    </details>
  );
}
