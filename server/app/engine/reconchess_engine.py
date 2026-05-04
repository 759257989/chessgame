import chess

from app.domain.types import Color


def _to_square_name(square: int) -> str:
    return chess.square_name(square)


def _to_square(square_name: str) -> int:
    return chess.parse_square(square_name)


def _piece_type_name(piece: chess.Piece | None) -> str | None:
    if piece is None:
        return None
    return chess.piece_name(piece.piece_type)


def _piece_color(piece: chess.Piece | None) -> Color | None:
    if piece is None:
        return None
    return Color.WHITE if piece.color == chess.WHITE else Color.BLACK


class ReconchessEngine:
    def __init__(self) -> None:
        self.board = chess.Board()

    def sense_actions(self) -> list[str]:
        return [_to_square_name(square) for square in chess.SQUARES]

    def move_actions(self) -> list[str]:
        return [move.uci() for move in self.board.pseudo_legal_moves]

    def sense(self, center: str) -> list[tuple[str, str | None, Color | None]]:
        center_square = _to_square(center)
        center_file = chess.square_file(center_square)
        center_rank = chess.square_rank(center_square)
        result: list[tuple[str, str | None, Color | None]] = []

        for file_index in range(center_file - 1, center_file + 2):
            for rank_index in range(center_rank - 1, center_rank + 2):
                if 0 <= file_index <= 7 and 0 <= rank_index <= 7:
                    square = chess.square(file_index, rank_index)
                    piece = self.board.piece_at(square)
                    result.append((_to_square_name(square), _piece_type_name(piece), _piece_color(piece)))

        return result

    def move(self, uci: str | None) -> tuple[str | None, str | None, str | None]:
        if uci is None:
            return None, None, None

        move = chess.Move.from_uci(uci)
        requested = move.uci()
        if move not in self.board.pseudo_legal_moves:
            return requested, None, None

        capture_square = chess.square_name(move.to_square) if self.board.is_capture(move) else None
        self.board.push(move)
        return requested, move.uci(), capture_square

    def is_over(self) -> bool:
        return self.board.king(chess.WHITE) is None or self.board.king(chess.BLACK) is None
