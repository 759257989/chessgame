import Bot from "lucide-react/dist/esm/icons/bot.js";
import Play from "lucide-react/dist/esm/icons/play.js";
import { useEffect, useMemo, useState } from "react";

import type { CreateGameInput } from "./api/gameClient";
import type { BotCatalogItem, TimerConfig } from "./types";

export interface GameSetupProps {
  error: string | null;
  loading: boolean;
  bots: BotCatalogItem[];
  botsLoading?: boolean;
  onStart: (input: CreateGameInput) => void;
}

const colorOptions: CreateGameInput["humanColor"][] = ["random", "white", "black"];

const timerOptions: Array<{ id: string; label: string; timer: TimerConfig }> = [
  { id: "increment", label: "15:00 + 5s", timer: { initialSeconds: 900, incrementSeconds: 5 } },
  { id: "strict", label: "15:00 strict", timer: { initialSeconds: 900, incrementSeconds: 0 } }
];

function optionLabel(bot: BotCatalogItem) {
  if (bot.availability === "available") {
    return bot.name;
  }

  return `${bot.name} - unavailable: ${bot.unavailableReason ?? "Not available"}`;
}

export function GameSetup({ error, loading, bots, botsLoading = false, onStart }: GameSetupProps) {
  const [humanColor, setHumanColor] = useState<CreateGameInput["humanColor"]>("random");
  const [botId, setBotId] = useState("random");
  const [timerMode, setTimerMode] = useState(timerOptions[0].id);
  const availableBotIds = useMemo(
    () => new Set(bots.filter((bot) => bot.availability === "available").map((bot) => bot.id)),
    [bots]
  );
  const selectedBot = bots.find((bot) => bot.id === botId);
  const selectedTimer = timerOptions.find((option) => option.id === timerMode) ?? timerOptions[0];
  const canStart = Boolean(botId && availableBotIds.has(botId));

  useEffect(() => {
    if (availableBotIds.has(botId)) {
      return;
    }

    setBotId(bots.find((bot) => bot.availability === "available")?.id ?? "");
  }, [availableBotIds, botId, bots]);

  return (
    <main className="setup-page">
      <section className="setup-panel" aria-labelledby="setup-title">
        <div className="setup-heading">
          <h1 id="setup-title">Reconnaissance Blind Chess</h1>
        </div>

        <div className="setup-field">
          <span className="setup-label">Color</span>
          <div className="segmented-control" role="group" aria-label="Choose color">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                aria-pressed={humanColor === color}
                onClick={() => setHumanColor(color)}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        <label className="setup-field">
          <span className="setup-label">
            <Bot size={18} aria-hidden="true" />
            Bot
          </span>
          <select
            value={botId}
            onChange={(event) => setBotId(event.target.value)}
            disabled={botsLoading || bots.length === 0}
          >
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id} disabled={bot.availability !== "available"}>
                {optionLabel(bot)}
              </option>
            ))}
          </select>
          {selectedBot ? <span className="setup-help">{selectedBot.description}</span> : null}
        </label>

        <div className="setup-field">
          <span className="setup-label">Timer</span>
          <div className="segmented-control timer-control" role="group" aria-label="Choose timer">
            {timerOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={timerMode === option.id}
                onClick={() => setTimerMode(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="setup-error" role="alert">
            {error}
          </div>
        ) : null}

        <button
          className="setup-start"
          type="button"
          disabled={loading || !canStart}
          onClick={() => onStart({ humanColor, botId, timer: selectedTimer.timer })}
        >
          <Play size={20} aria-hidden="true" />
          {loading ? "Starting" : "Start"}
        </button>
      </section>
    </main>
  );
}
