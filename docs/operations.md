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
- `trout`: tracks a naive single board and asks Stockfish for moves when `STOCKFISH_PATH` points to an executable Stockfish binary.

Unavailable placeholders:

- `Oracle`
- `Marmot`

If `trout` is unavailable, check that `STOCKFISH_PATH` is set in the backend process environment and points to an executable file.

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

## Docker Deployment

Run the production-style local container stack:

```bash
make docker-up
```

Open `http://localhost:8080/`.

The Docker stack is intentionally simple:

- `server` runs FastAPI on the internal Docker network at port `8000`;
- by default, the server image does not install Stockfish, so `random` and `attacker` are available;
- set `INSTALL_STOCKFISH=true` during build to install the Debian `stockfish` package and enable `trout`;
- `client` serves the built React app with Nginx on host port `8080`;
- Nginx proxies browser requests from `/api/` to `http://server:8000/api/`.

Use this model for embedding on another website:

```html
<iframe
  src="https://your-rbc-domain.example"
  width="100%"
  height="900"
  style="border: 0;"
></iframe>
```

For a real hosted deployment, put HTTPS in front of the `client` container through your platform load balancer, reverse proxy, or CDN. Keep the backend private on the Docker network unless you intentionally expose API-only access.

Docker commands:

```bash
make docker-build
make docker-up
make docker-down
```

Enable Trout in Docker:

```bash
INSTALL_STOCKFISH=true make docker-up
```

If the Stockfish build fails with apt signature or cache-space errors, Docker Desktop is usually short on builder cache space. The default Docker stack still runs the game without Trout.
