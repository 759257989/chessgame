import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

function apiBoard(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    orientation: "white",
    own_pieces: [
      { square: "e1", type: "king", color: "white" },
      { square: "e2", type: "pawn", color: "white" }
    ],
    visible_opponent_pieces: [],
    known_empty_squares_from_sense: [],
    highlighted_sense_area: [],
    last_move: null,
    last_capture_square: null,
    ...overrides
  };
}

function apiView(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    game_id: "game-1",
    status: "active",
    phase: "sense",
    turn: "white",
    you: { name: "You", color: "white" },
    opponent: { name: "random", color: "black" },
    board: apiBoard(),
    clocks: { human_seconds_left: 900, bot_seconds_left: 900 },
    selectable_sense_centers: ["e4"],
    legal_move_uci: [],
    move_targets_by_source: {},
    result: null,
    events: [
      {
        id: "event-1",
        type: "game_started",
        message: "Game started.",
        created_at: "2026-05-03T00:00:00Z"
      }
    ],
    ...overrides
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
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
          timer: { initial_seconds: 900, increment_seconds: 5 }
        })
      })
    );
    expect(await screen.findByLabelText("Chess board")).toBeInTheDocument();
    expect(screen.getByText("Your turn to sense")).toBeInTheDocument();
  });

  it("repeats a game with the same setup from an active game", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          view: apiView({
            game_id: "game-1",
            opponent: { name: "attacker", color: "white" },
            events: [
              {
                id: "event-1",
                type: "game_started",
                message: "First game started.",
                created_at: "2026-05-03T00:00:00Z"
              }
            ]
          })
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          view: apiView({
            game_id: "game-2",
            opponent: { name: "attacker", color: "white" },
            events: [
              {
                id: "event-2",
                type: "game_started",
                message: "Repeated game started.",
                created_at: "2026-05-03T00:00:01Z"
              }
            ]
          })
        })
      } as Response);

    render(<App />);
    await user.click(screen.getByRole("button", { name: "black" }));
    await user.selectOptions(screen.getByLabelText("Bot"), "attacker");
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(await screen.findByText("First game started.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Repeat game" }));

    expect(await screen.findByText("Repeated game started.")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls
        .filter(([path]) => path === "/api/games")
        .map(([, init]) => JSON.parse(String((init as RequestInit).body)))
    ).toEqual([
      {
        human_color: "black",
        bot_id: "attacker",
        timer: { initial_seconds: 900, increment_seconds: 5 }
      },
      {
        human_color: "black",
        bot_id: "attacker",
        timer: { initial_seconds: 900, increment_seconds: 5 }
      }
    ]);
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

  it("senses from a board click and renders the returned move phase", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ view: apiView() })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          view: apiView({
            phase: "move",
            board: apiBoard({
              highlighted_sense_area: ["d3", "e3", "f3", "d4", "e4", "f4", "d5", "e5", "f5"],
              known_empty_squares_from_sense: ["d3", "e3"]
            })
          })
        })
      } as Response);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(await screen.findByRole("button", { name: "e4, empty" }));

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/games/game-1/sense",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ center: "e4" })
      })
    );
    expect(await screen.findByText("Choose your move")).toBeInTheDocument();
  });

  it("moves after selecting a source and target square", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ view: apiView({ phase: "move", move_targets_by_source: { e2: ["e4"] } }) })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          view: apiView({
            phase: "sense",
            turn: "white",
            board: apiBoard({
              own_pieces: [
                { square: "e1", type: "king", color: "white" },
                { square: "e4", type: "pawn", color: "white" }
              ]
            })
          })
        })
      } as Response);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(await screen.findByRole("button", { name: "e2, white pawn" }));
    expect(await screen.findByRole("button", { name: "e2, white pawn, selected source" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^e4, empty/ }));

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/games/game-1/move",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ source: "e2", target: "e4", promotion: null })
      })
    );
    expect(await screen.findByText("Your turn to sense")).toBeInTheDocument();
  });

  it("does not submit a move when the selected target is not available", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ view: apiView({ phase: "move", move_targets_by_source: { e2: ["e3"] } }) })
    } as Response);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(await screen.findByRole("button", { name: "e2, white pawn" }));
    fireEvent.click(screen.getByRole("button", { name: "e4, empty" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "e2, white pawn, selected source" })).toBeInTheDocument();
  });

  it("passes and resigns through sidebar controls", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ view: apiView({ phase: "move" }) })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ view: apiView({ phase: "sense", turn: "white" }) })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          view: apiView({
            status: "complete",
            phase: "game_over",
            result: { winner: "black", reason: "resign", message: "You resigned." }
          })
        })
      } as Response);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(await screen.findByRole("button", { name: "Pass" }));

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/games/game-1/pass",
      expect.objectContaining({ method: "POST" })
    );
    expect(await screen.findByText("Your turn to sense")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resign" }));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/games/game-1/resign",
      expect.objectContaining({ method: "POST" })
    );
    expect(await screen.findByText("You resigned.")).toBeInTheDocument();
  });

  it("refreshes and renders the authoritative result when the active clock expires", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          view: apiView({
            phase: "move",
            turn: "white",
            clocks: { human_seconds_left: 1, bot_seconds_left: 900 },
            move_targets_by_source: { e2: ["e3"] }
          })
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          view: apiView({
            status: "complete",
            phase: "game_over",
            clocks: { human_seconds_left: 0, bot_seconds_left: 900 },
            result: { winner: "black", reason: "timeout", message: "White flagged on time." }
          })
        })
      } as Response);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    await act(async () => {});
    expect(screen.getByText("Choose your move")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/games/game-1",
      expect.objectContaining({ method: "GET" })
    );
    expect(screen.getByText("White flagged on time.")).toBeInTheDocument();
  });
});
