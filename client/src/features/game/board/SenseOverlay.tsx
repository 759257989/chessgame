export function SenseOverlay({ highlighted, knownEmpty }: { highlighted: boolean; knownEmpty: boolean }) {
  if (!highlighted && !knownEmpty) {
    return null;
  }

  return (
    <span
      className={[
        "sense-overlay",
        highlighted ? "sense-overlay-highlighted" : "",
        knownEmpty ? "sense-overlay-known-empty" : ""
      ].join(" ")}
      aria-hidden="true"
    />
  );
}
