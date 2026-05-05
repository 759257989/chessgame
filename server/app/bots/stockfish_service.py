from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping


@dataclass(frozen=True)
class StockfishService:
    binary_path: Path | None = None

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
