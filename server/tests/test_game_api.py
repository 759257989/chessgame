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
    assert bots["attacker"]["availability"] == "available"
    assert bots["oracle"]["availability"] == "unavailable"
    assert bots["oracle"]["unavailable_reason"] == "Not bundled in the local MVP"


def test_create_game_accepts_attacker_bot():
    client = _client()

    response = client.post("/api/games", json={"human_color": "white", "bot_id": "attacker"})

    assert response.status_code == 200
    view = response.json()["view"]
    assert view["opponent"]["name"] == "attacker"


def test_pass_runs_random_bot_and_returns_to_human_sense():
    client = _client()
    created = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})
    game_id = created.json()["view"]["game_id"]
    client.post(f"/api/games/{game_id}/sense", json={"center": "e2"})

    response = client.post(f"/api/games/{game_id}/pass")

    assert response.status_code == 200
    view = response.json()["view"]
    assert view["turn"] == "white"
    assert view["phase"] == "sense"
    assert view["board"]["highlighted_sense_area"] == []
    assert view["board"]["visible_opponent_pieces"] == []
    messages = [event["message"] for event in view["events"]]
    assert "You passed." in messages
    assert "Your turn to sense." in messages
    assert any(message.startswith("Opponent ") for message in messages)


def test_move_runs_random_bot_updates_own_pieces_and_hides_bot_sense():
    client = _client()
    created = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})
    game_id = created.json()["view"]["game_id"]
    client.post(f"/api/games/{game_id}/sense", json={"center": "e2"})

    response = client.post(f"/api/games/{game_id}/move", json={"source": "e2", "target": "e4"})

    assert response.status_code == 200
    view = response.json()["view"]
    own_piece_squares = {piece["square"] for piece in view["board"]["own_pieces"]}
    assert view["turn"] == "white"
    assert view["phase"] == "sense"
    assert "e4" in own_piece_squares
    assert "e2" not in own_piece_squares
    assert view["board"]["highlighted_sense_area"] == []
    assert view["board"]["visible_opponent_pieces"] == []


def test_black_human_gets_first_turn_after_opening_bot_move():
    client = _client()

    response = client.post("/api/games", json={"human_color": "black", "bot_id": "random"})

    assert response.status_code == 200
    view = response.json()["view"]
    assert view["you"]["color"] == "black"
    assert view["turn"] == "black"
    assert view["phase"] == "sense"
    assert view["board"]["visible_opponent_pieces"] == []
    messages = [event["message"] for event in view["events"]]
    assert "Your turn to sense." in messages
    assert any(message.startswith("Opponent ") for message in messages)
