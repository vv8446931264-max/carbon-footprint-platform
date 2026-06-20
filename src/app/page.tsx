"use client";

import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { LandingPage } from "@/components/LandingPage";

/**
 * Single entry point. New visitors see the landing page; choosing "Start
 * Tracking" reveals the dashboard in place, so the carbon tool lives at the
 * root URL (no marketing-only secondary route).
 */
export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false);

  if (!showDashboard) {
    return <LandingPage onStart={() => setShowDashboard(true)} />;
  }

  return (
    <div className="flex flex-1 flex-col items-center">
      <main
        id="main-content"
        className="flex w-full flex-1 flex-col items-center"
      >
        <Dashboard />
      </main>
    </div>
  );
}
