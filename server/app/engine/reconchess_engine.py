import chess

from app.domain.types import Color

_SLIDING_DIRECTIONS = {
    chess.BISHOP: (-9, -7, 7, 9),
    chess.ROOK: (-8, -1, 1, 8),
    chess.QUEEN: (-9, -8, -7, -1, 1, 7, 8, 9),
}


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
        return [
            f"{source}{target}"
            for source, targets in self.move_targets_by_source().items()
            for target in targets
        ]

    def move_targets_by_source(self) -> dict[str, list[str]]:
        targets_by_source: dict[str, list[str]] = {}
        for square in chess.SQUARES:
            piece = self.board.piece_at(square)
            if piece is None or piece.color != self.board.turn:
                continue

            targets = [chess.square_name(target) for target in self._targets_for_piece(square, piece)]
            if targets:
                targets_by_source[chess.square_name(square)] = targets
        return targets_by_source

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

        try:
            requested_move = chess.Move.from_uci(uci)
        except ValueError:
            return uci, None, None

        requested = requested_move.uci()
        actual_move = self._resolve_move(requested_move)
        if actual_move is None:
            return requested, None, None

        capture_square = (
            chess.square_name(actual_move.to_square)
            if self._is_opponent_piece_at(actual_move.to_square)
            else None
        )
        self.board.push(actual_move)
        return requested, actual_move.uci(), capture_square

    def pass_turn(self) -> None:
        self.board.push(chess.Move.null())

    def pieces_for_color(self, color: Color) -> list[tuple[str, str, Color]]:
        chess_color = chess.WHITE if color == Color.WHITE else chess.BLACK
        pieces: list[tuple[str, str, Color]] = []

        for square in chess.SQUARES:
            piece = self.board.piece_at(square)
            if piece is not None and piece.color == chess_color:
                pieces.append((_to_square_name(square), _piece_type_name(piece) or "", color))

        return pieces

    def is_over(self) -> bool:
        return self.board.king(chess.WHITE) is None or self.board.king(chess.BLACK) is None

    def is_fifty_move_draw(self) -> bool:
        return self.board.halfmove_clock >= 100

    def _targets_for_piece(self, source: int, piece: chess.Piece) -> list[int]:
        if piece.piece_type in _SLIDING_DIRECTIONS:
            return self._sliding_targets(source, _SLIDING_DIRECTIONS[piece.piece_type])
        if piece.piece_type == chess.KNIGHT:
            return self._jump_targets(source, (-17, -15, -10, -6, 6, 10, 15, 17))
        if piece.piece_type == chess.KING:
            return self._king_targets(source)
        if piece.piece_type == chess.PAWN:
            return self._pawn_targets(source, piece.color)
        return []

    def _resolve_move(self, requested_move: chess.Move) -> chess.Move | None:
        source_piece = self.board.piece_at(requested_move.from_square)
        if source_piece is None or source_piece.color != self.board.turn:
            return None

        if self._is_castling_attempt(requested_move, source_piece):
            return requested_move if self._can_castle_without_check_test(requested_move) else None

        if source_piece.piece_type in _SLIDING_DIRECTIONS:
            return self._resolve_sliding_move(requested_move, source_piece)

        if requested_move.to_square not in self._targets_for_piece(requested_move.from_square, source_piece):
            return None

        if source_piece.piece_type == chess.PAWN and not self._is_valid_pawn_outcome(requested_move, source_piece):
            return None

        return self._with_default_promotion(requested_move, source_piece)

    def _resolve_sliding_move(self, requested_move: chess.Move, piece: chess.Piece) -> chess.Move | None:
        direction = self._direction_between(requested_move.from_square, requested_move.to_square)
        if direction not in _SLIDING_DIRECTIONS[piece.piece_type]:
            return None

        square = requested_move.from_square + direction
        while chess.square_file(square) in range(8) and chess.square_rank(square) in range(8):
            if not self._is_step_aligned(square - direction, square, direction):
                return None
            blocker = self.board.piece_at(square)
            if blocker is not None:
                if blocker.color == self.board.turn:
                    return None
                return chess.Move(requested_move.from_square, square, requested_move.promotion)
            if square == requested_move.to_square:
                return requested_move
            square += direction
        return None

    def _sliding_targets(self, source: int, directions: tuple[int, ...]) -> list[int]:
        targets: list[int] = []
        for direction in directions:
            square = source + direction
            previous = source
            while 0 <= square < 64 and self._is_step_aligned(previous, square, direction):
                piece = self.board.piece_at(square)
                if piece is not None and piece.color == self.board.turn:
                    break
                targets.append(square)
                previous = square
                square += direction
        return targets

    def _jump_targets(self, source: int, offsets: tuple[int, ...]) -> list[int]:
        source_file = chess.square_file(source)
        source_rank = chess.square_rank(source)
        targets: list[int] = []
        for offset in offsets:
            target = source + offset
            if not 0 <= target < 64:
                continue
            file_delta = abs(chess.square_file(target) - source_file)
            rank_delta = abs(chess.square_rank(target) - source_rank)
            if sorted((file_delta, rank_delta)) != [1, 2]:
                continue
            if not self._is_own_piece_at(target):
                targets.append(target)
        return targets

    def _king_targets(self, source: int) -> list[int]:
        source_file = chess.square_file(source)
        source_rank = chess.square_rank(source)
        targets: list[int] = []
        for file_index in range(source_file - 1, source_file + 2):
            for rank_index in range(source_rank - 1, source_rank + 2):
                if file_index == source_file and rank_index == source_rank:
                    continue
                if 0 <= file_index <= 7 and 0 <= rank_index <= 7:
                    target = chess.square(file_index, rank_index)
                    if not self._is_own_piece_at(target):
                        targets.append(target)

        for target in self._castling_targets(source):
            targets.append(target)
        return targets

    def _pawn_targets(self, source: int, color: bool) -> list[int]:
        direction = 8 if color == chess.WHITE else -8
        start_rank = 1 if color == chess.WHITE else 6
        source_file = chess.square_file(source)
        source_rank = chess.square_rank(source)
        targets: list[int] = []

        one_step = source + direction
        if 0 <= one_step < 64 and not self._is_own_piece_at(one_step):
            targets.append(one_step)
            two_step = source + (direction * 2)
            if source_rank == start_rank and 0 <= two_step < 64 and not self._is_own_piece_at(two_step):
                targets.append(two_step)

        for file_delta in (-1, 1):
            target_file = source_file + file_delta
            target_rank = source_rank + (1 if color == chess.WHITE else -1)
            if 0 <= target_file <= 7 and 0 <= target_rank <= 7:
                target = chess.square(target_file, target_rank)
                if not self._is_own_piece_at(target):
                    targets.append(target)
        return targets

    def _is_valid_pawn_outcome(self, move: chess.Move, piece: chess.Piece) -> bool:
        file_delta = chess.square_file(move.to_square) - chess.square_file(move.from_square)
        rank_delta = chess.square_rank(move.to_square) - chess.square_rank(move.from_square)
        forward_rank_delta = 1 if piece.color == chess.WHITE else -1

        if file_delta == 0:
            if self.board.piece_at(move.to_square) is not None:
                return False
            if rank_delta == 2 * forward_rank_delta:
                skipped_square = move.from_square + (8 if piece.color == chess.WHITE else -8)
                return self.board.piece_at(skipped_square) is None
            return rank_delta == forward_rank_delta

        return (
            abs(file_delta) == 1
            and rank_delta == forward_rank_delta
            and self._is_opponent_piece_at(move.to_square)
        )

    def _with_default_promotion(self, move: chess.Move, piece: chess.Piece) -> chess.Move:
        if piece.piece_type != chess.PAWN or move.promotion is not None:
            return move
        target_rank = chess.square_rank(move.to_square)
        if target_rank in {0, 7}:
            return chess.Move(move.from_square, move.to_square, chess.QUEEN)
        return move

    def _castling_targets(self, source: int) -> list[int]:
        piece = self.board.piece_at(source)
        if piece is None:
            return []

        targets: list[int] = []
        rank = chess.square_rank(source)
        for target_file in (2, 6):
            target = chess.square(target_file, rank)
            move = chess.Move(source, target)
            if self._is_castling_attempt(move, piece) and self._can_castle_without_check_test(move):
                targets.append(target)
        return targets

    def _is_castling_attempt(self, move: chess.Move, piece: chess.Piece) -> bool:
        return piece.piece_type == chess.KING and abs(chess.square_file(move.to_square) - chess.square_file(move.from_square)) == 2

    def _can_castle_without_check_test(self, move: chess.Move) -> bool:
        source_rank = chess.square_rank(move.from_square)
        if chess.square_rank(move.to_square) != source_rank:
            return False

        king_side = chess.square_file(move.to_square) > chess.square_file(move.from_square)
        rook_square = chess.square(7 if king_side else 0, source_rank)
        rook = self.board.piece_at(rook_square)
        if rook != chess.Piece(chess.ROOK, self.board.turn):
            return False
        if not self.board.castling_rights & chess.BB_SQUARES[rook_square]:
            return False

        step = 1 if king_side else -1
        for file_index in range(chess.square_file(move.from_square) + step, chess.square_file(rook_square), step):
            square = chess.square(file_index, source_rank)
            if self.board.piece_at(square) is not None:
                return False
        return True

    def _direction_between(self, source: int, target: int) -> int | None:
        source_file = chess.square_file(source)
        source_rank = chess.square_rank(source)
        target_file = chess.square_file(target)
        target_rank = chess.square_rank(target)
        file_delta = target_file - source_file
        rank_delta = target_rank - source_rank

        if file_delta == 0:
            return 8 if rank_delta > 0 else -8 if rank_delta < 0 else None
        if rank_delta == 0:
            return 1 if file_delta > 0 else -1
        if abs(file_delta) == abs(rank_delta):
            if file_delta > 0 and rank_delta > 0:
                return 9
            if file_delta < 0 and rank_delta > 0:
                return 7
            if file_delta > 0 and rank_delta < 0:
                return -7
            return -9
        return None

    def _is_step_aligned(self, source: int, target: int, direction: int) -> bool:
        file_delta = chess.square_file(target) - chess.square_file(source)
        rank_delta = chess.square_rank(target) - chess.square_rank(source)
        return (file_delta, rank_delta) in {
            (-1, -1),
            (0, -1),
            (1, -1),
            (-1, 0),
            (1, 0),
            (-1, 1),
            (0, 1),
            (1, 1),
        } and target - source == direction

    def _is_own_piece_at(self, square: int) -> bool:
        piece = self.board.piece_at(square)
        return piece is not None and piece.color == self.board.turn

    def _is_opponent_piece_at(self, square: int) -> bool:
        piece = self.board.piece_at(square)
        return piece is not None and piece.color != self.board.turn
