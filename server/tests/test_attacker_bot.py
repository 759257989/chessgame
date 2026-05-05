from app.bots.attacker_bot import AttackerBot


def test_attacker_bot_prefers_opening_plan_moves_in_order():
    bot = AttackerBot()

    assert bot.choose_move(["a2a3", "d1h5", "e2e4"], seconds_left=10.0) == "e2e4"
    assert bot.choose_move(["a2a3", "d1h5"], seconds_left=10.0) == "d1h5"


def test_attacker_bot_targets_sensed_king_square_before_opening_plan():
    bot = AttackerBot()

    bot.handle_sense_result([("e8", "king", "black")])

    assert bot.choose_move(["e2e4", "d1e8"], seconds_left=10.0) == "d1e8"


def test_attacker_bot_falls_back_to_available_move(monkeypatch):
    def choose_last(actions: list[str]) -> str:
        return actions[-1]

    monkeypatch.setattr("app.bots.attacker_bot.random.choice", choose_last)
    bot = AttackerBot()

    assert bot.choose_sense(["a1", "b2"], ["a2a3"], seconds_left=10.0) == "b2"
    assert bot.choose_move(["a2a3", "b2b3"], seconds_left=10.0) == "b2b3"
    assert bot.choose_sense([], [], seconds_left=10.0) is None
    assert bot.choose_move([], seconds_left=10.0) is None
