import chess

from app.bots.trout_bot import TroutBot


class FakeStockfish:
    def __init__(self, move: str | None) -> None:
        self.move = move
        self.calls: list[tuple[chess.Board, list[str], int]] = []

    @property
    def is_available(self) -> bool:
        return self.move is not None

    def best_move(self, board: chess.Board, move_actions: list[str], time_limit_ms: int) -> str | None:
        self.calls.append((board.copy(stack=False), list(move_actions), time_limit_ms))
        return self.move


def test_trout_uses_stockfish_move_when_available():
    stockfish = FakeStockfish("g1f3")
    bot = TroutBot(stockfish=stockfish)

    bot.start_game("white")

    assert bot.choose_move(["b1c3", "g1f3"], seconds_left=10.0) == "g1f3"
    assert stockfish.calls[0][0].turn == chess.WHITE


def test_trout_falls_back_to_first_move_without_stockfish():
    bot = TroutBot(stockfish=FakeStockfish(None))

    bot.start_game("black")

    assert bot.choose_move(["g8f6", "b8c6"], seconds_left=10.0) == "g8f6"


def test_trout_updates_belief_from_sense_and_capture_notice():
    stockfish = FakeStockfish("g1f3")
    bot = TroutBot(stockfish=stockfish)

    bot.start_game("white")
    bot.handle_sense_result([("e4", "queen", "black"), ("e2", None, None)])
    bot.handle_opponent_move(capture_square="g1")
    bot.choose_move(["b1c3"], seconds_left=10.0)

    board = stockfish.calls[0][0]
    assert board.piece_at(chess.E4) == chess.Piece(chess.QUEEN, chess.BLACK)
    assert board.piece_at(chess.E2) is None
    assert board.piece_at(chess.G1) is None
