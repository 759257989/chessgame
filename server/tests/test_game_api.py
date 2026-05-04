from fastapi.testclient import TestClient

from app.main import app


def _client() -> TestClient:
    return TestClient(app)


def test_create_game_returns_sanitized_player_view():
    client = _client()

    response = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})

    assert response.status_code == 200
    body = response.json()
    view = body["view"]
    assert view["game_id"]
    assert view["you"]["color"] == "white"
    assert view["opponent"]["name"] == "random"
    assert view["board"]["orientation"] == "white"
    assert view["board"]["own_pieces"]
    assert view["board"]["visible_opponent_pieces"] == []


def test_get_game_returns_same_game_view():
    client = _client()
    created = client.post("/api/games", json={"human_color": "black", "bot_id": "random"})
    game_id = created.json()["view"]["game_id"]

    response = client.get(f"/api/games/{game_id}")

    assert response.status_code == 200
    view = response.json()["view"]
    assert view["game_id"] == game_id
    assert view["you"]["color"] == "black"
    assert view["board"]["visible_opponent_pieces"] == []


def test_unavailable_bot_rejected():
    client = _client()

    response = client.post("/api/games", json={"human_color": "white", "bot_id": "oracle"})

    assert response.status_code == 400
    assert "not available" in response.json()["detail"]


def test_list_bots_exposes_random_and_unavailable_models():
    client = _client()

    response = client.get("/api/bots")

    assert response.status_code == 200
    bots = {bot["id"]: bot for bot in response.json()}
    assert bots["random"]["availability"] == "available"
    assert bots["oracle"]["availability"] == "unavailable"
    assert bots["oracle"]["unavailable_reason"] == "Not bundled in the local MVP"
