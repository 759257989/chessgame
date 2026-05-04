from app.domain.player_view import VisibleBoard, build_initial_player_view
from app.domain.types import Color, GamePhase


def test_initial_player_view_has_only_human_color_pieces():
    view = build_initial_player_view(
        game_id="game-1",
        human_color=Color.WHITE,
        bot_name="random",
        phase=GamePhase.SENSE,
        human_seconds_left=900,
        bot_seconds_left=900,
    )

    assert view.game_id == "game-1"
    assert view.you.color == Color.WHITE
    assert view.opponent.name == "random"
    assert all(piece.color == Color.WHITE for piece in view.board.own_pieces)
    assert view.board.visible_opponent_pieces == []


def test_initial_black_player_view_has_only_black_pieces():
    view = build_initial_player_view(
        game_id="game-2",
        human_color=Color.BLACK,
        bot_name="random",
        phase=GamePhase.SENSE,
        human_seconds_left=900,
        bot_seconds_left=900,
    )

    assert view.you.color == Color.BLACK
    assert view.opponent.color == Color.WHITE
    assert view.board.orientation == Color.BLACK
    assert {piece.color for piece in view.board.own_pieces} == {Color.BLACK}
    assert {piece.square for piece in view.board.own_pieces} == {
        "a8",
        "b8",
        "c8",
        "d8",
        "e8",
        "f8",
        "g8",
        "h8",
        "a7",
        "b7",
        "c7",
        "d7",
        "e7",
        "f7",
        "g7",
        "h7",
    }
    assert view.board.visible_opponent_pieces == []


def test_visible_board_defaults_do_not_leak_opponent_state():
    board = VisibleBoard(orientation=Color.BLACK)

    assert board.own_pieces == []
    assert board.visible_opponent_pieces == []
    assert board.known_empty_squares_from_sense == []
