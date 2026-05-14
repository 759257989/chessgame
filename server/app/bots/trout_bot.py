from __future__ import annotations

from typing import Protocol

import chess

from app.bots.stockfish_service import StockfishService


class StockfishLike(Protocol):
    @property
    def is_available(self) -> bool: ...
    def best_move(self, board: chess.Board, move_actions: list[str], time_limit_ms: int) -> str | None: ...


_PIECE_TYPES = {
    "pawn": chess.PAWN,
    "knight": chess.KNIGHT,
    "bishop": chess.BISHOP,
    "rook": chess.ROOK,
    "queen": chess.QUEEN,
    "king": chess.KING,
}


class TroutBot:
    id = "trout"
    display_name = "trout"

    def __init__(self, stockfish: StockfishLike | None = None) -> None:
        self.stockfish = stockfish or StockfishService.from_environment()
        self.board = chess.Board()
        self.color = chess.WHITE

    def start_game(self, color: str) -> None:
        self.color = chess.WHITE if color == "white" else chess.BLACK
        self.board.turn = self.color

    def choose_sense(self, sense_actions: list[str], move_actions: list[str], seconds_left: float) -> str | None:
        for square in ("d4", "e4", "d5", "e5", "c3", "f3", "c6", "f6"):
            if square in sense_actions:
                return square
        return sense_actions[0] if sense_actions else None

    def handle_sense_result(self, sense_result: list[tuple[str, str | None, str | None]]) -> None:
        for square_name, piece_type, color in sense_result:
            try:
                square = chess.parse_square(square_name)
            except ValueError:
                continue

            if piece_type is None or color is None:
                self.board.remove_piece_at(square)
                continue

            chess_piece_type = _PIECE_TYPES.get(piece_type)
            if chess_piece_type is None:
                continue

            self.board.set_piece_at(square, chess.Piece(chess_piece_type, color == "white"))

    def handle_opponent_move(self, capture_square: str | None = None) -> None:
        if capture_square:
            try:
                self.board.remove_piece_at(chess.parse_square(capture_square))
            except ValueError:
                pass
        self.board.turn = self.color

    def choose_move(self, move_actions: list[str], seconds_left: float) -> str | None:
        if not move_actions:
            return None

        self.board.turn = self.color
        move_time_ms = max(20, min(250, int(seconds_left * 1000 * 0.1)))
        if self.stockfish.is_available:
            best_move = self.stockfish.best_move(self.board, move_actions, time_limit_ms=move_time_ms)
            if best_move in move_actions:
                return best_move

        return move_actions[0]

    def handle_move_result(
        self,
        requested_move: str | None,
        taken_move: str | None,
        capture_square: str | None,
    ) -> None:
        if taken_move is None:
            self.board.turn = not self.color
            return

        try:
            move = chess.Move.from_uci(taken_move)
        except ValueError:
            self.board.turn = not self.color
            return

        self.board.turn = self.color
        try:
            self.board.push(move)
            return
        except (AssertionError, ValueError):
            pass

        piece = self.board.piece_at(move.from_square)
        if piece is not None:
            self.board.remove_piece_at(move.from_square)
            promoted_piece_type = move.promotion or piece.piece_type
            self.board.set_piece_at(move.to_square, chess.Piece(promoted_piece_type, piece.color))

        if capture_square and capture_square != chess.square_name(move.to_square):
            try:
                self.board.remove_piece_at(chess.parse_square(capture_square))
            except ValueError:
                pass
        self.board.turn = not self.color
