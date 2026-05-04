import type { PieceView } from "../types";

const symbols: Record<PieceView["color"], Record<PieceView["type"], string>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" }
};

export function Piece({ piece }: { piece: PieceView }) {
  return (
    <span className={`piece piece-${piece.color}`} aria-hidden="true">
      {symbols[piece.color][piece.type]}
    </span>
  );
}
