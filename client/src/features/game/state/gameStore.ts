import type { PlayerView } from "../types";

export interface GameState {
  view: PlayerView | null;
  selectedSource: string | null;
  hoveredSenseCenter: string | null;
  loading: boolean;
  error: string | null;
}

export type GameAction =
  | { type: "loading" }
  | { type: "view_received"; view: PlayerView }
  | { type: "select_source"; square: string | null }
  | { type: "hover_sense"; square: string | null }
  | { type: "error"; message: string };

export const initialGameState: GameState = {
  view: null,
  selectedSource: null,
  hoveredSenseCenter: null,
  loading: false,
  error: null
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "loading":
      return { ...state, loading: true, error: null };
    case "view_received":
      return {
        ...state,
        view: action.view,
        selectedSource: null,
        hoveredSenseCenter: null,
        loading: false,
        error: null
      };
    case "select_source":
      return { ...state, selectedSource: action.square };
    case "hover_sense":
      return { ...state, hoveredSenseCenter: action.square };
    case "error":
      return { ...state, loading: false, error: action.message };
  }
}
