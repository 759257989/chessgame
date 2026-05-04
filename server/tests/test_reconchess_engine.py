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
