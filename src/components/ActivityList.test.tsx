import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityList } from "./ActivityList";
import type { LoggedActivity } from "@/types/activity";

function entry(overrides: Partial<LoggedActivity> = {}): LoggedActivity {
  return {
    id: "1",
    loggedAt: new Date("2026-01-01T10:00:00Z").toISOString(),
    description: "Drove 100km to a conference",
    activity: { category: "transport", mode: "car_petrol", distanceKm: 100 },
    emissionsKgCo2e: 19.2,
    ...overrides,
  };
}

describe("ActivityList", () => {
  it("shows an empty state when there are no entries", () => {
    render(<ActivityList entries={[]} />);
    expect(screen.getByText(/nothing logged yet/i)).toBeInTheDocument();
  });

  it("renders an entry with its description and emissions", () => {
    render(<ActivityList entries={[entry()]} />);
    expect(screen.getByText("Drove 100km to a conference")).toBeInTheDocument();
    expect(screen.getByText(/19\.20 kg CO₂e/)).toBeInTheDocument();
  });

  it("shows a swap suggestion for high-carbon transport modes", () => {
    render(<ActivityList entries={[entry()]} />);
    expect(screen.getByText(/swap car petrol for train/i)).toBeInTheDocument();
  });

  it("does not show a swap suggestion when no lower-carbon alternative exists", () => {
    render(
      <ActivityList
        entries={[
          entry({
            id: "2",
            description: "Cycled to the store",
            activity: { category: "transport", mode: "bike", distanceKm: 5 },
            emissionsKgCo2e: 0,
          }),
        ]}
      />,
    );
    expect(screen.queryByText(/swap/i)).not.toBeInTheDocument();
  });
});
