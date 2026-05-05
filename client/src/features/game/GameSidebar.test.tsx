import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { staticPlayerView } from "./staticView";
import { GameSidebar } from "./GameSidebar";
import type { PlayerView } from "./types";

function makeView(overrides: Partial<PlayerView> = {}): PlayerView {
  return {
    ...staticPlayerView,
    ...overrides,
    board: { ...staticPlayerView.board, ...overrides.board },
    clocks: { ...staticPlayerView.clocks, ...overrides.clocks },
    you: { ...staticPlayerView.you, ...overrides.you },
    opponent: { ...staticPlayerView.opponent, ...overrides.opponent },
    events: overrides.events ?? staticPlayerView.events,
    result: overrides.result === undefined ? staticPlayerView.result : overrides.result
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("GameSidebar", () => {
  it("calls onPass when the pass button is clicked during move phase", () => {
    const onPass = vi.fn();

    const { unmount } = render(<GameSidebar view={makeView({ phase: "move" })} onPass={onPass} />);

    fireEvent.click(screen.getByRole("button", { name: "Pass" }));

    expect(onPass).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("shows both player colors with matching chess icons", () => {
    const { unmount } = render(
      <GameSidebar
        view={makeView({
          you: { name: "You", color: "white" },
          opponent: { name: "random", color: "black" }
        })}
      />
    );

    expect(screen.getByLabelText("You, white")).toHaveTextContent("♔");
    expect(screen.getByLabelText("You, white")).toHaveTextContent("White");
    expect(screen.getByLabelText("random, black")).toHaveTextContent("♚");
    expect(screen.getByLabelText("random, black")).toHaveTextContent("Black");
    unmount();
  });

  it("calls onResign when the resign button is clicked during an active game", () => {
    const onResign = vi.fn();

    const { unmount } = render(<GameSidebar view={makeView({ status: "active" })} onResign={onResign} />);

    fireEvent.click(screen.getByRole("button", { name: "Resign" }));

    expect(onResign).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("calls onRepeatGame while active and after game over", () => {
    const onRepeatGame = vi.fn();

    const { rerender, unmount } = render(
      <GameSidebar view={makeView({ status: "active" })} onRepeatGame={onRepeatGame} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Repeat game" }));
    expect(onRepeatGame).toHaveBeenCalledTimes(1);

    rerender(
      <GameSidebar
        view={makeView({ status: "complete", phase: "game_over" })}
        onRepeatGame={onRepeatGame}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Repeat game" }));
    expect(onRepeatGame).toHaveBeenCalledTimes(2);
    unmount();
  });

  it("disables pass unless move phase and disables controls while loading", () => {
    const { rerender, unmount } = render(<GameSidebar view={makeView({ phase: "sense", status: "active" })} />);

    expect(screen.getByRole("button", { name: "Pass" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Resign" })).toBeEnabled();

    rerender(<GameSidebar view={makeView({ phase: "move", status: "active" })} />);

    expect(screen.getByRole("button", { name: "Pass" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Resign" })).toBeEnabled();

    rerender(<GameSidebar view={makeView({ phase: "move", status: "active" })} loading />);

    expect(screen.getByRole("button", { name: "Pass" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Resign" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Repeat game" })).toBeDisabled();
    unmount();
  });

  it("disables resign after the game is complete", () => {
    const { unmount } = render(<GameSidebar view={makeView({ status: "complete", phase: "game_over" })} />);

    expect(screen.getByRole("button", { name: "Resign" })).toBeDisabled();
    unmount();
  });

  it("renders phase and result messages in the status area", () => {
    const { rerender, unmount } = render(<GameSidebar view={makeView({ phase: "bot_thinking" })} />);

    expect(screen.getByText("Opponent is thinking")).toBeInTheDocument();

    rerender(
      <GameSidebar
        view={makeView({
          phase: "game_over",
          status: "complete",
          result: { winner: "black", reason: "resign", message: "You resigned." }
        })}
      />
    );

    expect(screen.getByText("You resigned.")).toBeInTheDocument();
    unmount();
  });

  it("renders the accessible event log entries", () => {
    const { unmount } = render(
      <GameSidebar
        view={makeView({
          events: [
            {
              id: "event-1",
              type: "sense",
              message: "You sensed around e4.",
              createdAt: "2026-05-03T12:00:00.000Z"
            },
            {
              id: "event-2",
              type: "move",
              message: "Opponent moved.",
              createdAt: "2026-05-03T12:00:05.000Z"
            }
          ]
        })}
      />
    );

    const log = screen.getByLabelText("Game events");

    expect(within(log).getByText("You sensed around e4.")).toBeInTheDocument();
    expect(within(log).queryByText("Opponent moved.")).not.toBeInTheDocument();

    fireEvent.click(within(log).getByRole("button", { name: "Show 1 older events" }));

    expect(within(log).getByText("Opponent moved.")).toBeInTheDocument();
    unmount();
  });

  it("formats clocks as stable minute-second text", () => {
    const { unmount } = render(<GameSidebar view={makeView({ clocks: { humanSecondsLeft: 65.9, botSecondsLeft: -3 } })} />);

    expect(screen.getByText("1:05")).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
    unmount();
  });

  it("ticks down only the side whose turn it is while the game is active", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <GameSidebar
        view={makeView({
          status: "active",
          turn: "white",
          you: { name: "You", color: "white" },
          opponent: { name: "Opponent", color: "black" },
          clocks: { humanSecondsLeft: 3, botSecondsLeft: 10 }
        })}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("0:02")).toBeInTheDocument();
    expect(screen.getByText("0:10")).toBeInTheDocument();
    unmount();
  });

  it("ticks down the opponent clock when it is the opponent turn", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <GameSidebar
        view={makeView({
          status: "active",
          turn: "black",
          you: { name: "You", color: "white" },
          opponent: { name: "Opponent", color: "black" },
          clocks: { humanSecondsLeft: 10, botSecondsLeft: 3 }
        })}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("0:10")).toBeInTheDocument();
    expect(screen.getByText("0:02")).toBeInTheDocument();
    unmount();
  });

  it("stops ticking when the game is complete", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <GameSidebar
        view={makeView({
          status: "complete",
          phase: "game_over",
          turn: "white",
          clocks: { humanSecondsLeft: 3, botSecondsLeft: 10 }
        })}
      />
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("0:03")).toBeInTheDocument();
    expect(screen.getByText("0:10")).toBeInTheDocument();
    unmount();
  });

  it("refreshes the authoritative game view once when the displayed active clock reaches zero", async () => {
    vi.useFakeTimers();
    const onClockExpired = vi.fn();
    const { unmount } = render(
      <GameSidebar
        view={makeView({
          gameId: "game-1",
          status: "active",
          turn: "white",
          you: { name: "You", color: "white" },
          opponent: { name: "Opponent", color: "black" },
          clocks: { humanSecondsLeft: 1, botSecondsLeft: 10 }
        })}
        onClockExpired={onClockExpired}
      />
    );

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(onClockExpired).toHaveBeenCalledTimes(1);
    unmount();
  });
});
