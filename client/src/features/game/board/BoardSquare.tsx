import type { PieceView } from "../types";
import { Piece } from "./Piece";
import { SenseOverlay } from "./SenseOverlay";

interface BoardSquareProps {
  square: string;
  piece?: PieceView;
  tone: "light" | "dark";
  highlighted: boolean;
  knownEmpty: boolean;
}

function describeSquare(square: string, piece: PieceView | undefined, highlighted: boolean, knownEmpty: boolean) {
  const parts = [square];

  if (piece) {
    parts.push(`${piece.color} ${piece.type}`);
  } else if (knownEmpty) {
    parts.push("known empty from sense");
  } else {
    parts.push("empty");
  }

  if (highlighted) {
    parts.push("in highlighted sense area");
  }

  return parts.join(", ");
}

export function BoardSquare({ square, piece, tone, highlighted, knownEmpty }: BoardSquareProps) {
  return (
    <button
      className={[
        "board-square",
        `board-square-${tone}`,
        highlighted ? "board-square-highlighted" : "",
        knownEmpty ? "board-square-known-empty" : ""
      ].join(" ")}
      aria-label={describeSquare(square, piece, highlighted, knownEmpty)}
      type="button"
    >
      <SenseOverlay highlighted={highlighted} knownEmpty={knownEmpty} />
      {piece ? <Piece piece={piece} /> : null}
      <span className="square-coordinate" aria-hidden="true">
        {square}
      </span>
    </button>
  );
}
