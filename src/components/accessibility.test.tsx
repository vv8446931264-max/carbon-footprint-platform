import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";
import type { LoggedActivity } from "@/types/activity";
import { ActivityList } from "./ActivityList";
import { ActivityLogger } from "./ActivityLogger";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { FootprintSummary } from "./FootprintSummary";
import { ReceiptUpload } from "./ReceiptUpload";

expect.extend(toHaveNoViolations);

const sampleEntries: LoggedActivity[] = [
  {
    id: "1",
    loggedAt: "2026-06-01T08:00:00.000Z",
    description: "Drove 20 km in a petrol car",
    activity: { category: "transport", mode: "car_petrol", distanceKm: 20 },
    emissionsKgCo2e: 3.84,
  },
  {
    id: "2",
    loggedAt: "2026-06-01T12:00:00.000Z",
    description: "Beef burger for lunch",
    activity: { category: "food", food: "beef", quantityKg: 0.2 },
    emissionsKgCo2e: 5.4,
  },
];

/**
 * Automated WCAG checks with axe-core. These catch a meaningful class of
 * regressions (missing labels, bad contrast, invalid ARIA) on every CI run,
 * complementing the manual semantic-HTML/ARIA work in the components.
 *
 * Coverage deliberately includes the *interactive* components (form, file
 * upload), not just the read-only ones — that's where label/role regressions
 * actually happen.
 */
describe("accessibility (axe)", () => {
  it("FootprintSummary has no detectable violations", async () => {
    const { container } = render(
      <FootprintSummary totalKgCo2e={42.5} periodDays={30} totalCostUsd={88} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ActivityList has no detectable violations", async () => {
    const { container } = render(<ActivityList entries={sampleEntries} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("CategoryBreakdown (with data) has no detectable violations", async () => {
    const { container } = render(
      <CategoryBreakdown
        totals={[
          { category: "transport", kgCo2e: 3.84 },
          { category: "food", kgCo2e: 5.4 },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ActivityLogger (interactive form) has no detectable violations", async () => {
    const { container } = render(<ActivityLogger onLog={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ReceiptUpload (file input) has no detectable violations", async () => {
    const { container } = render(<ReceiptUpload onLogMany={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
