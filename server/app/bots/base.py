from typing import Protocol


class BotPlayer(Protocol):
    id: str
    display_name: str

    def choose_sense(self, sense_actions: list[str], move_actions: list[str], seconds_left: float) -> str | None: ...
    def handle_sense_result(self, sense_result: list[tuple[str, str | None, str | None]]) -> None: ...
    def choose_move(self, move_actions: list[str], seconds_left: float) -> str | None: ...
