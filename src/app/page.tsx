import { LandingPage } from "@/components/LandingPage";

/**
 * Marketing landing page at `/`. A server component — the interactive parts
 * (animations, the "Start Tracking" links to `/dashboard`) live in the client
 * components it composes, so the shell itself stays statically rendered.
 */
export default function Home() {
  return <LandingPage />;
}
