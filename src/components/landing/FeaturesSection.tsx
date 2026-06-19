"use client";

import { motion } from "framer-motion";
import { Section } from "./primitives";
import { FEATURES } from "./data";

/** Bento grid of feature cards that reveal as they scroll into view. */
export function FeaturesSection() {
  return (
    <Section className="relative z-10 mx-auto max-w-5xl px-4 py-24" id="features">
      <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">
        Everything You Need
      </h2>
      <p className="mx-auto mb-16 max-w-lg text-center text-2xl font-bold text-white/90">
        Powerful tools, simple experience
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className={f.span}
          >
            <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/8">
              <div
                className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-0 blur-3xl transition-opacity group-hover:opacity-20"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                }}
              />
              <div
                className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${f.accent} p-2.5`}
              >
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {f.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
