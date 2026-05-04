import { Crown } from "lucide-react";

import { EventLog } from "./EventLog";
import { ClockDisplay } from "./timers/ClockDisplay";
import type { PlayerView } from "./types";

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

export function GameSidebar({ view }: { view: PlayerView }) {
  return (
    <aside className="game-sidebar">
      <div className="player-row">
        <span>
          <Crown size={18} aria-hidden="true" /> {view.you.name}
        </span>
        <strong>{view.opponent.name}</strong>
      </div>
      <div className="phase-message">{phaseMessage(view.phase)}</div>
      <ClockDisplay label="You have" seconds={view.clocks.humanSecondsLeft} />
      <ClockDisplay label="Opponent has" seconds={view.clocks.botSecondsLeft} />
      <div className="control-row">
        <button type="button">Pass</button>
        <button type="button">Resign</button>
      </div>
      <EventLog events={view.events} />
    </aside>
  );
}
