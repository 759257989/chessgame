import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GamePage } from "./GamePage";
import { staticPlayerView } from "./staticView";

const illegalMoveView = {
  ...staticPlayerView,
  events: [
    {
      id: "illegal-1",
      type: "illegal_move",
      message: "That move did not succeed. Your turn is over.",
      createdAt: "2026-05-13T12:00:00.000Z"
    },
    ...staticPlayerView.events
  ]
};

const captureView = {
  ...staticPlayerView,
  events: [
    {
      id: "capture-1",
      type: "opponent_capture",
      message: "Your piece was captured on e4.",
      createdAt: "2026-05-13T12:01:00.000Z"
    },
    ...staticPlayerView.events
  ]
};

afterEach(() => {
  vi.useRealTimers();
});

describe("GamePage", () => {
  it("renders board, timers, turn message, and sensed fixture state", () => {
    render(<GamePage view={staticPlayerView} />);

    expect(screen.getByLabelText("Chess board")).toBeInTheDocument();
    expect(screen.getByText("Your turn to sense")).toBeInTheDocument();
    expect(screen.getByText(/You have/)).toBeInTheDocument();
    expect(screen.getByText(/Opponent has/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "g5, black knight, in highlighted sense area" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "f4, known empty from sense, in highlighted sense area" })).toBeInTheDocument();
  });

  it("shows a centered dismissible notice when a move attempt fails", () => {
    render(<GamePage view={illegalMoveView} />);

    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent("Move failed");
    expect(notice).toHaveTextContent("That move did not succeed. Your turn is over.");

    fireEvent.click(screen.getByRole("button", { name: "Dismiss move failure notice" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("automatically hides the move failure notice after ten seconds", () => {
    vi.useFakeTimers();
    render(<GamePage view={illegalMoveView} />);

    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("highlights the captured square without showing a capture notice", () => {
    render(<GamePage view={captureView} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "e4, empty, recently captured piece square" })).toBeInTheDocument();
  });

  it("automatically hides the captured square highlight after three seconds", () => {
    vi.useFakeTimers();
    render(<GamePage view={captureView} />);

    expect(screen.getByRole("button", { name: "e4, empty, recently captured piece square" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.getByRole("button", { name: "e4, empty" })).toBeInTheDocument();
  });
});
