export type Color = "white" | "black";
export type GamePhase = "setup" | "sense" | "move" | "bot_thinking" | "game_over";
export type GameStatus = "active" | "complete";
export type WinReason = "king_capture" | "timeout" | "resign" | "move_limit";

export interface PieceView {
  square: string;
  type: "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
  color: Color;
}

export interface VisibleBoard {
  orientation: Color;
  ownPieces: PieceView[];
  visibleOpponentPieces: PieceView[];
  knownEmptySquaresFromSense: string[];
  highlightedSenseArea: string[];
  lastMove: string | null;
  lastCaptureSquare: string | null;
}

export interface PlayerSummary {
  name: string;
  color: Color;
}

export interface ClockView {
  humanSecondsLeft: number;
  botSecondsLeft: number;
}

export interface GameEventView {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface GameResultView {
  winner: Color | null;
  reason: WinReason | null;
  message: string | null;
}

export interface PlayerView {
  gameId: string;
  status: GameStatus;
  phase: GamePhase;
  turn: Color;
  you: PlayerSummary;
  opponent: PlayerSummary;
  board: VisibleBoard;
  clocks: ClockView;
  selectableSenseCenters: string[];
  legalMoveUci: string[];
  moveTargetsBySource: Record<string, string[]>;
  events: GameEventView[];
  result: GameResultView | null;
}
