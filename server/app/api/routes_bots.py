from fastapi import APIRouter

from app.api.schemas import BotResponse
from app.bots.registry import list_bot_specs

router = APIRouter()


@router.get("/bots", response_model=list[BotResponse])
def list_bots() -> list[BotResponse]:
    return [
        BotResponse(
            id=bot.id,
            name=bot.name,
            description=bot.description,
            availability=bot.availability,
            unavailable_reason=bot.unavailable_reason,
        )
        for bot in list_bot_specs()
    ]
