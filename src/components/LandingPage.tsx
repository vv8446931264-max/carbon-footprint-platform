import { HeroSection } from "./landing/HeroSection";
import { StatsSection } from "./landing/StatsSection";
import { FeaturesSection } from "./landing/FeaturesSection";
import { HowItWorksSection } from "./landing/HowItWorksSection";
import { CTASection } from "./landing/CTASection";

interface LandingPageProps {
  /** Reveal the dashboard in place when the visitor chooses to start. */
  onStart: () => void;
}

/**
 * Marketing landing page shown before the dashboard. Composes the hero, stats,
 * features, how-it-works, and CTA sections; each lives in `./landing/*`. The
 * CTAs reveal the dashboard in place via `onStart`.
 */
export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div
      id="main-content"
      tabIndex={-1}
      className="relative min-h-screen bg-[#080F0B] text-white outline-none"
    >
      {/* Global gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#080F0B] via-[#0B1A12] to-[#0A1510]" />

      <HeroSection onStart={onStart} />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection onStart={onStart} />

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-white/60">
        <p>
          Built with Next.js, Vertex AI, and Tailwind CSS. Deployed on Google
          Cloud Run.
        </p>
        <p className="mt-1">
          <a
            href="https://github.com/vv8446931264-max/carbon-footprint-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400/90 hover:text-emerald-400"
          >
            View source on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
