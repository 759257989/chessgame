from pydantic import BaseModel


class ChessClock(BaseModel):
    initial_seconds: float
    increment_seconds: float = 0
    active_seconds_left: float | None = None
    active_started_at: float | None = None

    def model_post_init(self, __context: object) -> None:
        if self.active_seconds_left is None:
            self.active_seconds_left = float(self.initial_seconds)

    def start_turn(self, monotonic_now: float) -> None:
        self.active_started_at = monotonic_now

    def current_seconds_left(self, monotonic_now: float) -> float:
        if self.active_started_at is None:
            return float(self.active_seconds_left)
        return max(0.0, float(self.active_seconds_left) - (monotonic_now - self.active_started_at))

    def stop_turn(self, monotonic_now: float) -> None:
        remaining = self.current_seconds_left(monotonic_now)
        self.active_seconds_left = remaining + self.increment_seconds if remaining > 0 else 0.0
        self.active_started_at = None

    def is_flagged(self, monotonic_now: float) -> bool:
        return self.current_seconds_left(monotonic_now) <= 0