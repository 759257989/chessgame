import random


class AttackerBot:
    id = "attacker"
    display_name = "attacker"

    preferred_moves = ["e2e4", "d1h5", "f1c4", "h5f7", "g1f3", "f3g5"]

    def __init__(self) -> None:
        self._sensed_king_square: str | None = None

    def choose_sense(self, sense_actions: list[str], move_actions: list[str], seconds_left: float) -> str | None:
        return random.choice(sense_actions) if sense_actions else None

    def handle_sense_result(self, sense_result: list[tuple[str, str | None, str | None]]) -> None:
        for square, piece_type, _color in sense_result:
            if piece_type == "king":
                self._sensed_king_square = square
                return

        self._sensed_king_square = None

    def choose_move(self, move_actions: list[str], seconds_left: float) -> str | None:
        if self._sensed_king_square:
            for move in move_actions:
                if move[2:4] == self._sensed_king_square:
                    return move

        for move in self.preferred_moves:
            if move in move_actions:
                return move
        return random.choice(move_actions) if move_actions else None
