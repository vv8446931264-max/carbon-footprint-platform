import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";
import type { CoachReport } from "@/types/ai";
import { CoachReportCard } from "./CoachReportCard";
import { SmartSwapCarousel } from "./SmartSwapCarousel";
import { ProjectedImpactChart } from "./ProjectedImpactChart";

expect.extend(toHaveNoViolations);

const report: CoachReport = {
  summary: "Your footprint is on a good track this month.",
  encouragement: "Keep it up!",
  tips: ["Walk short trips", "Try a veg meal twice a week"],
};

/**
 * Axe coverage for the coach hub's extracted pieces. The report card is the
 * highest-churn surface (four render states), so all four are checked.
 */
describe("coach components (axe)", () => {
  it("CoachReportCard — empty state", async () => {
    const { container } = render(
      <CoachReportCard
        status="idle"
        report={null}
        errorMessage={null}
        hasEntries={false}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("CoachReportCard — populated report", async () => {
    const { container } = render(
      <CoachReportCard
        status="idle"
        report={report}
        errorMessage={null}
        hasEntries
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("CoachReportCard — error state", async () => {
    const { container } = render(
      <CoachReportCard
        status="error"
        report={null}
        errorMessage="Something went wrong."
        hasEntries
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SmartSwapCarousel", async () => {
    const { container } = render(<SmartSwapCarousel onApplySwap={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ProjectedImpactChart — empty state", async () => {
    const { container } = render(
      <ProjectedImpactChart hasEntries={false} totalKgCo2e={0} periodDays={30} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
