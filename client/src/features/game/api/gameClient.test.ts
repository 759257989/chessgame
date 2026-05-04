import { afterEach, describe, expect, it, vi } from "vitest";

import { createGame, move, passTurn, resign, sense } from "./gameClient";

function apiView(overrides: Record<string, unknown> = {}) {
  return {
    game_id: "game-1",
    status: "active",
    phase: "sense",
    turn: "white",
    you: { name: "You", color: "white" },
    opponent: { name: "Random", color: "black" },
    board: {
      orientation: "white",
      own_pieces: [{ square: "e1", type: "king", color: "white" }],
      visible_opponent_pieces: [{ square: "g5", type: "knight", color: "black" }],
      known_empty_squares_from_sense: ["f4"],
      highlighted_sense_area: ["f4", "g4"],
      last_move: "e2e4",
      last_capture_square: null
    },
    clocks: { human_seconds_left: 899, bot_seconds_left: 900 },
    selectable_sense_centers: ["e4"],
    legal_move_uci: ["e2e4"],
    result: { winner: "black", reason: "resign", message: "You resigned." },
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

function mockGameResponse(view = apiView()) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ view })
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("gameClient", () => {
  it("creates a game with snake_case payload and maps PlayerView to camelCase", async () => {
    const fetchMock = mockGameResponse();

    const result = await createGame({ humanColor: "white", botId: "random" });

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
    expect(result.view).toMatchObject({
      gameId: "game-1",
      board: {
        ownPieces: [{ square: "e1", type: "king", color: "white" }],
        visibleOpponentPieces: [{ square: "g5", type: "knight", color: "black" }],
        knownEmptySquaresFromSense: ["f4"],
        highlightedSenseArea: ["f4", "g4"],
        lastMove: "e2e4",
        lastCaptureSquare: null
      },
      clocks: { humanSecondsLeft: 899, botSecondsLeft: 900 },
      selectableSenseCenters: ["e4"],
      legalMoveUci: ["e2e4"],
      result: { winner: "black", reason: "resign", message: "You resigned." },
      events: [{ createdAt: "2026-05-03T00:00:00Z" }]
    });
  });

  it("posts command payloads to the matching game endpoints", async () => {
    const fetchMock = mockGameResponse();

    await sense("game-1", "e4");
    await move("game-1", "e2", "e4", null);
    await passTurn("game-1");
    await resign("game-1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/games/game-1/sense",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ center: "e4" }) })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/games/game-1/move",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ source: "e2", target: "e4", promotion: null })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/games/game-1/pass",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "/api/games/game-1/resign",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("surfaces backend detail messages for failed requests", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: "Invalid move" })
    } as Response);

    await expect(move("game-1", "e2", "e5", null)).rejects.toThrow("Invalid move");
  });
});
