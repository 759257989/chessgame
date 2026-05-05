from fastapi.testclient import TestClient

from app.main import app


def _new_game(client: TestClient) -> str:
    response = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})
    return response.json()["view"]["game_id"]


def test_human_sense_reveals_only_sense_window():
    client = TestClient(app)
    game_id = _new_game(client)

    response = client.post(f"/api/games/{game_id}/sense", json={"center": "e2"})

    assert response.status_code == 200
    view = response.json()["view"]
    assert view["phase"] == "move"
    assert set(view["board"]["highlighted_sense_area"]) == {
        "d1",
        "e1",
        "f1",
        "d2",
        "e2",
        "f2",
        "d3",
        "e3",
        "f3",
    }


def test_move_before_sense_is_rejected():
    client = TestClient(app)
    game_id = _new_game(client)

    response = client.post(f"/api/games/{game_id}/move", json={"source": "e2", "target": "e4"})

    assert response.status_code == 409


def test_command_for_missing_game_returns_not_found():
    client = TestClient(app)

    response = client.post("/api/games/missing-game/sense", json={"center": "e2"})

    assert response.status_code == 404


def test_pass_after_sense_runs_bot_and_clears_sense_window():
    client = TestClient(app)
    game_id = _new_game(client)
    client.post(f"/api/games/{game_id}/sense", json={"center": "e2"})

    response = client.post(f"/api/games/{game_id}/pass")

    assert response.status_code == 200
    view = response.json()["view"]
    assert view["phase"] == "sense"
    assert view["turn"] == "white"
    assert view["board"]["highlighted_sense_area"] == []
    assert view["board"]["visible_opponent_pieces"] == []
    messages = [event["message"] for event in view["events"]]
    assert "Waiting for opponent to act." in messages
    assert "Your turn to sense." in messages


def test_resign_completes_game():
    client = TestClient(app)
    game_id = _new_game(client)

    response = client.post(f"/api/games/{game_id}/resign")

    assert response.status_code == 200
    assert response.json()["view"]["status"] == "complete"
