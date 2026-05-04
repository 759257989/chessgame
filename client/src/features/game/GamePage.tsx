import { ChessBoard } from "./board/ChessBoard";
import { GameSidebar } from "./GameSidebar";
import type { PlayerView } from "./types";

export function GamePage({ view }: { view: PlayerView }) {
  return (
    <main className="game-page">
      <ChessBoard board={view.board} />
      <GameSidebar view={view} />
    </main>
  );
}
