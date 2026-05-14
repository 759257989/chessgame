from collections.abc import Callable
from dataclasses import dataclass

from app.bots.attacker_bot import AttackerBot
from app.bots.base import BotPlayer
from app.bots.random_bot import RandomBot
from app.bots.stockfish_service import StockfishService
from app.bots.trout_bot import TroutBot
from app.domain.types import BotAvailability


@dataclass(frozen=True)
class BotSpec:
    id: str
    name: str
    description: str
    availability: BotAvailability
    factory: Callable[[], BotPlayer] | None = None
    unavailable_reason: str | None = None


def _trout_spec() -> BotSpec:
    stockfish = StockfishService.from_environment()
    if stockfish.is_available:
        return BotSpec(
            id="trout",
            name="trout",
            description="Tracks a naive board state and uses Stockfish.",
            availability=BotAvailability.AVAILABLE,
            factory=lambda: TroutBot(stockfish=stockfish),
        )

    return BotSpec(
        id="trout",
        name="trout",
        description="Tracks a naive board state and uses Stockfish.",
        availability=BotAvailability.UNAVAILABLE,
        unavailable_reason=stockfish.availability_error,
    )


def _build_registry() -> dict[str, BotSpec]:
    return {
        "random": BotSpec(
            id="random",
            name="random",
            description="Senses and moves randomly.",
            availability=BotAvailability.AVAILABLE,
            factory=RandomBot,
        ),
        "attacker": BotSpec(
            id="attacker",
            name="attacker",
            description="Senses randomly and tries a simple attacking plan.",
            availability=BotAvailability.AVAILABLE,
            factory=AttackerBot,
        ),
        "trout": _trout_spec(),
        "oracle": BotSpec(
            id="oracle",
            name="Oracle",
            description="Tracks possible board states and uses Stockfish plus heuristics.",
            availability=BotAvailability.UNAVAILABLE,
            unavailable_reason="Not bundled in the local MVP",
        ),
        "marmot": BotSpec(
            id="marmot",
            name="Marmot",
            description="Uses Monte Carlo counterfactual regret minimization ideas.",
            availability=BotAvailability.UNAVAILABLE,
            unavailable_reason="Not bundled in the local MVP",
        ),
    }


def list_bot_specs() -> list[BotSpec]:
    return list(_build_registry().values())


def get_bot_spec(bot_id: str) -> BotSpec:
    return _build_registry()[bot_id]
