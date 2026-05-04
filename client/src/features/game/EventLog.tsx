import type { GameEventView } from "./types";

export function EventLog({ events }: { events: GameEventView[] }) {
  return (
    <section className="event-log" aria-label="Game events">
      {events.map((event) => (
        <article className="event-card" key={event.id}>
          <div className="event-card-title">
            <strong>RBC</strong>
            <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleTimeString()}</time>
          </div>
          <p>{event.message}</p>
        </article>
      ))}
    </section>
  );
}
