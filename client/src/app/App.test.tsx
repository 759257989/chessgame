import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

function apiView() {
  return {
    game_id: "game-1",
    status: "active",
    phase: "sense",
    turn: "white",
    you: { name: "You", color: "white" },
    opponent: { name: "random", color: "black" },
    board: {
      orientation: "white",
      own_pieces: [{ square: "e1", type: "king", color: "white" }],
      visible_opponent_pieces: [],
      known_empty_squares_from_sense: [],
      highlighted_sense_area: [],
      last_move: null,
      last_capture_square: null
    },
    clocks: { human_seconds_left: 900, bot_seconds_left: 900 },
    selectable_sense_centers: ["e4"],
    legal_move_uci: [],
    result: null,
    events: [
      {
        id: "event-1",
        type: "game_started",
        message: "Game started.",
        created_at: "2026-05-03T00:00:00Z"
      }
    ]
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("renders setup controls before a game starts", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Reconnaissance Blind Chess" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "random" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Bot")).toHaveValue("random");
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });

  it("creates a game and renders the returned player view", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ view: apiView() })
    } as Response);

    render(<App />);
    await user.click(screen.getByRole("button", { name: "white" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/games",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          human_color: "white",
          bot_id: "random",
          timer: { initial_seconds: 900, increment_seconds: 0 }
        })
      })
    );
    expect(await screen.findByLabelText("Chess board")).toBeInTheDocument();
    expect(screen.getByText("Your turn to sense")).toBeInTheDocument();
  });

  it("shows backend errors on the setup screen", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: "Bot oracle is not available" })
    } as Response);

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Bot oracle is not available");
    expect(screen.queryByLabelText("Chess board")).not.toBeInTheDocument();
  });
});
