import chess

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


def test_player_view_exposes_move_targets_by_source_without_hidden_blocker_leak():
    from app.api.schemas import CreateGameRequest
    from app.services.game_service import GameService, MemoryGameStore

    service = GameService(MemoryGameStore())
    game = service.create_game(CreateGameRequest(human_color="white", bot_id="random"))
    game.engine.board.clear_board()
    game.engine.board.set_piece_at(chess.A1, chess.Piece(chess.ROOK, chess.WHITE))
    game.engine.board.set_piece_at(chess.A4, chess.Piece(chess.BISHOP, chess.BLACK))
    game.engine.board.turn = chess.WHITE
    game.phase = GamePhase.MOVE
    service.store.save(game)

    view = service.view_for_human(game)

    assert view.move_targets_by_source["a1"] == ["b1", "c1", "d1", "e1", "f1", "g1", "h1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"]
    assert "a1a8" in view.legal_move_uci
