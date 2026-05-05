from pathlib import Path

from app.bots.stockfish_service import StockfishService


def test_stockfish_service_is_unconfigured_without_path():
    service = StockfishService.from_environment({})

    assert service.binary_path is None
    assert service.is_configured is False


def test_stockfish_service_reads_binary_path_from_environment():
    service = StockfishService.from_environment({"STOCKFISH_PATH": "/usr/local/bin/stockfish"})

    assert service.binary_path == Path("/usr/local/bin/stockfish")
    assert service.is_configured is True
