"use client";

import { Zap } from "lucide-react";
import { Section } from "./primitives";

interface CTASectionProps {
  /** Enter the app (advance from landing page to the dashboard). */
  onStart: () => void;
}

/** Closing call-to-action card that drops the visitor into the dashboard. */
export function CTASection({ onStart }: CTASectionProps) {
  return (
    <Section className="relative z-10 mx-auto max-w-4xl px-4 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 p-12 text-center backdrop-blur-2xl sm:p-16">
        <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />
        <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
          Ready to make a difference?
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-white/60">
          Join thousands tracking their footprint. No sign-up required. Your
          data stays private in your browser.
        </p>
        <button
          onClick={onStart}
          className="group relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-10 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-500/20 transition-all hover:shadow-2xl hover:shadow-emerald-500/30"
        >
          <Zap className="h-5 w-5" />
          Start Tracking Now
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>
    </Section>
  );
}
