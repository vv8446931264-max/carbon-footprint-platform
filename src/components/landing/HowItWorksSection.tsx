"use client";

import { motion } from "framer-motion";
import { Section } from "./primitives";
import { STEPS } from "./data";

/** Three-step pipeline whose cards rotate in from a slight 3D angle on scroll. */
export function HowItWorksSection() {
  return (
    <Section
      className="relative z-10 mx-auto max-w-5xl px-4 py-24"
      id="how-it-works"
    >
      <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">
        How It Works
      </h2>
      <p className="mx-auto mb-16 max-w-lg text-center text-2xl font-bold text-white/90">
        Three steps to a lighter footprint
      </p>
      <div className="relative grid gap-8 md:grid-cols-3">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent md:block" />

        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, rotateY: -15 }}
            whileInView={{ opacity: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2, duration: 0.7 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <span className="mb-2 block text-xs font-bold tracking-widest text-emerald-400">
                STEP {step.num}
              </span>
              <h3 className="text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {step.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
