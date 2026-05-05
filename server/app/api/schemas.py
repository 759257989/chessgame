from pydantic import BaseModel, Field

from app.domain.player_view import PlayerView
from app.domain.types import BotAvailability


class TimerRequest(BaseModel):
    initial_seconds: int = Field(default=900, ge=1)
    increment_seconds: int = Field(default=5, ge=0)


class CreateGameRequest(BaseModel):
    human_color: str = "random"
    bot_id: str = "random"
    timer: TimerRequest = Field(default_factory=TimerRequest)


class SenseRequest(BaseModel):
    center: str


class MoveRequest(BaseModel):
    source: str
    target: str
    promotion: str | None = None


class BotResponse(BaseModel):
    id: str
    name: str
    description: str
    availability: BotAvailability
    unavailable_reason: str | None = None


class GameResponse(BaseModel):
    view: PlayerView
