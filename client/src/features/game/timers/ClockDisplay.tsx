function formatSeconds(seconds: number) {
  const clamped = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clamped / 60);
  const remaining = String(clamped % 60).padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export function ClockDisplay({ label, seconds }: { label: string; seconds: number }) {
  return (
    <p className="clock-line">
      {label} <strong>{formatSeconds(seconds)}</strong>
    </p>
  );
}
