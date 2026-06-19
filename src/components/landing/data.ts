import {
  ArrowRightLeft,
  Brain,
  Camera,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface Stat {
  value: number;
  suffix: string;
  label: string;
  desc: string;
  /** Tailwind gradient classes for the icon chip. */
  color: string;
  /** Tailwind shadow-glow class shared by the card and chip. */
  glow: string;
}

/** Headline numbers shown in the landing page stats section. */
export const STATS: Stat[] = [
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

export interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  /** Optional grid column span class for the bento layout. */
  span: string;
  /** Tailwind gradient classes for the icon chip. */
  accent: string;
}

/** Feature cards for the landing page bento grid. */
export const FEATURES: Feature[] = [
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

export interface Step {
  num: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

/** The three steps shown in the "How It Works" section. */
export const STEPS: Step[] = [
  {
    num: "01",
    title: "Describe Your Activity",
    desc: 'Type in plain language: "drove 15 km to office" or "had chicken biryani for lunch". Or snap a receipt photo.',
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
