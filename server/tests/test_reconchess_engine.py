import chess

from app.engine.reconchess_engine import ReconchessEngine


def test_engine_sense_returns_nine_or_fewer_squares_on_corner():
    engine = ReconchessEngine()

    result = engine.sense("a1")

    squares = {square for square, _piece_type, _color in result}
    assert squares == {"a1", "a2", "b1", "b2"}


def test_engine_exposes_uci_move_actions():
    engine = ReconchessEngine()

    moves = engine.move_actions()

    assert "e2e4" in moves
    assert "g1f3" in moves


def test_pass_turn_advances_engine_side_to_move():
    engine = ReconchessEngine()

    engine.pass_turn()

    assert "e7e5" in engine.move_actions()
    assert "e2e4" not in engine.move_actions()


def test_sliding_piece_captures_first_hidden_blocker_before_requested_target():
    engine = ReconchessEngine()
    engine.board.clear_board()
    engine.board.set_piece_at(0, chess.Piece(chess.ROOK, chess.WHITE))
    engine.board.set_piece_at(24, chess.Piece(chess.BISHOP, chess.BLACK))
    engine.board.turn = chess.WHITE

    requested, taken, capture_square = engine.move("a1a8")

    assert requested == "a1a8"
    assert taken == "a1a4"
    assert capture_square == "a4"
    assert engine.board.piece_at(24) == chess.Piece(chess.ROOK, chess.WHITE)


def test_engine_allows_king_capture_as_move_outcome():
    engine = ReconchessEngine()
    engine.board.clear_board()
    engine.board.set_piece_at(chess.E1, chess.Piece(chess.KING, chess.WHITE))
    engine.board.set_piece_at(chess.E8, chess.Piece(chess.KING, chess.BLACK))
    engine.board.set_piece_at(chess.E7, chess.Piece(chess.ROOK, chess.WHITE))
    engine.board.turn = chess.WHITE

    _requested, taken, capture_square = engine.move("e7e8")

    assert taken == "e7e8"
    assert capture_square == "e8"
    assert engine.is_over()


def test_engine_does_not_filter_moves_for_check():
    engine = ReconchessEngine()
    engine.board.clear_board()
    engine.board.set_piece_at(chess.E1, chess.Piece(chess.KING, chess.WHITE))
    engine.board.set_piece_at(chess.E8, chess.Piece(chess.KING, chess.BLACK))
    engine.board.set_piece_at(chess.E2, chess.Piece(chess.ROOK, chess.WHITE))
    engine.board.set_piece_at(chess.E7, chess.Piece(chess.ROOK, chess.BLACK))
    engine.board.turn = chess.WHITE

    _requested, taken, _capture_square = engine.move("e2a2")

    assert taken == "e2a2"


def test_engine_allows_castling_through_attacked_square():
    engine = ReconchessEngine()
    engine.board.clear_board()
    engine.board.set_piece_at(chess.E1, chess.Piece(chess.KING, chess.WHITE))
    engine.board.set_piece_at(chess.H1, chess.Piece(chess.ROOK, chess.WHITE))
    engine.board.set_piece_at(chess.E8, chess.Piece(chess.KING, chess.BLACK))
    engine.board.set_piece_at(chess.F8, chess.Piece(chess.ROOK, chess.BLACK))
    engine.board.castling_rights = chess.BB_H1
    engine.board.turn = chess.WHITE

    _requested, taken, _capture_square = engine.move("e1g1")

    assert taken == "e1g1"
    assert engine.board.piece_at(chess.G1) == chess.Piece(chess.KING, chess.WHITE)
    assert engine.board.piece_at(chess.F1) == chess.Piece(chess.ROOK, chess.WHITE)
