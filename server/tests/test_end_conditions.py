from fastapi.testclient import TestClient

from app.api.schemas import CreateGameRequest, TimerRequest
from app.domain.clock import ChessClock
from app.domain.types import GameStatus, WinReason
from app.main import app
from app.services.game_service import GameService, MemoryGameStore


class PassBotService:
    def run_turn(self, game, seconds_left: float):
        game.engine.pass_turn()
        game.add_event("opponent_pass", "Opponent passed.")
        return game


def test_clock_flags_when_time_expires():
    clock = ChessClock(initial_seconds=3, increment_seconds=0)

    clock.start_turn(monotonic_now=10)

    assert clock.is_flagged(monotonic_now=13.1)


def test_game_service_marks_active_side_timeout_complete():
    monotonic_now = 0.0
    service = GameService(MemoryGameStore(), monotonic_now=lambda: monotonic_now)
    game = service.create_game(
        CreateGameRequest(
            human_color="white",
            bot_id="random",
            timer=TimerRequest(initial_seconds=3, increment_seconds=0),
        )
    )

    monotonic_now = 3.1
    view = service.view_for_human(game)

    assert view.status == GameStatus.COMPLETE
    assert view.result is not None
    assert view.result.winner == "black"
    assert view.result.reason == WinReason.TIMEOUT


def test_resign_sets_result_winner_and_reason():
    client = TestClient(app)
    created = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})
    game_id = created.json()["view"]["game_id"]

    response = client.post(f"/api/games/{game_id}/resign")

    result = response.json()["view"]["result"]
    assert result["winner"] == "black"
    assert result["reason"] == WinReason.RESIGN
    assert result["message"] == "You resigned."


def test_game_service_marks_fifty_move_draw_after_100_quiet_half_turns():
    monotonic_now = 0.0
    service = GameService(
        MemoryGameStore(),
        monotonic_now=lambda: monotonic_now,
        bot_service=PassBotService(),
    )
    game = service.create_game(
        CreateGameRequest(
            human_color="white",
            bot_id="random",
            timer=TimerRequest(initial_seconds=900, increment_seconds=5),
        )
    )
    service.sense(game.id, "e2")
    game.engine.board.halfmove_clock = 98

    game = service.pass_turn(game.id)

    assert game.status == GameStatus.COMPLETE
    assert game.result is not None
    assert game.result.winner is None
    assert game.result.reason == WinReason.MOVE_LIMIT
