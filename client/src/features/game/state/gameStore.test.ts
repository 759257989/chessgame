import { describe, expect, it } from "vitest";

import { staticPlayerView } from "../staticView";
import { gameReducer, initialGameState } from "./gameStore";

describe("gameReducer", () => {
  it("stores the latest PlayerView and clears transient interaction state", () => {
    const state = {
      ...initialGameState,
      selectedSource: "e2",
      hoveredSenseCenter: "e4",
      loading: true,
      error: "Previous error"
    };

    const next = gameReducer(state, { type: "view_received", view: staticPlayerView });

    expect(next.view?.gameId).toBe("static");
    expect(next.selectedSource).toBeNull();
    expect(next.hoveredSenseCenter).toBeNull();
    expect(next.loading).toBe(false);
    expect(next.error).toBeNull();
  });

  it("tracks loading, errors, selected source, and hovered sense center", () => {
    const loading = gameReducer(initialGameState, { type: "loading" });
    const selected = gameReducer(loading, { type: "select_source", square: "b1" });
    const hovered = gameReducer(selected, { type: "hover_sense", square: "d4" });
    const errored = gameReducer(hovered, { type: "error", message: "Invalid phase" });

    expect(loading).toMatchObject({ loading: true, error: null });
    expect(selected.selectedSource).toBe("b1");
    expect(hovered.hoveredSenseCenter).toBe("d4");
    expect(errored).toMatchObject({ loading: false, error: "Invalid phase" });
  });
});
