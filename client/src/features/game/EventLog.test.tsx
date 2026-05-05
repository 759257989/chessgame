import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EventLog } from "./EventLog";
import type { GameEventView } from "./types";

const events: GameEventView[] = [
  {
    id: "event-new",
    type: "sense_prompt",
    message: "Your turn to sense.",
    createdAt: "2026-05-04T21:00:02.000Z"
  },
  {
    id: "event-old-1",
    type: "opponent_move",
    message: "Opponent moved.",
    createdAt: "2026-05-04T21:00:01.000Z"
  },
  {
    id: "event-old-2",
    type: "move",
    message: "Move played: e2e4.",
    createdAt: "2026-05-04T21:00:00.000Z"
  }
];

afterEach(() => {
  cleanup();
});

describe("EventLog", () => {
  it("shows only the newest event by default and expands older history on demand", () => {
    render(<EventLog events={events} />);

    expect(screen.getByText("Your turn to sense.")).toBeInTheDocument();
    expect(screen.queryByText("Opponent moved.")).not.toBeInTheDocument();
    expect(screen.queryByText("Move played: e2e4.")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Show 2 older events" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(screen.getByText("Opponent moved.")).toBeInTheDocument();
    expect(screen.getByText("Move played: e2e4.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide older events" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("does not render a history toggle for a single event", () => {
    render(<EventLog events={[events[0]]} />);

    expect(screen.getByText("Your turn to sense.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /older events/i })).not.toBeInTheDocument();
  });
});
