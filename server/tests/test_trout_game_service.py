from app.api.schemas import CreateGameRequest, MoveRequest
from app.domain.types import GamePhase
from app.services.game_service import GameService, MemoryGameStore


class CapturingBotService:
    def __init__(self) -> None:
        self.pending_opponent_move: tuple[str | None, str | None, str | None] | None = None

    def run_turn(self, game, seconds_left: float):
        self.pending_opponent_move = (
            game.bot_pending_opponent_requested_move,
            game.bot_pending_opponent_taken_move,
            game.bot_pending_capture_square,
        )
        game.engine.pass_turn()
        game.add_event("opponent_pass", "Opponent passed.")
        return game


def test_game_service_exposes_human_move_result_to_bot_turn():
    bot_service = CapturingBotService()
    service = GameService(MemoryGameStore(), monotonic_now=lambda: 0.0, bot_service=bot_service)
    game = service.create_game(CreateGameRequest(human_color="white", bot_id="random"))
    service.sense(game.id, "e2")

    service.move(game.id, MoveRequest(source="e2", target="e4"))

    assert bot_service.pending_opponent_move == ("e2e4", "e2e4", None)
    assert game.phase == GamePhase.SENSE
