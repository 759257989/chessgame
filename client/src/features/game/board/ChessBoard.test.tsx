import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { VisibleBoard } from "../types";
import { ChessBoard } from "./ChessBoard";

function boardFixture(overrides: Partial<VisibleBoard> = {}): VisibleBoard {
  return {
    orientation: "white",
    ownPieces: [{ square: "e1", type: "king", color: "white" }],
    visibleOpponentPieces: [{ square: "g5", type: "knight", color: "black" }],
    knownEmptySquaresFromSense: [],
    highlightedSenseArea: [],
    lastMove: null,
    lastCaptureSquare: null,
    ...overrides
  };
}

function squareButton(square: string) {
  return screen.getByRole("button", { name: new RegExp(`^${square},`) });
}

describe("ChessBoard interactions", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("calls onSquareClick with the clicked square", () => {
    const onSquareClick = vi.fn();

    render(<ChessBoard board={boardFixture()} onSquareClick={onSquareClick} />);

    fireEvent.click(squareButton("d4"));

    expect(onSquareClick).toHaveBeenCalledWith("d4");
  });

  it("previews the hovered 3x3 sense area without off-board squares", () => {
    render(<ChessBoard board={boardFixture()} phase="sense" hoveredSenseCenter="a1" />);

    for (const square of ["a1", "a2", "b1", "b2"]) {
      expect(squareButton(square)).toHaveAccessibleName(/in highlighted sense area/);
      expect(squareButton(square)).toHaveClass("board-square-highlighted");
    }

    for (const square of ["a3", "b3", "c1", "c2"]) {
      expect(squareButton(square)).not.toHaveAccessibleName(/in highlighted sense area/);
      expect(squareButton(square)).not.toHaveClass("board-square-highlighted");
    }
  });

  it("reports sense hover and clears it when leaving a square", () => {
    const onSenseHover = vi.fn();

    render(<ChessBoard board={boardFixture()} phase="sense" onSenseHover={onSenseHover} />);

    fireEvent.mouseEnter(squareButton("e4"));
    fireEvent.mouseLeave(squareButton("e4"));

    expect(onSenseHover).toHaveBeenNthCalledWith(1, "e4");
    expect(onSenseHover).toHaveBeenNthCalledWith(2, null);
  });

  it("marks the selected source square in class and aria label", () => {
    render(<ChessBoard board={boardFixture()} selectedSource="e1" />);

    expect(squareButton("e1")).toHaveAccessibleName(/selected source/);
    expect(squareButton("e1")).toHaveClass("board-square-selected-source");
    expect(squareButton("e2")).not.toHaveAccessibleName(/selected source/);
  });

  it("previews move targets from an own piece only during move phase", () => {
    render(
      <ChessBoard
        board={boardFixture()}
        phase="move"
        moveTargetsBySource={{ e1: ["e2", "f2"] }}
      />
    );

    fireEvent.mouseEnter(squareButton("e1"));

    expect(squareButton("e2")).toHaveAccessibleName(/available move target/);
    expect(squareButton("e2")).toHaveClass("board-square-move-target");
    expect(squareButton("f2")).toHaveAccessibleName(/available move target/);
    expect(squareButton("d2")).not.toHaveAccessibleName(/available move target/);
  });

  it("does not preview move targets during sense phase", () => {
    render(
      <ChessBoard
        board={boardFixture()}
        phase="sense"
        moveTargetsBySource={{ e1: ["e2"] }}
      />
    );

    fireEvent.mouseEnter(squareButton("e1"));

    expect(squareButton("e2")).not.toHaveAccessibleName(/available move target/);
    expect(squareButton("e2")).not.toHaveClass("board-square-move-target");
  });

  it("selects an own piece and submits only highlighted clicked move targets", () => {
    const onSquareClick = vi.fn();
    const onMoveAttempt = vi.fn();

    const { rerender } = render(
      <ChessBoard
        board={boardFixture()}
        phase="move"
        moveTargetsBySource={{ e1: ["e2"] }}
        onSquareClick={onSquareClick}
        onMoveAttempt={onMoveAttempt}
      />
    );

    fireEvent.click(squareButton("e1"));

    expect(onSquareClick).toHaveBeenCalledWith("e1");
    expect(onMoveAttempt).not.toHaveBeenCalled();

    rerender(
      <ChessBoard
        board={boardFixture()}
        phase="move"
        selectedSource="e1"
        moveTargetsBySource={{ e1: ["e2"] }}
        onSquareClick={onSquareClick}
        onMoveAttempt={onMoveAttempt}
      />
    );

    fireEvent.click(squareButton("e2"));
    fireEvent.click(squareButton("e3"));

    expect(onMoveAttempt).toHaveBeenCalledTimes(1);
    expect(onMoveAttempt).toHaveBeenCalledWith("e1", "e2");
  });

  it("submits only highlighted drop targets while dragging an own piece", () => {
    const onMoveAttempt = vi.fn();

    render(
      <ChessBoard
        board={boardFixture()}
        phase="move"
        moveTargetsBySource={{ e1: ["e2"] }}
        onMoveAttempt={onMoveAttempt}
      />
    );

    fireEvent.dragStart(squareButton("e1"));
    expect(squareButton("e2")).toHaveAccessibleName(/available move target/);

    fireEvent.drop(squareButton("e2"));
    fireEvent.dragStart(squareButton("e1"));
    fireEvent.drop(squareButton("e3"));

    expect(onMoveAttempt).toHaveBeenCalledTimes(1);
    expect(onMoveAttempt).toHaveBeenCalledWith("e1", "e2");
  });

  it("keeps black orientation flipped while rendering board pieces", () => {
    render(<ChessBoard board={boardFixture({ orientation: "black" })} />);

    const squares = within(screen.getByLabelText("Chess board")).getAllByRole("button");

    expect(squares[0]).toHaveAccessibleName(/^h1,/);
    expect(squares[squares.length - 1]).toHaveAccessibleName(/^a8,/);
    expect(squareButton("e1")).toHaveAccessibleName("e1, white king");
    expect(squareButton("g5")).toHaveAccessibleName("g5, black knight");
  });
});
