from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Mapping

import chess
import chess.engine


@dataclass
class StockfishService:
    binary_path: Path | None = None
    _engine: chess.engine.SimpleEngine | None = field(default=None, init=False, repr=False)

    @classmethod
    def from_environment(cls, environ: Mapping[str, str] | None = None) -> "StockfishService":
        source = environ if environ is not None else os.environ
        raw_path = source.get("STOCKFISH_PATH", "").strip()
        if not raw_path:
            return cls()
        return cls(binary_path=Path(raw_path))

    @property
    def is_configured(self) -> bool:
        return self.binary_path is not None

    @property
    def is_available(self) -> bool:
        return (
            self.binary_path is not None
            and self.binary_path.is_file()
            and os.access(self.binary_path, os.X_OK)
        )

    @property
    def availability_error(self) -> str | None:
        if self.binary_path is None:
            return "Set STOCKFISH_PATH to an executable Stockfish binary"
        if not self.is_available:
            return "STOCKFISH_PATH does not point to an executable file"
        return None

    def best_move(self, board: chess.Board, move_actions: list[str], time_limit_ms: int = 100) -> str | None:
        if not self.is_available or not move_actions:
            return None

        try:
            engine = self._engine_instance(time_limit_ms)
            result = engine.play(board, chess.engine.Limit(time=max(0.001, time_limit_ms / 1000)))
        except (OSError, TimeoutError, chess.engine.EngineError, chess.engine.EngineTerminatedError):
            self.close()
            return None

        allowed = set(move_actions)
        if result.move is None:
            return None

        best = result.move.uci()
        if best in allowed:
            return best
        if len(best) >= 4 and best[:4] in allowed:
            return best[:4]
        return None

    def close(self) -> None:
        if self._engine is None:
            return

        try:
            self._engine.quit()
        except (OSError, TimeoutError, chess.engine.EngineError, chess.engine.EngineTerminatedError):
            pass
        finally:
            self._engine = None

    def _engine_instance(self, time_limit_ms: int) -> chess.engine.SimpleEngine:
        if self.binary_path is None:
            raise OSError("Stockfish is not configured")
        if self._engine is None:
            self._engine = chess.engine.SimpleEngine.popen_uci(
                str(self.binary_path),
                timeout=max(1.0, (time_limit_ms / 1000) + 1.0),
            )
        return self._engine
