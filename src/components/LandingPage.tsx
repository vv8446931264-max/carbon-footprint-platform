"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  Leaf,
  Brain,
  Camera,
  ArrowRightLeft,
  TrendingDown,
  Trophy,
  ShieldCheck,
  ChevronDown,
  Zap,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Particles Background                                               */
/* ------------------------------------------------------------------ */

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number;
      y: number;
      r: number;
      dx: number;
      dy: number;
      o: number;
    }[] = [];
    const COUNT = 60;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        o: Math.random() * 0.5 + 0.1,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas!.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas!.height) p.dy *= -1;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(52, 211, 153, ${p.o})`;
        ctx!.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(52, 211, 153, ${0.08 * (1 - dist / 120)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  3D Tilt Card                                                       */
/* ------------------------------------------------------------------ */

function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 20,
  });

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      x.set((e.clientX - rect.left) / rect.width - 0.5);
      y.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [x, y],
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();
    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target * 10) / 10;
      setCount(start);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [inView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toFixed(1)}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper with scroll reveal                                 */
/* ------------------------------------------------------------------ */

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 1 — Hero                                                   */
/* ------------------------------------------------------------------ */

function HeroSection({ onStart }: { onStart: () => void }) {
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
        className="relative z-10 mt-16 flex items-center gap-3 text-xs text-emerald-300/50"
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

/* ------------------------------------------------------------------ */
/*  SECTION 2 — Stats                                                  */
/* ------------------------------------------------------------------ */

const STATS = [
  {
    value: 2.0,
    suffix: "t/yr",
    label: "Paris-Aligned Target",
    desc: "Science-based goal to keep warming below 2°C",
    color: "from-emerald-500 to-emerald-600",
    glow: "shadow-emerald-500/20",
  },
  {
    value: 4.5,
    suffix: "t/yr",
    label: "Urban India Average",
    desc: "Typical emissions for urban middle-class households",
    color: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
  },
  {
    value: 60.0,
    suffix: "%",
    label: "Reduction Possible",
    desc: "With smart swaps and conscious daily choices",
    color: "from-cyan-500 to-blue-500",
    glow: "shadow-cyan-500/20",
  },
];

function StatsSection() {
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

/* ------------------------------------------------------------------ */
/*  SECTION 3 — Features Bento Grid                                    */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Brain,
    title: "AI Coach",
    desc: "Personalized reports powered by Vertex AI with specific tips tied to your actual data",
    span: "md:col-span-2",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    icon: Camera,
    title: "Receipt Scanner",
    desc: "Snap a photo of any receipt. AI extracts items and calculates emissions instantly",
    span: "",
    accent: "from-violet-500 to-purple-500",
  },
  {
    icon: ArrowRightLeft,
    title: "Smart Swaps",
    desc: "Get greener alternatives that are often cheaper too",
    span: "",
    accent: "from-cyan-500 to-blue-500",
  },
  {
    icon: TrendingDown,
    title: "Trend Tracking",
    desc: "See your annualized pace against the 2t/yr Paris target with projected impact charts",
    span: "md:col-span-2",
    accent: "from-amber-500 to-orange-500",
  },
  {
    icon: Trophy,
    title: "Achievements",
    desc: "Unlock badges, build streaks, and celebrate milestones",
    span: "",
    accent: "from-pink-500 to-rose-500",
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    desc: "All data stays in your browser. No account needed. No tracking",
    span: "md:col-span-2",
    accent: "from-emerald-600 to-green-500",
  },
];

function FeaturesSection() {
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
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-0 blur-3xl transition-opacity group-hover:opacity-20" style={{backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`}} />
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

/* ------------------------------------------------------------------ */
/*  SECTION 4 — How It Works                                           */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    num: "01",
    title: "Describe Your Activity",
    desc: "Type in plain language: \"drove 15 km to office\" or \"had chicken biryani for lunch\". Or snap a receipt photo.",
    icon: Zap,
  },
  {
    num: "02",
    title: "AI Analyzes Instantly",
    desc: "Gemini 2.5 Flash parses your input, extracts structured data, and a deterministic engine computes kg CO₂e.",
    icon: Brain,
  },
  {
    num: "03",
    title: "Get Personalized Insights",
    desc: "See your pace vs the 2t/yr target, get specific swaps, track trends, and earn achievements.",
    icon: Sparkles,
  },
];

function HowItWorksSection() {
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

/* ------------------------------------------------------------------ */
/*  SECTION 5 — CTA                                                    */
/* ------------------------------------------------------------------ */

function CTASection({ onStart }: { onStart: () => void }) {
  return (
    <Section className="relative z-10 mx-auto max-w-4xl px-4 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 p-12 text-center backdrop-blur-2xl sm:p-16">
        <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />
        <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
          Ready to make a difference?
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-white/60">
          Join thousands tracking their footprint. No sign-up required.
          Your data stays private in your browser.
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

/* ------------------------------------------------------------------ */
/*  Main Landing Page Export                                           */
/* ------------------------------------------------------------------ */

export function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative min-h-screen bg-[#080F0B] text-white">
      {/* Global gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#080F0B] via-[#0B1A12] to-[#0A1510]" />

      <HeroSection onStart={onStart} />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection onStart={onStart} />

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-white/30">
        <p>
          Built with Next.js, Vertex AI, and Tailwind CSS. Deployed on Google
          Cloud Run.
        </p>
        <p className="mt-1">
          <a
            href="https://github.com/vv8446931264-max/carbon-footprint-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400/50 hover:text-emerald-400"
          >
            View source on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
