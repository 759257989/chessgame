from fastapi.testclient import TestClient

from app.main import app


def test_initial_view_never_contains_black_pieces_for_white_human():
    client = TestClient(app)

    response = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})

    pieces = response.json()["view"]["board"]["visible_opponent_pieces"]
    assert pieces == []


def test_sense_view_contains_only_window_opponent_pieces():
    client = TestClient(app)
    create = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})
    game_id = create.json()["view"]["game_id"]

    response = client.post(f"/api/games/{game_id}/sense", json={"center": "e7"})

    view = response.json()["view"]
    sensed_squares = set(view["board"]["highlighted_sense_area"])
    for piece in view["board"]["visible_opponent_pieces"]:
        assert piece["square"] in sensed_squares
