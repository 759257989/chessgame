from pydantic import BaseModel, Field

from app.domain.types import Color, GamePhase, GameStatus, WinReason


class PieceView(BaseModel):
    square: str
    type: str
    color: Color


class PlayerSummary(BaseModel):
    name: str
    color: Color


class ClockView(BaseModel):
    human_seconds_left: float
    bot_seconds_left: float


class VisibleBoard(BaseModel):
    orientation: Color
    own_pieces: list[PieceView] = Field(default_factory=list)
    visible_opponent_pieces: list[PieceView] = Field(default_factory=list)
    known_empty_squares_from_sense: list[str] = Field(default_factory=list)
    highlighted_sense_area: list[str] = Field(default_factory=list)
    last_move: str | None = None
    last_capture_square: str | None = None


class GameResultView(BaseModel):
    winner: Color | None = None
    reason: WinReason | None = None
    message: str | None = None


class GameEventView(BaseModel):
    id: str
    type: str
    message: str
    created_at: str


class PlayerView(BaseModel):
    game_id: str
    status: GameStatus = GameStatus.ACTIVE
    phase: GamePhase
    turn: Color
    you: PlayerSummary
    opponent: PlayerSummary
    board: VisibleBoard
    clocks: ClockView
    selectable_sense_centers: list[str] = Field(default_factory=list)
    legal_move_uci: list[str] = Field(default_factory=list)
    events: list[GameEventView] = Field(default_factory=list)
    result: GameResultView | None = None


def _starting_pieces(color: Color) -> list[PieceView]:
    back_rank = "1" if color is Color.WHITE else "8"
    pawn_rank = "2" if color is Color.WHITE else "7"
    pieces = [
        ("a" + back_rank, "rook"),
        ("b" + back_rank, "knight"),
        ("c" + back_rank, "bishop"),
        ("d" + back_rank, "queen"),
        ("e" + back_rank, "king"),
        ("f" + back_rank, "bishop"),
        ("g" + back_rank, "knight"),
        ("h" + back_rank, "rook"),
    ]
    pieces.extend((file + pawn_rank, "pawn") for file in "abcdefgh")
    return [PieceView(square=square, type=piece_type, color=color) for square, piece_type in pieces]


def build_initial_player_view(
    game_id: str,
    human_color: Color,
    bot_name: str,
    phase: GamePhase,
    human_seconds_left: float,
    bot_seconds_left: float,
) -> PlayerView:
    return PlayerView(
        game_id=game_id,
        phase=phase,
        turn=Color.WHITE,
        you=PlayerSummary(name="You", color=human_color),
        opponent=PlayerSummary(name=bot_name, color=human_color.opposite),
        board=VisibleBoard(orientation=human_color, own_pieces=_starting_pieces(human_color)),
        clocks=ClockView(human_seconds_left=human_seconds_left, bot_seconds_left=bot_seconds_left),
        selectable_sense_centers=[file + rank for rank in "12345678" for file in "abcdefgh"],
    )
