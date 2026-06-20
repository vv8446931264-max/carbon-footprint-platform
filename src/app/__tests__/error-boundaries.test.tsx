import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
// Imported under non-`Error` names so they don't shadow the global Error
// constructor we use to build the `error` prop below.
import ErrorBoundary from "../error";
import GlobalErrorBoundary from "../global-error";

describe("Route error boundary (app/error.tsx)", () => {
  it("renders a reassuring recovery message and a retry button", () => {
    render(<ErrorBoundary error={new Error("boom")} reset={() => {}} />);

    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
    // The user's data-safety reassurance is the whole point of the boundary.
    expect(
      screen.getByText(/your logged activities are safe/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("calls reset() when the retry button is clicked", () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("Global error boundary (app/global-error.tsx)", () => {
  it("renders a last-resort message and a reload button", () => {
    render(
      <GlobalErrorBoundary error={new Error("fatal")} reset={() => {}} />,
    );

    expect(
      screen.getByRole("heading", { name: /unexpected error/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reload the app/i }),
    ).toBeInTheDocument();
  });

  it("calls reset() when the reload button is clicked", () => {
    const reset = vi.fn();
    render(<GlobalErrorBoundary error={new Error("fatal")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /reload the app/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
