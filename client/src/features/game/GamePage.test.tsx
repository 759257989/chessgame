import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GamePage } from "./GamePage";
import { staticPlayerView } from "./staticView";

describe("GamePage", () => {
  it("renders board, timers, and turn message", () => {
    render(<GamePage view={staticPlayerView} />);

    expect(screen.getByLabelText("Chess board")).toBeInTheDocument();
    expect(screen.getByText("Your turn to sense")).toBeInTheDocument();
    expect(screen.getByText(/You have/)).toBeInTheDocument();
    expect(screen.getByText(/Opponent has/)).toBeInTheDocument();
  });
});
