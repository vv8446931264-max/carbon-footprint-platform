import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LoggedActivity } from "@/types/activity";
import { RecentActivity } from "./RecentActivity";

function transport(id: string, description: string, km: number, kg: number): LoggedActivity {
  return {
    id,
    loggedAt: `2026-06-0${id}T08:00:00.000Z`,
    description,
    activity: { category: "transport", mode: "car_petrol", distanceKm: km },
    emissionsKgCo2e: kg,
  };
}

function food(id: string, description: string, kg: number): LoggedActivity {
  return {
    id,
    loggedAt: `2026-06-0${id}T12:00:00.000Z`,
    description,
    activity: { category: "food", food: "chicken", quantityKg: 0.3 },
    emissionsKgCo2e: kg,
  };
}

// Seven entries so pagination (5 visible) and the filters have something to do.
const entries: LoggedActivity[] = [
  transport("1", "drove to office", 14, 2.9),
  food("2", "chicken biryani for lunch", 9.0),
  transport("3", "drove to market", 8, 1.6),
  food("4", "paneer tikka dinner", 1.2),
  transport("5", "drove to airport", 30, 6.1),
  food("6", "veg biryani", 0.8),
  transport("7", "drove kids to school", 5, 1.0),
];

function setup(overrides: Partial<Parameters<typeof RecentActivity>[0]> = {}) {
  const props = {
    recentEntries: entries,
    onDelete: vi.fn(),
    onSelectExample: vi.fn(),
    onExport: vi.fn(),
    onClearAll: vi.fn(),
    ...overrides,
  };
  render(<RecentActivity {...props} />);
  return props;
}

describe("RecentActivity", () => {
  it("paginates: shows the first five, then the rest on 'Show more'", () => {
    setup();
    expect(screen.getByText("drove to office")).toBeInTheDocument();
    // The 7th entry is hidden until expanded.
    expect(screen.queryByText("drove kids to school")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show 2 more/i }));
    expect(screen.getByText("drove kids to school")).toBeInTheDocument();
  });

  it("filters by search text", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText(/search activities/i), {
      target: { value: "biryani" },
    });
    expect(screen.getByText("chicken biryani for lunch")).toBeInTheDocument();
    expect(screen.getByText("veg biryani")).toBeInTheDocument();
    expect(screen.queryByText("drove to office")).not.toBeInTheDocument();
  });

  it("filters by category", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/filter by category/i), {
      target: { value: "food" },
    });
    expect(screen.getByText("chicken biryani for lunch")).toBeInTheDocument();
    expect(screen.queryByText("drove to office")).not.toBeInTheDocument();
  });

  it("sorts by highest emissions", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/sort activities/i), {
      target: { value: "emissions" },
    });
    // First listed entry should be the 9.0 kg biryani.
    const list = screen.getByRole("list");
    const firstItem = within(list).getAllByRole("listitem")[0];
    expect(firstItem).toHaveTextContent("chicken biryani for lunch");
  });

  it("requires confirmation before clearing, then calls onClearAll", () => {
    const { onClearAll } = setup();
    fireEvent.click(screen.getByRole("button", { name: /^clear all$/i }));
    // Confirmation appears; nothing cleared yet.
    expect(onClearAll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^clear all$/i }));
    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it("fires onExport from the export control", () => {
    const { onExport } = setup();
    fireEvent.click(screen.getByRole("button", { name: /export/i }));
    expect(onExport).toHaveBeenCalledOnce();
  });
});
