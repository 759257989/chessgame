import type { PieceView, VisibleBoard } from "../types";
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

export function ChessBoard({ board }: { board: VisibleBoard }) {
  const visiblePieces = [...board.ownPieces, ...board.visibleOpponentPieces];
  const displayedRanks = board.orientation === "white" ? ranks : [...ranks].reverse();
  const displayedFiles = board.orientation === "white" ? files : [...files].reverse();

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
                highlighted={board.highlightedSenseArea.includes(square)}
                knownEmpty={board.knownEmptySquaresFromSense.includes(square)}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
