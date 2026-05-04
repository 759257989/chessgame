from enum import StrEnum


class Color(StrEnum):
    WHITE = "white"
    BLACK = "black"

    @property
    def opposite(self) -> "Color":
        return Color.BLACK if self is Color.WHITE else Color.WHITE


class GamePhase(StrEnum):
    SETUP = "setup"
    SENSE = "sense"
    MOVE = "move"
    BOT_THINKING = "bot_thinking"
    GAME_OVER = "game_over"


class GameStatus(StrEnum):
    ACTIVE = "active"
    COMPLETE = "complete"


class WinReason(StrEnum):
    KING_CAPTURE = "king_capture"
    TIMEOUT = "timeout"
    RESIGN = "resign"
    MOVE_LIMIT = "move_limit"


class BotAvailability(StrEnum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
