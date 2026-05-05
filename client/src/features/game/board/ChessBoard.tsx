import { useMemo, useState } from "react";
import type { PieceView, PlayerView, VisibleBoard } from "../types";
import { BoardSquare } from "./BoardSquare";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

function pieceAt(square: string, pieces: PieceView[]) {
  return pieces.find((piece) => piece.square === square);
}

function squareTone(file: string, rank: string): "light" | "dark" {
  const fileIndex = files.indexOf(file);
  const rankNumber = Number(rank);
  return (fileIndex + rankNumber) % 2 === 0 ? "light" : "dark";
}

function senseArea(center: string | null | undefined) {
  if (!center) {
    return [];
  }

  const fileIndex = files.indexOf(center[0]);
  const rankNumber = Number(center[1]);

  if (fileIndex === -1 || !Number.isInteger(rankNumber)) {
    return [];
  }

  const squares: string[] = [];

  for (let rank = rankNumber - 1; rank <= rankNumber + 1; rank += 1) {
    if (rank < 1 || rank > 8) {
      continue;
    }

    for (let fileIndexOffset = fileIndex - 1; fileIndexOffset <= fileIndex + 1; fileIndexOffset += 1) {
      if (fileIndexOffset < 0 || fileIndexOffset >= files.length) {
        continue;
      }

      squares.push(`${files[fileIndexOffset]}${rank}`);
    }
  }

  return squares;
}

interface ChessBoardProps {
  board: VisibleBoard;
  phase?: PlayerView["phase"];
  selectedSource?: string | null;
  hoveredSenseCenter?: string | null;
  moveTargetsBySource?: Record<string, string[]>;
  onSquareClick?: (square: string) => void;
  onMoveAttempt?: (source: string, target: string) => void;
  onSenseHover?: (square: string | null) => void;
}

export function ChessBoard({
  board,
  phase,
  selectedSource,
  hoveredSenseCenter,
  moveTargetsBySource,
  onSquareClick,
  onMoveAttempt,
  onSenseHover
}: ChessBoardProps) {
  const [hoveredMoveSource, setHoveredMoveSource] = useState<string | null>(null);
  const [draggedMoveSource, setDraggedMoveSource] = useState<string | null>(null);
  const visiblePieces = [...board.ownPieces, ...board.visibleOpponentPieces];
  const ownPieceSquares = useMemo(() => new Set(board.ownPieces.map((piece) => piece.square)), [board.ownPieces]);
  const displayedRanks = board.orientation === "white" ? ranks : [...ranks].reverse();
  const displayedFiles = board.orientation === "white" ? files : [...files].reverse();
  const highlightedSquares =
    phase === "sense" && hoveredSenseCenter
      ? [...new Set([...board.highlightedSenseArea, ...senseArea(hoveredSenseCenter)])]
      : board.highlightedSenseArea;
  const activeMoveSource = phase === "move" ? draggedMoveSource ?? hoveredMoveSource ?? selectedSource ?? null : null;
  const activeMoveTargets = activeMoveSource ? moveTargetsBySource?.[activeMoveSource] ?? [] : [];
  const activeMoveTargetSet = new Set(activeMoveTargets);

  function isOwnPiece(square: string) {
    return ownPieceSquares.has(square);
  }

  function handleSquareClick(square: string) {
    if (phase !== "move") {
      onSquareClick?.(square);
      return;
    }

    if (selectedSource && !moveTargetsBySource) {
      onSquareClick?.(square);
      return;
    }

    if (selectedSource && activeMoveTargetSet.has(square)) {
      if (onMoveAttempt) {
        onMoveAttempt(selectedSource, square);
      } else {
        onSquareClick?.(square);
      }
      return;
    }

    if (!selectedSource && isOwnPiece(square)) {
      onSquareClick?.(square);
      return;
    }

    if (selectedSource === square) {
      onSquareClick?.(square);
    }
  }

  function handleMoveHover(square: string | null) {
    if (phase !== "move" || (square && !isOwnPiece(square))) {
      setHoveredMoveSource(null);
      return;
    }

    setHoveredMoveSource(square);
  }

  function handleDragStart(square: string) {
    if (phase === "move" && isOwnPiece(square)) {
      setDraggedMoveSource(square);
    }
  }

  function handleDrop(square: string) {
    if (phase !== "move" || !draggedMoveSource || !activeMoveTargetSet.has(square)) {
      setDraggedMoveSource(null);
      return;
    }

    onMoveAttempt?.(draggedMoveSource, square);
    setDraggedMoveSource(null);
  }

  return (
    <section className="board-wrap" aria-label="Chess board">
      <div className="chess-board">
        {displayedRanks.flatMap((rank) =>
          displayedFiles.map((file) => {
            const square = `${file}${rank}`;
            return (
              <BoardSquare
                key={square}
                square={square}
                piece={pieceAt(square, visiblePieces)}
                tone={squareTone(file, rank)}
                highlighted={highlightedSquares.includes(square)}
                moveTarget={phase === "move" && activeMoveTargetSet.has(square)}
                knownEmpty={board.knownEmptySquaresFromSense.includes(square)}
                selectedSource={selectedSource === square}
                onClick={() => handleSquareClick(square)}
                onMouseEnter={phase === "sense" ? () => onSenseHover?.(square) : () => handleMoveHover(square)}
                onMouseLeave={phase === "sense" ? () => onSenseHover?.(null) : () => handleMoveHover(null)}
                onDragStart={() => handleDragStart(square)}
                onDragEnd={() => setDraggedMoveSource(null)}
                onDragOver={(event) => {
                  if (phase === "move" && activeMoveTargetSet.has(square)) {
                    event.preventDefault();
                  }
                }}
                onDrop={() => handleDrop(square)}
                draggable={phase === "move" && isOwnPiece(square)}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
