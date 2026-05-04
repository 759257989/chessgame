import { useReducer } from "react";

import { createGame, type CreateGameInput } from "../features/game/api/gameClient";
import { GamePage } from "../features/game/GamePage";
import { GameSetup } from "../features/game/GameSetup";
import { gameReducer, initialGameState } from "../features/game/state/gameStore";

export function App() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  async function handleStart(input: CreateGameInput) {
    dispatch({ type: "loading" });

    try {
      const response = await createGame(input);
      dispatch({ type: "view_received", view: response.view });
    } catch (error) {
      dispatch({
        type: "error",
        message: error instanceof Error ? error.message : "Could not create game"
      });
    }
  }

  if (!state.view) {
    return <GameSetup error={state.error} loading={state.loading} onStart={handleStart} />;
  }

  return <GamePage view={state.view} />;
}
