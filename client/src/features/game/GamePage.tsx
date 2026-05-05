import { ChessBoard } from "./board/ChessBoard";
import { GameSidebar } from "./GameSidebar";
import type { PlayerView } from "./types";

interface GamePageProps {
  view: PlayerView;
  selectedSource?: string | null;
  hoveredSenseCenter?: string | null;
  loading?: boolean;
  error?: string | null;
  onSquareClick?: (square: string) => void;
  onMoveAttempt?: (source: string, target: string) => void;
  onSenseHover?: (square: string | null) => void;
  onPass?: () => void;
  onResign?: () => void;
  onRepeatGame?: () => void;
  onClockExpired?: () => void;
}

export function GamePage({
  view,
  selectedSource,
  hoveredSenseCenter,
  loading = false,
  error,
  onSquareClick,
  onMoveAttempt,
  onSenseHover,
  onPass,
  onResign,
  onRepeatGame,
  onClockExpired
}: GamePageProps) {
  return (
    <main className="game-page">
      <ChessBoard
        board={view.board}
        phase={view.phase}
        selectedSource={selectedSource}
        hoveredSenseCenter={hoveredSenseCenter}
        moveTargetsBySource={view.moveTargetsBySource}
        onSquareClick={onSquareClick}
        onMoveAttempt={onMoveAttempt}
        onSenseHover={onSenseHover}
      />
      <div className="game-side-panel">
        {error ? (
          <div className="game-error" role="alert">
            {error}
          </div>
        ) : null}
        <GameSidebar
          view={view}
          loading={loading}
          onPass={onPass}
          onResign={onResign}
          onRepeatGame={onRepeatGame}
          onClockExpired={onClockExpired}
        />
      </div>
    </main>
  );
}
