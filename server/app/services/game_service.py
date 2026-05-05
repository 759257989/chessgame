import random
import time
from collections.abc import Callable
from uuid import uuid4

from pydantic import BaseModel, Field

from app.api.schemas import CreateGameRequest, MoveRequest
from app.domain.clock import ChessClock
from app.domain.events import player_event
from app.domain.player_view import GameEventView, GameResultView, PieceView, PlayerView, build_initial_player_view
from app.domain.types import BotAvailability, Color, GamePhase, GameStatus, WinReason
from app.engine.reconchess_engine import ReconchessEngine
from app.services.bot_service import BotService
from app.services.turn_service import TurnService


class BotSpec(BaseModel):
    id: str
    name: str
    description: str
    availability: BotAvailability
    unavailable_reason: str | None = None


_FALLBACK_BOTS: dict[str, BotSpec] = {
    "random": BotSpec(
        id="random",
        name="random",
        description="Senses and moves randomly.",
        availability=BotAvailability.AVAILABLE,
    ),
    "oracle": BotSpec(
        id="oracle",
        name="Oracle",
        description="Tracks possible board states and uses Stockfish plus heuristics.",
        availability=BotAvailability.UNAVAILABLE,
        unavailable_reason="Not bundled in the local MVP",
    ),
}


class GameRecord(BaseModel):
    id: str
    status: GameStatus = GameStatus.ACTIVE
    human_color: Color
    bot_id: str
    bot_name: str
    turn: Color = Color.WHITE
    phase: GamePhase = GamePhase.SENSE
    human_clock: ChessClock
    bot_clock: ChessClock
    events: list[GameEventView] = Field(default_factory=list)
    last_sense_area: list[str] = Field(default_factory=list)
    visible_opponent_pieces: list[PieceView] = Field(default_factory=list)
    known_empty_squares_from_sense: list[str] = Field(default_factory=list)
    result: GameResultView | None = None
    engine: ReconchessEngine = Field(default_factory=ReconchessEngine)

    model_config = {"arbitrary_types_allowed": True}

    def add_event(self, event_type: str, message: str) -> None:
        self.events.insert(0, player_event(event_type, message))
        self.events = self.events[:20]


class MemoryGameStore:
    def __init__(self) -> None:
        self._games: dict[str, GameRecord] = {}

    def save(self, game: GameRecord) -> None:
        self._games[game.id] = game

    def get(self, game_id: str) -> GameRecord:
        return self._games[game_id]


class GameService:
    def __init__(
        self,
        store: MemoryGameStore,
        monotonic_now: Callable[[], float] | None = None,
        bot_service: BotService | None = None,
    ) -> None:
        self.store = store
        self._monotonic_now = monotonic_now or time.monotonic
        self.bot_service = bot_service or BotService()

    def create_game(self, request: CreateGameRequest) -> GameRecord:
        bot_spec = self._get_bot_spec(request.bot_id)
        if bot_spec.availability != BotAvailability.AVAILABLE:
            reason = f": {bot_spec.unavailable_reason}" if bot_spec.unavailable_reason else ""
            raise ValueError(f"Bot {request.bot_id} is not available{reason}")

        human_color = self._choose_color(request.human_color)
        game = GameRecord(
            id=str(uuid4()),
            human_color=human_color,
            bot_id=bot_spec.id,
            bot_name=bot_spec.name,
            human_clock=ChessClock(
                initial_seconds=request.timer.initial_seconds,
                increment_seconds=request.timer.increment_seconds,
            ),
            bot_clock=ChessClock(
                initial_seconds=request.timer.initial_seconds,
                increment_seconds=request.timer.increment_seconds,
            ),
        )
        self._clock_for_color(game, game.turn).start_turn(self._monotonic_now())
        game.add_event(
            "game_started",
            "Game started. Your turn to sense."
            if human_color == Color.WHITE
            else "Game started. Waiting for bot.",
        )
        if game.turn != game.human_color:
            self._run_bot_turn(game)
        self.store.save(game)
        return game

    def view_for_human(self, game: GameRecord) -> PlayerView:
        monotonic_now = self._monotonic_now()
        if self._complete_by_timeout_if_flagged(game, monotonic_now):
            self.store.save(game)

        view = build_initial_player_view(
            game_id=game.id,
            human_color=game.human_color,
            bot_name=game.bot_name,
            phase=game.phase,
            human_seconds_left=game.human_clock.current_seconds_left(monotonic_now=monotonic_now),
            bot_seconds_left=game.bot_clock.current_seconds_left(monotonic_now=monotonic_now),
        )
        board = view.board.model_copy(
            update={
                "own_pieces": self._pieces_for_color(game, game.human_color),
                "visible_opponent_pieces": game.visible_opponent_pieces,
                "known_empty_squares_from_sense": game.known_empty_squares_from_sense,
                "highlighted_sense_area": game.last_sense_area,
            }
        )
        return view.model_copy(
            update={
                "board": board,
                "events": game.events,
                "status": game.status,
                "turn": game.turn,
                "phase": game.phase,
                "legal_move_uci": game.engine.move_actions()
                if game.turn == game.human_color and game.phase == GamePhase.MOVE
                else [],
                "move_targets_by_source": game.engine.move_targets_by_source()
                if game.turn == game.human_color and game.phase == GamePhase.MOVE
                else {},
                "result": game.result,
            }
        )

    def sense(self, game_id: str, center: str) -> GameRecord:
        game, _monotonic_now = self._get_active_game_for_command(game_id)
        TurnService(turn=game.turn, human_color=game.human_color, phase=game.phase).require_human_sense()

        result = game.engine.sense(center)
        game.last_sense_area = [square for square, _piece_type, _color in result]
        game.visible_opponent_pieces = [
            PieceView(square=square, type=piece_type, color=color)
            for square, piece_type, color in result
            if piece_type is not None and color == game.human_color.opposite
        ]
        game.known_empty_squares_from_sense = [
            square for square, piece_type, _color in result if piece_type is None
        ]
        game.phase = GamePhase.MOVE
        game.add_event("sense_result", f"Sensed {center}.")
        self.store.save(game)
        return game

    def move(self, game_id: str, request: MoveRequest) -> GameRecord:
        game, monotonic_now = self._get_active_game_for_command(game_id)
        TurnService(turn=game.turn, human_color=game.human_color, phase=game.phase).require_human_move()

        promotion = request.promotion or ""
        _requested, taken, capture_square = game.engine.move(f"{request.source}{request.target}{promotion}")
        if taken is None:
            game.engine.pass_turn()
        self._clear_sense_result(game)
        self._clock_for_color(game, game.turn).stop_turn(monotonic_now)
        game.turn = game.human_color.opposite
        game.phase = GamePhase.BOT_THINKING
        self._clock_for_color(game, game.turn).start_turn(monotonic_now)

        if taken is None:
            game.add_event("illegal_move", "That move did not succeed. Your turn is over.")
        elif capture_square is not None:
            game.add_event("capture", f"You captured a piece on {capture_square}.")
        else:
            game.add_event("move", f"Move played: {taken}.")

        if self._complete_by_king_capture_if_over(game, winner=game.human_color):
            self.store.save(game)
            return game
        if self._complete_by_move_limit_if_over(game):
            self.store.save(game)
            return game

        self._run_bot_turn(game)
        self.store.save(game)
        return game

    def pass_turn(self, game_id: str) -> GameRecord:
        game, monotonic_now = self._get_active_game_for_command(game_id)
        TurnService(turn=game.turn, human_color=game.human_color, phase=game.phase).require_human_move()

        self._clear_sense_result(game)
        game.engine.pass_turn()
        self._clock_for_color(game, game.turn).stop_turn(monotonic_now)
        game.turn = game.human_color.opposite
        game.phase = GamePhase.BOT_THINKING
        self._clock_for_color(game, game.turn).start_turn(monotonic_now)
        game.add_event("pass", "You passed.")
        if self._complete_by_move_limit_if_over(game):
            self.store.save(game)
            return game
        self._run_bot_turn(game)
        self.store.save(game)
        return game

    def resign(self, game_id: str) -> GameRecord:
        game, _monotonic_now = self._get_active_game_for_command(game_id)
        game.status = GameStatus.COMPLETE
        game.phase = GamePhase.GAME_OVER
        game.result = GameResultView(
            winner=game.human_color.opposite,
            reason=WinReason.RESIGN,
            message="You resigned.",
        )
        game.add_event("resign", "You resigned. Game over.")
        self.store.save(game)
        return game

    def _choose_color(self, requested: str) -> Color:
        if requested == Color.WHITE:
            return Color.WHITE
        if requested == Color.BLACK:
            return Color.BLACK
        return random.choice([Color.WHITE, Color.BLACK])

    def _get_bot_spec(self, bot_id: str) -> BotSpec:
        try:
            from app.bots.registry import get_bot_spec

            return BotSpec.model_validate(get_bot_spec(bot_id), from_attributes=True)
        except (ImportError, KeyError, ModuleNotFoundError):
            if bot_id in _FALLBACK_BOTS:
                return _FALLBACK_BOTS[bot_id]
            return BotSpec(
                id=bot_id,
                name=bot_id,
                description="Unknown bot.",
                availability=BotAvailability.UNAVAILABLE,
                unavailable_reason="Unknown bot",
            )

    def _clear_sense_result(self, game: GameRecord) -> None:
        game.last_sense_area = []
        game.visible_opponent_pieces = []
        game.known_empty_squares_from_sense = []

    def _pieces_for_color(self, game: GameRecord, color: Color) -> list[PieceView]:
        return [
            PieceView(square=square, type=piece_type, color=piece_color)
            for square, piece_type, piece_color in game.engine.pieces_for_color(color)
        ]

    def _run_bot_turn(self, game: GameRecord) -> None:
        if game.status == GameStatus.COMPLETE or game.turn == game.human_color:
            return

        bot_started_at = self._monotonic_now()
        game.add_event("bot_thinking", "Waiting for opponent to act.")
        seconds_left = min(1.0, game.bot_clock.current_seconds_left(monotonic_now=bot_started_at))
        self.bot_service.run_turn(game, seconds_left=seconds_left)
        bot_finished_at = self._monotonic_now()
        game.bot_clock.stop_turn(bot_finished_at)

        if game.bot_clock.is_flagged(bot_finished_at):
            self._complete_by_timeout(game, winner=game.human_color, flagged_color=game.human_color.opposite)
            return
        if self._complete_by_king_capture_if_over(game, winner=game.human_color.opposite):
            return
        if self._complete_by_move_limit_if_over(game):
            return

        game.turn = game.human_color
        game.phase = GamePhase.SENSE
        game.human_clock.start_turn(bot_finished_at)

    def _get_active_game_for_command(self, game_id: str) -> tuple[GameRecord, float]:
        game = self.store.get(game_id)
        monotonic_now = self._monotonic_now()
        if self._complete_by_timeout_if_flagged(game, monotonic_now):
            self.store.save(game)
        if game.status == GameStatus.COMPLETE:
            raise ValueError("Game is complete")
        return game, monotonic_now

    def _clock_for_color(self, game: GameRecord, color: Color) -> ChessClock:
        return game.human_clock if color == game.human_color else game.bot_clock

    def _complete_by_timeout_if_flagged(self, game: GameRecord, monotonic_now: float) -> bool:
        if game.status == GameStatus.COMPLETE:
            return False

        active_clock = self._clock_for_color(game, game.turn)
        if not active_clock.is_flagged(monotonic_now):
            return False

        self._complete_by_timeout(game, winner=game.turn.opposite, flagged_color=game.turn)
        return True

    def _complete_by_timeout(self, game: GameRecord, winner: Color, flagged_color: Color) -> None:
        self._clear_sense_result(game)
        game.status = GameStatus.COMPLETE
        game.phase = GamePhase.GAME_OVER
        game.result = GameResultView(
            winner=winner,
            reason=WinReason.TIMEOUT,
            message=f"{flagged_color.value.title()} flagged on time.",
        )
        game.add_event("timeout", f"{flagged_color.value.title()} flagged on time. Game over.")

    def _complete_by_king_capture_if_over(self, game: GameRecord, winner: Color) -> bool:
        if game.status == GameStatus.COMPLETE or not game.engine.is_over():
            return False

        game.status = GameStatus.COMPLETE
        game.phase = GamePhase.GAME_OVER
        game.result = GameResultView(
            winner=winner,
            reason=WinReason.KING_CAPTURE,
            message=f"{winner.value.title()} captured the king.",
        )
        game.add_event("king_capture", f"{winner.value.title()} captured the king. Game over.")
        return True

    def _complete_by_move_limit_if_over(self, game: GameRecord) -> bool:
        if game.status == GameStatus.COMPLETE or not game.engine.is_fifty_move_draw():
            return False

        self._clear_sense_result(game)
        game.status = GameStatus.COMPLETE
        game.phase = GamePhase.GAME_OVER
        game.result = GameResultView(
            winner=None,
            reason=WinReason.MOVE_LIMIT,
            message="Draw by the RBC 50-move rule.",
        )
        game.add_event("move_limit", "Draw by the RBC 50-move rule. Game over.")
        return True
