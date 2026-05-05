import type { Color, GameEventView, GameResultView, PieceView, PlayerView } from "../types";

interface ApiPieceView {
  square: string;
  type: PieceView["type"];
  color: Color;
}

interface ApiVisibleBoard {
  orientation: Color;
  own_pieces: ApiPieceView[];
  visible_opponent_pieces: ApiPieceView[];
  known_empty_squares_from_sense: string[];
  highlighted_sense_area: string[];
  last_move: string | null;
  last_capture_square: string | null;
}

interface ApiPlayerView {
  game_id: string;
  status: PlayerView["status"];
  phase: PlayerView["phase"];
  turn: Color;
  you: PlayerView["you"];
  opponent: PlayerView["opponent"];
  board: ApiVisibleBoard;
  clocks: {
    human_seconds_left: number;
    bot_seconds_left: number;
  };
  selectable_sense_centers: string[];
  legal_move_uci: string[];
  move_targets_by_source?: Record<string, string[]>;
  result: GameResultView | null;
  events: Array<{
    id: string;
    type: string;
    message: string;
    created_at: string;
  }>;
}

interface ApiGameResponse {
  view: ApiPlayerView;
}

export interface GameCommandResult {
  view: PlayerView;
}

export interface CreateGameInput {
  humanColor: "random" | Color;
  botId: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function mapEvents(events: ApiPlayerView["events"]): GameEventView[] {
  return events.map((event) => ({
    id: event.id,
    type: event.type,
    message: event.message,
    createdAt: event.created_at
  }));
}

function mapPlayerView(view: ApiPlayerView): PlayerView {
  return {
    gameId: view.game_id,
    status: view.status,
    phase: view.phase,
    turn: view.turn,
    you: view.you,
    opponent: view.opponent,
    board: {
      orientation: view.board.orientation,
      ownPieces: view.board.own_pieces,
      visibleOpponentPieces: view.board.visible_opponent_pieces,
      knownEmptySquaresFromSense: view.board.known_empty_squares_from_sense,
      highlightedSenseArea: view.board.highlighted_sense_area,
      lastMove: view.board.last_move,
      lastCaptureSquare: view.board.last_capture_square
    },
    clocks: {
      humanSecondsLeft: view.clocks.human_seconds_left,
      botSecondsLeft: view.clocks.bot_seconds_left
    },
    selectableSenseCenters: view.selectable_sense_centers,
    legalMoveUci: view.legal_move_uci,
    moveTargetsBySource: view.move_targets_by_source ?? {},
    events: mapEvents(view.events),
    result: view.result
  };
}

async function command(path: string, init?: RequestInit): Promise<GameCommandResult> {
  const response = await request<ApiGameResponse>(path, init);
  return { view: mapPlayerView(response.view) };
}

export function createGame(input: CreateGameInput): Promise<GameCommandResult> {
  return command("/api/games", {
    method: "POST",
    body: JSON.stringify({
      human_color: input.humanColor,
      bot_id: input.botId,
      timer: { initial_seconds: 900, increment_seconds: 5 }
    })
  });
}

export function getGame(gameId: string): Promise<GameCommandResult> {
  return command(`/api/games/${gameId}`, { method: "GET" });
}

export function sense(gameId: string, center: string): Promise<GameCommandResult> {
  return command(`/api/games/${gameId}/sense`, {
    method: "POST",
    body: JSON.stringify({ center })
  });
}

export function move(
  gameId: string,
  source: string,
  target: string,
  promotion: string | null
): Promise<GameCommandResult> {
  return command(`/api/games/${gameId}/move`, {
    method: "POST",
    body: JSON.stringify({ source, target, promotion })
  });
}

export function passTurn(gameId: string): Promise<GameCommandResult> {
  return command(`/api/games/${gameId}/pass`, { method: "POST" });
}

export function resign(gameId: string): Promise<GameCommandResult> {
  return command(`/api/games/${gameId}/resign`, { method: "POST" });
}
