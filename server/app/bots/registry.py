from collections.abc import Callable
from dataclasses import dataclass

from app.bots.attacker_bot import AttackerBot
from app.bots.base import BotPlayer
from app.bots.random_bot import RandomBot
from app.bots.stockfish_service import StockfishService
from app.domain.types import BotAvailability


@dataclass(frozen=True)
class BotSpec:
    id: str
    name: str
    description: str
    availability: BotAvailability
    factory: Callable[[], BotPlayer] | None = None
    unavailable_reason: str | None = None


_REGISTRY: dict[str, BotSpec] = {
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
    "trout": BotSpec(
        id="trout",
        name="trout",
        description="Tracks a naive board state and uses Stockfish.",
        availability=BotAvailability.UNAVAILABLE,
        unavailable_reason="Requires Stockfish integration",
    ),
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

_STOCKFISH = StockfishService.from_environment()
if _STOCKFISH.is_configured:
    _REGISTRY["trout"] = BotSpec(
        id="trout",
        name="trout",
        description="Tracks a naive board state and uses Stockfish.",
        availability=BotAvailability.UNAVAILABLE,
        unavailable_reason="Stockfish is configured, but TroutBot is not implemented in this MVP yet.",
    )


def list_bot_specs() -> list[BotSpec]:
    return list(_REGISTRY.values())


def get_bot_spec(bot_id: str) -> BotSpec:
    return _REGISTRY[bot_id]
