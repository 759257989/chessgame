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

        bot = game.bot_player
        if bot is None:
            bot = bot_spec.factory()
            game.bot_player = bot
            start_game = getattr(bot, "start_game", None)
            if start_game is not None:
                start_game(game.human_color.opposite.value)

        handle_opponent_move = getattr(bot, "handle_opponent_move", None)
        if handle_opponent_move is not None:
            handle_opponent_move(
                requested_move=game.bot_pending_opponent_requested_move,
                taken_move=game.bot_pending_opponent_taken_move,
                capture_square=game.bot_pending_capture_square,
            )
        game.bot_pending_opponent_requested_move = None
        game.bot_pending_opponent_taken_move = None
        game.bot_pending_capture_square = None

        sense_square = bot.choose_sense(game.engine.sense_actions(), game.engine.move_actions(), seconds_left)
        sense_result = game.engine.sense(sense_square) if sense_square else []
        bot.handle_sense_result(
            [(square, piece_type, color.value if color else None) for square, piece_type, color in sense_result]
        )
        bot_move = bot.choose_move(game.engine.move_actions(), seconds_left)
        requested, taken, capture_square = game.engine.move(bot_move)
        handle_move_result = getattr(bot, "handle_move_result", None)
        if handle_move_result is not None:
            handle_move_result(requested, taken, capture_square)

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
