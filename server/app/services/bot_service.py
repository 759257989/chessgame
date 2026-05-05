from typing import Any

from app.bots.registry import get_bot_spec
from app.domain.types import GamePhase


class BotService:
    def run_turn(self, game: Any, seconds_left: float) -> Any:
        bot_spec = get_bot_spec(game.bot_id)
        if bot_spec.factory is None:
            game.add_event("bot_error", f"{bot_spec.name} is unavailable.")
            game.phase = GamePhase.SENSE
            game.turn = game.human_color
            return game

        bot = bot_spec.factory()
        sense_square = bot.choose_sense(game.engine.sense_actions(), game.engine.move_actions(), seconds_left)
        sense_result = game.engine.sense(sense_square) if sense_square else []
        bot.handle_sense_result(
            [(square, piece_type, color.value if color else None) for square, piece_type, color in sense_result]
        )
        bot_move = bot.choose_move(game.engine.move_actions(), seconds_left)
        _requested, taken, capture_square = game.engine.move(bot_move)
        if taken is None:
            game.engine.pass_turn()

        game.turn = game.human_color
        game.phase = GamePhase.SENSE
        if capture_square is not None:
            game.add_event("opponent_capture", f"Your piece was captured on {capture_square}.")
        elif taken is not None:
            game.add_event("opponent_move", "Opponent moved.")
        else:
            game.add_event("opponent_pass", "Opponent passed or made an illegal move.")
        game.add_event("sense_prompt", "Your turn to sense.")
        return game
