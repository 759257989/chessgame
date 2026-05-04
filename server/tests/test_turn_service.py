import pytest

from app.domain.types import Color, GamePhase
from app.services.turn_service import TurnError, TurnService


def test_user_must_sense_before_moving():
    service = TurnService(turn=Color.WHITE, human_color=Color.WHITE, phase=GamePhase.SENSE)

    with pytest.raises(TurnError, match="Cannot move during sense phase"):
        service.require_human_move()


def test_sense_advances_to_move_phase():
    service = TurnService(turn=Color.WHITE, human_color=Color.WHITE, phase=GamePhase.SENSE)

    service.after_human_sense()

    assert service.phase == GamePhase.MOVE


def test_move_advances_to_bot_thinking():
    service = TurnService(turn=Color.WHITE, human_color=Color.WHITE, phase=GamePhase.MOVE)

    service.after_human_move()

    assert service.phase == GamePhase.BOT_THINKING
    assert service.turn == Color.BLACK
