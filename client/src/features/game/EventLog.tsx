import { useState } from "react";

import type { GameEventView } from "./types";

function EventCard({ event }: { event: GameEventView }) {
  return (
    <article className="event-card">
      <div className="event-card-title">
        <strong>RBC</strong>
        <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleTimeString()}</time>
      </div>
      <p>{event.message}</p>
    </article>
  );
}

export function EventLog({ events }: { events: GameEventView[] }) {
  const [expanded, setExpanded] = useState(false);
  const [latestEvent, ...olderEvents] = events;
  const hasOlderEvents = olderEvents.length > 0;

  return (
    <section className="event-log" aria-label="Game events">
      {latestEvent ? <EventCard event={latestEvent} /> : null}
      {hasOlderEvents ? (
        <button
          className="event-log-toggle"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Hide older events" : `Show ${olderEvents.length} older events`}
        </button>
      ) : null}
      {expanded ? (
        <div className="event-log-older">
          {olderEvents.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
