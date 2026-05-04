import random
from uuid import uuid4

from pydantic import BaseModel, Field

from app.api.schemas import CreateGameRequest
from app.domain.clock import ChessClock
from app.domain.events import player_event
from app.domain.player_view import GameEventView, PlayerView, build_initial_player_view
from app.domain.types import BotAvailability, Color, GamePhase, GameStatus


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
    def __init__(self, store: MemoryGameStore) -> None:
        self.store = store

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
        game.add_event(
            "game_started",
            "Game started. Your turn to sense."
            if human_color == Color.WHITE
            else "Game started. Waiting for bot.",
        )
        self.store.save(game)
        return game

    def view_for_human(self, game: GameRecord) -> PlayerView:
        view = build_initial_player_view(
            game_id=game.id,
            human_color=game.human_color,
            bot_name=game.bot_name,
            phase=game.phase,
            human_seconds_left=game.human_clock.current_seconds_left(monotonic_now=0),
            bot_seconds_left=game.bot_clock.current_seconds_left(monotonic_now=0),
        )
        return view.model_copy(update={"events": game.events, "status": game.status, "turn": game.turn})

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
