"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Counter, Section, TiltCard } from "./primitives";
import { STATS } from "./data";

/** Three tilt-card stats with count-up numbers framing the problem. */
export function StatsSection() {
  return (
    <Section className="relative z-10 mx-auto max-w-5xl px-4 py-24">
      <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">
        The Numbers That Matter
      </h2>
      <p className="mx-auto mb-16 max-w-lg text-center text-2xl font-bold text-white/90">
        Understanding your impact is the first step
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
          >
            <TiltCard className="perspective-1000">
              <div
                className={`group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/8 hover:shadow-xl ${stat.glow}`}
              >
                <div
                  className={`mb-4 inline-block rounded-xl bg-gradient-to-br ${stat.color} p-3 shadow-lg ${stat.glow}`}
                >
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <p className="text-4xl font-bold text-white">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm font-semibold text-white/80">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs text-white/50">{stat.desc}</p>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
