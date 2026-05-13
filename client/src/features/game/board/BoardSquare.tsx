import type { DragEvent } from "react";
import type { PieceView } from "../types";
import { Piece } from "./Piece";
import { SenseOverlay } from "./SenseOverlay";

interface BoardSquareProps {
  square: string;
  piece?: PieceView;
  tone: "light" | "dark";
  highlighted: boolean;
  moveTarget?: boolean;
  knownEmpty: boolean;
  selectedSource?: boolean;
  captured?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop?: () => void;
  draggable?: boolean;
}

function describeSquare(
  square: string,
  piece: PieceView | undefined,
  highlighted: boolean,
  moveTarget: boolean,
  knownEmpty: boolean,
  selectedSource: boolean,
  captured: boolean
) {
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

  if (moveTarget) {
    parts.push("available move target");
  }

  if (selectedSource) {
    parts.push("selected source");
  }

  if (captured) {
    parts.push("recently captured piece square");
  }

  return parts.join(", ");
}

export function BoardSquare({
  square,
  piece,
  tone,
  highlighted,
  moveTarget = false,
  knownEmpty,
  selectedSource = false,
  captured = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  draggable = false
}: BoardSquareProps) {
  return (
    <button
      className={[
        "board-square",
        `board-square-${tone}`,
        highlighted ? "board-square-highlighted" : "",
        moveTarget ? "board-square-move-target" : "",
        knownEmpty ? "board-square-known-empty" : "",
        selectedSource ? "board-square-selected-source" : "",
        captured ? "board-square-captured" : ""
      ].join(" ")}
      aria-label={describeSquare(square, piece, highlighted, moveTarget, knownEmpty, selectedSource, captured)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      draggable={draggable}
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
