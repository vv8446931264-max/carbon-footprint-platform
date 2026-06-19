"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Leaf, Zap } from "lucide-react";
import { Particles } from "./Particles";

interface HeroSectionProps {
  /** Enter the app (advance from landing page to the dashboard). */
  onStart: () => void;
}

/** Full-screen hero: floating logo, animated headline, CTA, and particle field. */
export function HeroSection({ onStart }: HeroSectionProps) {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <motion.div
      style={{ y: heroY, opacity: heroOpacity }}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4"
    >
      <Particles />

      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/8 blur-[100px]" />

      {/* Floating leaf logo */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 mb-8"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 shadow-2xl shadow-emerald-500/30">
          <Leaf className="h-12 w-12 text-white" />
        </div>
        <div className="absolute -inset-3 -z-10 animate-pulse rounded-3xl bg-emerald-500/20 blur-xl" />
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative z-10 bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-center text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl"
      >
        Track Your Carbon
        <br />
        Footprint
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="relative z-10 mx-auto mt-6 max-w-xl text-center text-lg text-emerald-100/70"
      >
        AI-powered sustainability coach for India. Log activities in plain
        language, scan receipts, and get personalized tips to reduce your
        impact.
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <button
          onClick={onStart}
          className="group relative overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Start Tracking — Free
          </span>
          <div className="absolute inset-0 -z-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
        <a
          href="#how-it-works"
          className="rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
        >
          See How It Works
        </a>
      </motion.div>

      {/* Powered by badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="relative z-10 mt-16 flex items-center gap-3 text-xs text-emerald-300/80"
      >
        <span>Powered by</span>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-300/70">
          Vertex AI
        </span>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-300/70">
          Next.js
        </span>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-300/70">
          Cloud Run
        </span>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 z-10"
      >
        <ChevronDown className="h-6 w-6 text-emerald-400/40" />
      </motion.div>
    </motion.div>
  );
}
