import type { PlayerView, PieceView } from "./types";

const whiteBackRank: PieceView[] = [
  { square: "a1", type: "rook", color: "white" },
  { square: "b1", type: "knight", color: "white" },
  { square: "c1", type: "bishop", color: "white" },
  { square: "d1", type: "queen", color: "white" },
  { square: "e1", type: "king", color: "white" },
  { square: "f1", type: "bishop", color: "white" },
  { square: "g1", type: "knight", color: "white" },
  { square: "h1", type: "rook", color: "white" }
];

const whitePawns: PieceView[] = "abcdefgh".split("").map((file) => ({
  square: `${file}2`,
  type: "pawn",
  color: "white"
}));

export const staticPlayerView: PlayerView = {
  gameId: "static",
  status: "active",
  phase: "sense",
  turn: "white",
  you: { name: "You", color: "white" },
  opponent: { name: "Oracle", color: "black" },
  board: {
    orientation: "white",
    ownPieces: [...whiteBackRank, ...whitePawns],
    visibleOpponentPieces: [{ square: "g5", type: "knight", color: "black" }],
    knownEmptySquaresFromSense: ["f4", "g4", "h4", "f5", "h5", "f6", "g6", "h6"],
    highlightedSenseArea: ["f4", "g4", "h4", "f5", "g5", "h5", "f6", "g6", "h6"],
    lastMove: null,
    lastCaptureSquare: null
  },
  clocks: { humanSecondsLeft: 900, botSecondsLeft: 900 },
  selectableSenseCenters: [],
  legalMoveUci: [],
  events: [
    {
      id: "1",
      type: "sense_prompt",
      message: "Your turn to sense.",
      createdAt: "2026-05-03T12:00:00.000Z"
    }
  ]
};
