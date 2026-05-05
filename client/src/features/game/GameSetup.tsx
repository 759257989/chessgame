import Bot from "lucide-react/dist/esm/icons/bot.js";
import Play from "lucide-react/dist/esm/icons/play.js";
import { useState } from "react";

import type { CreateGameInput } from "./api/gameClient";

interface GameSetupProps {
  error: string | null;
  loading: boolean;
  onStart: (input: CreateGameInput) => void;
}

const colorOptions: CreateGameInput["humanColor"][] = ["random", "white", "black"];
const botOptions = [
  { id: "random", label: "random" },
  { id: "attacker", label: "attacker" }
];

export function GameSetup({ error, loading, onStart }: GameSetupProps) {
  const [humanColor, setHumanColor] = useState<CreateGameInput["humanColor"]>("random");
  const [botId, setBotId] = useState("random");

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
          <select value={botId} onChange={(event) => setBotId(event.target.value)}>
            {botOptions.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.label}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <div className="setup-error" role="alert">
            {error}
          </div>
        ) : null}

        <button
          className="setup-start"
          type="button"
          disabled={loading}
          onClick={() => onStart({ humanColor, botId })}
        >
          <Play size={20} aria-hidden="true" />
          {loading ? "Starting" : "Start"}
        </button>
      </section>
    </main>
  );
}
