import shutil

import pytest
from fastapi.testclient import TestClient

from app.api.routes_games import store
from app.main import app


def test_trout_can_play_opening_turn_with_real_stockfish(monkeypatch):
    stockfish_path = shutil.which("stockfish")
    if stockfish_path is None:
        pytest.skip("stockfish binary is not installed")

    monkeypatch.setenv("STOCKFISH_PATH", stockfish_path)
    client = TestClient(app)

    response = client.post("/api/games", json={"human_color": "black", "bot_id": "trout"})

    assert response.status_code == 200
    view = response.json()["view"]
    assert view["opponent"]["name"] == "trout"
    assert view["you"]["color"] == "black"
    assert view["turn"] == "black"
    assert view["phase"] == "sense"
    assert any(event["type"] == "opponent_move" for event in view["events"])

    game = store.get(view["game_id"])
    close_bot = getattr(game.bot_player, "close", None)
    if close_bot is not None:
        close_bot()
