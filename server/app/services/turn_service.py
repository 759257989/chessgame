from dataclasses import dataclass

from app.domain.types import Color, GamePhase


class TurnError(ValueError):
    pass


@dataclass
class TurnService:
    turn: Color
    human_color: Color
    phase: GamePhase

    def require_human_sense(self) -> None:
        if self.turn != self.human_color:
            raise TurnError("It is not the human turn")
        if self.phase != GamePhase.SENSE:
            raise TurnError(f"Cannot sense during {self.phase} phase")

    def require_human_move(self) -> None:
        if self.turn != self.human_color:
            raise TurnError("It is not the human turn")
        if self.phase == GamePhase.SENSE:
            raise TurnError("Cannot move during sense phase")
        if self.phase != GamePhase.MOVE:
            raise TurnError(f"Cannot move during {self.phase} phase")

    def after_human_sense(self) -> None:
        self.require_human_sense()
        self.phase = GamePhase.MOVE

    def after_human_move(self) -> None:
        self.require_human_move()
        self.turn = self.human_color.opposite
        self.phase = GamePhase.BOT_THINKING

    def after_bot_move(self) -> None:
        self.turn = self.human_color
        self.phase = GamePhase.SENSE
