import stat
from pathlib import Path

import chess

from app.bots.stockfish_service import StockfishService


def test_stockfish_service_is_unconfigured_without_path():
    service = StockfishService.from_environment({})

    assert service.binary_path is None
    assert service.is_configured is False


def test_stockfish_service_reads_binary_path_from_environment():
    service = StockfishService.from_environment({"STOCKFISH_PATH": "/usr/local/bin/stockfish"})

    assert service.binary_path == Path("/usr/local/bin/stockfish")
    assert service.is_configured is True


def test_stockfish_service_reports_missing_binary_unavailable():
    service = StockfishService.from_environment({"STOCKFISH_PATH": "/missing/stockfish"})

    assert service.is_configured is True
    assert service.is_available is False
    assert service.availability_error == "STOCKFISH_PATH does not point to an executable file"


def test_stockfish_service_returns_best_move_from_uci_engine(tmp_path):
    binary = tmp_path / "fake-stockfish"
    binary.write_text(
        "\n".join(
            [
                "#!/usr/bin/env python3",
                "import sys",
                "for raw_line in sys.stdin:",
                "    line = raw_line.strip()",
                "    if line == 'uci':",
                "        print('id name FakeFish')",
                "        print('uciok')",
                "    elif line == 'isready':",
                "        print('readyok')",
                "    elif line.startswith('go '):",
                "        print('bestmove e2e4')",
                "    elif line == 'quit':",
                "        break",
                "    sys.stdout.flush()",
            ]
        )
    )
    binary.chmod(stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR)
    service = StockfishService(binary_path=binary)

    try:
        assert service.best_move(chess.Board(), ["d2d4", "e2e4"], time_limit_ms=1) == "e2e4"
    finally:
        service.close()


def test_stockfish_service_reuses_engine_process_between_moves(tmp_path):
    count_file = tmp_path / "starts.txt"
    binary = tmp_path / "fake-stockfish"
    binary.write_text(
        "\n".join(
            [
                "#!/usr/bin/env python3",
                "import pathlib",
                "import sys",
                f"count_file = pathlib.Path({str(count_file)!r})",
                "count_file.write_text(count_file.read_text() + 'x' if count_file.exists() else 'x')",
                "for raw_line in sys.stdin:",
                "    line = raw_line.strip()",
                "    if line == 'uci':",
                "        print('id name FakeFish')",
                "        print('uciok')",
                "    elif line == 'isready':",
                "        print('readyok')",
                "    elif line.startswith('go '):",
                "        print('bestmove e2e4')",
                "    elif line == 'quit':",
                "        break",
                "    sys.stdout.flush()",
            ]
        )
    )
    binary.chmod(stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR)
    service = StockfishService(binary_path=binary)

    try:
        assert service.best_move(chess.Board(), ["e2e4"], time_limit_ms=1) == "e2e4"
        assert service.best_move(chess.Board(), ["e2e4"], time_limit_ms=1) == "e2e4"
        assert count_file.read_text() == "x"
    finally:
        service.close()
