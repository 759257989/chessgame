import { useEffect, useRef, useState } from "react";

import { EventLog } from "./EventLog";
import { ClockDisplay } from "./timers/ClockDisplay";
import type { ClockView, Color, PlayerSummary, PlayerView } from "./types";

interface GameSidebarProps {
  view: PlayerView;
  onPass?: () => void;
  onResign?: () => void;
  onRepeatGame?: () => void;
  onClockExpired?: () => void;
  loading?: boolean;
}

function phaseMessage(phase: PlayerView["phase"]) {
  if (phase === "sense") {
    return "Your turn to sense";
  }

  if (phase === "move") {
    return "Choose your move";
  }

  if (phase === "bot_thinking") {
    return "Opponent is thinking";
  }

  if (phase === "game_over") {
    return "Game over";
  }

  return "Setting up game";
}

function colorLabel(color: Color) {
  return color === "white" ? "White" : "Black";
}

function colorIcon(color: Color) {
  return color === "white" ? "♔" : "♚";
}

function PlayerBadge({ player }: { player: PlayerSummary }) {
  const label = colorLabel(player.color);

  return (
    <div className="player-badge" aria-label={`${player.name}, ${player.color}`}>
      <span className={`player-color-icon player-color-icon-${player.color}`} aria-hidden="true">
        {colorIcon(player.color)}
      </span>
      <span className="player-badge-text">
        <strong>{player.name}</strong>
        <span>{label}</span>
      </span>
    </div>
  );
}

export function GameSidebar({
  view,
  onPass,
  onResign,
  onRepeatGame,
  onClockExpired,
  loading = false
}: GameSidebarProps) {
  const [displayedClocks, setDisplayedClocks] = useState<ClockView>(view.clocks);
  const timeoutRefreshKeyRef = useRef<string | null>(null);
  const passDisabled = view.phase !== "move" || loading;
  const resignDisabled = view.status !== "active" || loading;
  const repeatDisabled = loading || !onRepeatGame;
  const statusMessage = view.result?.message ?? phaseMessage(view.phase);
  const activeClockSide = view.turn === view.you.color ? "human" : "bot";
  const activeSecondsLeft =
    activeClockSide === "human" ? displayedClocks.humanSecondsLeft : displayedClocks.botSecondsLeft;

  useEffect(() => {
    setDisplayedClocks(view.clocks);
    timeoutRefreshKeyRef.current = null;
  }, [view.gameId, view.clocks.humanSecondsLeft, view.clocks.botSecondsLeft, view.status, view.turn]);

  useEffect(() => {
    if (view.status !== "active") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setDisplayedClocks((clocks) => {
        if (activeClockSide === "human") {
          return {
            ...clocks,
            humanSecondsLeft: Math.max(0, clocks.humanSecondsLeft - 1)
          };
        }

        return {
          ...clocks,
          botSecondsLeft: Math.max(0, clocks.botSecondsLeft - 1)
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeClockSide, view.status]);

  useEffect(() => {
    if (view.status !== "active" || activeSecondsLeft > 0) {
      return;
    }

    const timeoutRefreshKey = `${view.gameId}:${activeClockSide}:${view.turn}`;
    if (timeoutRefreshKeyRef.current === timeoutRefreshKey) {
      return;
    }

    timeoutRefreshKeyRef.current = timeoutRefreshKey;
    onClockExpired?.();
  }, [activeClockSide, activeSecondsLeft, onClockExpired, view.gameId, view.status, view.turn]);

  return (
    <aside className="game-sidebar">
      <div className="player-row">
        <PlayerBadge player={view.you} />
        <PlayerBadge player={view.opponent} />
      </div>
      <div className="phase-message">{statusMessage}</div>
      <ClockDisplay label="You have" seconds={displayedClocks.humanSecondsLeft} />
      <ClockDisplay label="Opponent has" seconds={displayedClocks.botSecondsLeft} />
      <div className="control-row">
        <button type="button" onClick={onPass} disabled={passDisabled}>
          Pass
        </button>
        <button type="button" onClick={onResign} disabled={resignDisabled}>
          Resign
        </button>
      </div>
      <button
        className="repeat-game-button"
        type="button"
        onClick={onRepeatGame}
        disabled={repeatDisabled}
      >
        Repeat game
      </button>
      <EventLog events={view.events} />
    </aside>
  );
}
