from __future__ import annotations

from typing import Protocol

import chess

from app.bots.stockfish_service import StockfishService


class StockfishLike(Protocol):
    @property
    def is_available(self) -> bool: ...
    def best_move(self, board: chess.Board, move_actions: list[str], time_limit_ms: int) -> str | None: ...
    def close(self) -> None: ...


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
        self.known_squares: set[int] = set()
        self.priority_sense_square: str | None = None

    def start_game(self, color: str) -> None:
        self.color = chess.WHITE if color == "white" else chess.BLACK
        self.board.turn = self.color

    def choose_sense(self, sense_actions: list[str], move_actions: list[str], seconds_left: float) -> str | None:
        if not sense_actions:
            return None

        if self.priority_sense_square in sense_actions:
            return self.priority_sense_square

        return max(sense_actions, key=self._sense_score)

    def handle_sense_result(self, sense_result: list[tuple[str, str | None, str | None]]) -> None:
        for square_name, piece_type, color in sense_result:
            try:
                square = chess.parse_square(square_name)
            except ValueError:
                continue

            self.known_squares.add(square)
            if square_name == self.priority_sense_square:
                self.priority_sense_square = None
            if piece_type is None or color is None:
                self.board.remove_piece_at(square)
                continue

            chess_piece_type = _PIECE_TYPES.get(piece_type)
            if chess_piece_type is None:
                continue

            self.board.set_piece_at(square, chess.Piece(chess_piece_type, color == "white"))

    def handle_opponent_move(
        self,
        requested_move: str | None = None,
        taken_move: str | None = None,
        capture_square: str | None = None,
    ) -> None:
        taken_target: int | None = None
        if taken_move:
            self._apply_known_move(taken_move, moving_color=not self.color)
            taken_target = self._target_square(taken_move)

        if capture_square:
            try:
                square = chess.parse_square(capture_square)
                if taken_target != square:
                    self.board.remove_piece_at(square)
                self.known_squares.add(square)
                self.priority_sense_square = capture_square
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

    def close(self) -> None:
        close_stockfish = getattr(self.stockfish, "close", None)
        if close_stockfish is not None:
            close_stockfish()

    def _sense_score(self, center_name: str) -> tuple[int, int, int]:
        try:
            center = chess.parse_square(center_name)
        except ValueError:
            return (-1, -1, -100)

        unknown_count = sum(1 for square in self._sense_area(center) if square not in self.known_squares)
        center_bonus = 1 if center not in self.known_squares else 0
        file_index = chess.square_file(center)
        rank_index = chess.square_rank(center)
        centrality = -(abs((file_index * 2) - 7) + abs((rank_index * 2) - 7))
        return (unknown_count, center_bonus, centrality)

    def _sense_area(self, center: int) -> list[int]:
        center_file = chess.square_file(center)
        center_rank = chess.square_rank(center)
        squares: list[int] = []
        for file_index in range(center_file - 1, center_file + 2):
            for rank_index in range(center_rank - 1, center_rank + 2):
                if 0 <= file_index <= 7 and 0 <= rank_index <= 7:
                    squares.append(chess.square(file_index, rank_index))
        return squares

    def _apply_known_move(self, uci: str, moving_color: bool) -> None:
        try:
            move = chess.Move.from_uci(uci)
        except ValueError:
            return

        self.board.turn = moving_color
        try:
            self.board.push(move)
            self.known_squares.update({move.from_square, move.to_square})
            return
        except (AssertionError, ValueError):
            pass

        piece = self.board.piece_at(move.from_square)
        if piece is None:
            return

        self.board.remove_piece_at(move.from_square)
        promoted_piece_type = move.promotion or piece.piece_type
        self.board.set_piece_at(move.to_square, chess.Piece(promoted_piece_type, moving_color))
        self.known_squares.update({move.from_square, move.to_square})

    def _target_square(self, uci: str) -> int | None:
        try:
            return chess.Move.from_uci(uci).to_square
        except ValueError:
            return None
