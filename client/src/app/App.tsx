import { GamePage } from "../features/game/GamePage";
import { staticPlayerView } from "../features/game/staticView";

export function App() {
  return <GamePage view={staticPlayerView} />;
}
