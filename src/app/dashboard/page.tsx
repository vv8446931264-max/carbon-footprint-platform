import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Log activities, scan receipts, and track your carbon footprint against a science-based 2-tonne target.",
};

/** The app itself at `/dashboard`. Reached from the landing page's CTAs. */
export default function DashboardPage() {
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
