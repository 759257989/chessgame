from app.domain.clock import ChessClock


def test_clock_deducts_elapsed_time_from_active_side():
    clock = ChessClock(initial_seconds=900, increment_seconds=0)

    clock.start_turn(monotonic_now=100.0)
    clock.stop_turn(monotonic_now=115.5)

    assert clock.active_started_at is None
    assert clock.active_seconds_left == 884.5


def test_clock_applies_increment_after_turn():
    clock = ChessClock(initial_seconds=20, increment_seconds=5)

    clock.start_turn(monotonic_now=10.0)
    clock.stop_turn(monotonic_now=13.0)

    assert clock.active_seconds_left == 22.0