from app.bots.attacker_bot import AttackerBot
from app.bots.random_bot import RandomBot
from app.bots.registry import get_bot_spec, list_bot_specs
from app.bots.trout_bot import TroutBot
from app.domain.types import BotAvailability


def test_registry_lists_random_available():
    bots = list_bot_specs()

    random_bot = next(bot for bot in bots if bot.id == "random")
    attacker_bot = next(bot for bot in bots if bot.id == "attacker")

    assert random_bot.availability == BotAvailability.AVAILABLE
    assert random_bot.factory is RandomBot
    assert attacker_bot.availability == BotAvailability.AVAILABLE
    assert attacker_bot.factory is AttackerBot


def test_registry_marks_advanced_bots_unavailable_initially(monkeypatch):
    monkeypatch.delenv("STOCKFISH_PATH", raising=False)
    unavailable_ids = {"trout", "oracle", "marmot"}

    specs = {bot.id: bot for bot in list_bot_specs()}

    assert unavailable_ids <= specs.keys()
    for bot_id in unavailable_ids:
        assert specs[bot_id].availability == BotAvailability.UNAVAILABLE
        assert specs[bot_id].factory is None
        assert specs[bot_id].unavailable_reason
    assert get_bot_spec("oracle").unavailable_reason == "Not bundled in the local MVP"


def test_registry_enables_trout_when_stockfish_binary_is_executable(monkeypatch, tmp_path):
    binary = tmp_path / "stockfish"
    binary.write_text("#!/bin/sh\nexit 0\n")
    binary.chmod(0o700)
    monkeypatch.setenv("STOCKFISH_PATH", str(binary))

    trout = get_bot_spec("trout")

    assert trout.availability == BotAvailability.AVAILABLE
    assert trout.factory is not None
    assert isinstance(trout.factory(), TroutBot)


def test_random_bot_returns_none_when_no_actions():
    bot = RandomBot()

    assert bot.choose_sense([], [], seconds_left=10.0) is None
    assert bot.choose_move([], seconds_left=10.0) is None


def test_random_bot_chooses_from_available_actions(monkeypatch):
    choices: list[list[str]] = []

    def choose_first(actions: list[str]) -> str:
        choices.append(actions)
        return actions[0]

    monkeypatch.setattr("app.bots.random_bot.random.choice", choose_first)
    bot = RandomBot()

    assert bot.choose_sense(["a1", "b2"], ["a2a3"], seconds_left=10.0) == "a1"
    assert bot.choose_move(["a2a3", "b2b3"], seconds_left=10.0) == "a2a3"
    assert choices == [["a1", "b2"], ["a2a3", "b2b3"]]
