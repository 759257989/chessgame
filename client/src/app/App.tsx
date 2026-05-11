import { useEffect, useReducer, useState } from "react";

import {
  createGame,
  getGame,
  listBots,
  move,
  passTurn,
  resign,
  sense,
  type CreateGameInput
} from "../features/game/api/gameClient";
import { GamePage } from "../features/game/GamePage";
import { GameSetup } from "../features/game/GameSetup";
import { gameReducer, initialGameState } from "../features/game/state/gameStore";
import type { BotCatalogItem, PlayerView } from "../features/game/types";

const fallbackBots: BotCatalogItem[] = [
  {
    id: "random",
    name: "random",
    description: "Senses and moves randomly.",
    availability: "available",
    unavailableReason: null
  },
  {
    id: "attacker",
    name: "attacker",
    description: "Senses randomly and tries a simple attacking plan.",
    availability: "available",
    unavailableReason: null
  }
];

export function App() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [lastSetup, setLastSetup] = useState<CreateGameInput | null>(null);
  const [bots, setBots] = useState<BotCatalogItem[]>(fallbackBots);
  const [botsLoading, setBotsLoading] = useState(true);
  const [botLoadError, setBotLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadBots() {
      setBotsLoading(true);

      try {
        const botCatalog = await listBots();
        if (!ignore) {
          setBots(botCatalog);
          setBotLoadError(null);
        }
      } catch {
        if (!ignore) {
          setBots(fallbackBots);
          setBotLoadError("Could not load bot catalog. Using local defaults.");
        }
      } finally {
        if (!ignore) {
          setBotsLoading(false);
        }
      }
    }

    void loadBots();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleStart(input: CreateGameInput) {
    await runCommand(() => createGame(input), "Could not create game", () => setLastSetup(input));
  }

  async function runCommand(
    command: () => Promise<{ view: PlayerView }>,
    fallbackMessage: string,
    onSuccess?: () => void
  ) {
    dispatch({ type: "loading" });

    try {
      const response = await command();
      onSuccess?.();
      dispatch({ type: "view_received", view: response.view });
    } catch (error) {
      dispatch({
        type: "error",
        message: error instanceof Error ? error.message : fallbackMessage
      });
    }
  }

  function isOwnPiece(square: string) {
    return state.view?.board.ownPieces.some((piece) => piece.square === square) ?? false;
  }

  function canMoveTo(view: PlayerView, source: string, target: string) {
    return view.moveTargetsBySource[source]?.includes(target) ?? false;
  }

  function handleSquareClick(square: string) {
    const view = state.view;
    if (!view || state.loading || view.status !== "active") {
      return;
    }

    if (view.phase === "sense") {
      void runCommand(() => sense(view.gameId, square), "Could not sense");
      return;
    }

    if (view.phase !== "move") {
      return;
    }

    if (!state.selectedSource) {
      if (isOwnPiece(square)) {
        dispatch({ type: "select_source", square });
      }
      return;
    }

    if (state.selectedSource === square) {
      dispatch({ type: "select_source", square: null });
      return;
    }

    if (isOwnPiece(square)) {
      dispatch({ type: "select_source", square });
      return;
    }

    const source = state.selectedSource;
    if (!canMoveTo(view, source, square)) {
      dispatch({ type: "select_source", square: null });
      return;
    }

    void runCommand(() => move(view.gameId, source, square, null), "Could not move");
  }

  function handleSenseHover(square: string | null) {
    dispatch({ type: "hover_sense", square });
  }

  function handleMoveAttempt(source: string, target: string) {
    const view = state.view;
    if (!view || state.loading || view.status !== "active" || view.phase !== "move") {
      return;
    }

    if (!canMoveTo(view, source, target)) {
      dispatch({ type: "select_source", square: null });
      return;
    }

    void runCommand(() => move(view.gameId, source, target, null), "Could not move");
  }

  function handlePass() {
    if (!state.view) {
      return;
    }
    void runCommand(() => passTurn(state.view!.gameId), "Could not pass");
  }

  function handleResign() {
    if (!state.view) {
      return;
    }
    void runCommand(() => resign(state.view!.gameId), "Could not resign");
  }

  function handleClockExpired() {
    const view = state.view;
    if (!view || state.loading || view.status !== "active") {
      return;
    }

    void runCommand(() => getGame(view.gameId), "Could not refresh game");
  }

  function handleRepeatGame() {
    if (!lastSetup) {
      return;
    }

    void runCommand(() => createGame(lastSetup), "Could not repeat game");
  }

  if (!state.view) {
    return (
      <GameSetup
        error={state.error ?? botLoadError}
        loading={state.loading}
        bots={bots}
        botsLoading={botsLoading}
        onStart={handleStart}
      />
    );
  }

  return (
    <GamePage
      view={state.view}
      selectedSource={state.selectedSource}
      hoveredSenseCenter={state.hoveredSenseCenter}
      loading={state.loading}
      error={state.error}
      onSquareClick={handleSquareClick}
      onMoveAttempt={handleMoveAttempt}
      onSenseHover={handleSenseHover}
      onPass={handlePass}
      onResign={handleResign}
      onRepeatGame={lastSetup ? handleRepeatGame : undefined}
      onClockExpired={handleClockExpired}
    />
  );
}
