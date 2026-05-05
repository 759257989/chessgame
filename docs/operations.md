# Operations

## Local Development

Run the backend and frontend from the repository root:

```bash
make server-dev
make client-dev
```

Open `http://127.0.0.1:5173/`. The client proxies API requests to the FastAPI server at `http://127.0.0.1:8000`.

## Runtime Model

Games are stored in backend memory only. This is deliberate for the current MVP:

- restarting the backend clears active games;
- browser refreshes can only continue while the backend process still has the game in memory;
- repeat-game creates a new in-memory game using the same setup as the current game.

## Bot Availability

Playable bots:

- `random`: senses and moves randomly.
- `attacker`: senses randomly and follows a simple attacking move preference before falling back to a random move.

Unavailable placeholders:

- `trout`
- `Oracle`
- `Marmot`

`STOCKFISH_PATH` is supported as configuration scaffolding for future Stockfish-backed bots, but the current MVP does not ship a trout/oracle/marmot implementation.

## Validation

Use these before considering a stage complete:

```bash
make server-test
make client-test
make client-build
make client-e2e
```

`make test` runs backend tests, frontend unit tests, and the production client build.

## Troubleshooting

If the page loads forever, confirm both servers are running and that the Vite proxy can reach FastAPI:

```bash
curl -s http://127.0.0.1:8000/api/health
curl -s http://127.0.0.1:5173/
```

If a game disappears after restarting the backend, start a new game or use Repeat game from an existing active browser session before restarting. Persistence is intentionally skipped for now.

If a bot is rejected as unavailable, check `GET /api/bots` and choose one with `"availability": "available"`.
