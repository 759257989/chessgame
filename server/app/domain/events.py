from datetime import datetime, timezone
from uuid import uuid4

from app.domain.player_view import GameEventView


def player_event(event_type: str, message: str) -> GameEventView:
    return GameEventView(
        id=str(uuid4()),
        type=event_type,
        message=message,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
