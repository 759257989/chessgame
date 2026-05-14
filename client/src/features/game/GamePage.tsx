import CircleAlert from "lucide-react/dist/esm/icons/circle-alert.js";
import X from "lucide-react/dist/esm/icons/x.js";
import { useEffect, useMemo, useState } from "react";

import { ChessBoard } from "./board/ChessBoard";
import { GameSidebar } from "./GameSidebar";
import type { GameEventView, PlayerView } from "./types";

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

function isMoveFailureEvent(event: GameEventView) {
  return event.type === "illegal_move" || event.message === "That move did not succeed. Your turn is over.";
}

function capturedSquareFromEvent(event: GameEventView) {
  if (event.type !== "opponent_capture" && !event.message.startsWith("Your piece was captured on ")) {
    return null;
  }

  const match = event.message.match(/captured on ([a-h][1-8])\./);
  return match?.[1] ?? null;
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
  const moveFailureEvent = useMemo(() => view.events.find(isMoveFailureEvent) ?? null, [view.events]);
  const captureEvent = useMemo(() => view.events.find((event) => capturedSquareFromEvent(event) !== null) ?? null, [
    view.events
  ]);
  const capturedSquare = captureEvent ? capturedSquareFromEvent(captureEvent) : null;
  const [dismissedMoveFailureId, setDismissedMoveFailureId] = useState<string | null>(null);
  const [dismissedCaptureId, setDismissedCaptureId] = useState<string | null>(null);
  const showMoveFailure = Boolean(moveFailureEvent && moveFailureEvent.id !== dismissedMoveFailureId);
  const showCaptureNotice = Boolean(captureEvent && captureEvent.id !== dismissedCaptureId);

  useEffect(() => {
    if (!moveFailureEvent || !showMoveFailure) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedMoveFailureId(moveFailureEvent.id);
    }, 10_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [moveFailureEvent, showMoveFailure]);

  useEffect(() => {
    if (!captureEvent || !showCaptureNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedCaptureId(captureEvent.id);
    }, 3_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [captureEvent, showCaptureNotice]);

  return (
    <main className="game-page">
      {moveFailureEvent && showMoveFailure ? (
        <aside className="move-failure-notice" role="status" aria-live="polite">
          <div className="move-failure-icon" aria-hidden="true">
            <CircleAlert size={22} />
          </div>
          <div className="move-failure-copy">
            <strong>Move failed</strong>
            <p>{moveFailureEvent.message}</p>
          </div>
          <button
            className="move-failure-dismiss"
            type="button"
            aria-label="Dismiss move failure notice"
            onClick={() => setDismissedMoveFailureId(moveFailureEvent.id)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </aside>
      ) : null}
      <ChessBoard
        board={view.board}
        phase={view.phase}
        selectedSource={selectedSource}
        hoveredSenseCenter={hoveredSenseCenter}
        moveTargetsBySource={view.moveTargetsBySource}
        capturedSquare={showCaptureNotice ? capturedSquare : null}
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
