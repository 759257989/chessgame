import random


class RandomBot:
    id = "random"
    display_name = "random"

    def choose_sense(self, sense_actions: list[str], move_actions: list[str], seconds_left: float) -> str | None:
        return random.choice(sense_actions) if sense_actions else None

    def handle_sense_result(self, sense_result: list[tuple[str, str | None, str | None]]) -> None:
        return None

    def choose_move(self, move_actions: list[str], seconds_left: float) -> str | None:
        return random.choice(move_actions) if move_actions else None
