# Reconnaissance Blind Chess

A web version of Reconnaissance Blind Chess built with React, FastAPI, and Stockfish.

The game supports hidden-information chess turns: sense a 3x3 area, then move, pass, or resign. Games are stored in backend memory for now, so restarting the backend clears active games.

## Features

- Choose human color: random, white, or black.
- Play against `random`, `attacker`, or `trout`.
- `trout` uses Stockfish for move selection.
- Sense a 3x3 board area before each move.
- Hidden opponent pieces are only shown inside the latest sense result.
- Live clocks with 15:00 + 5 second increment.
- Move attempts, pass, resign, timeout, king capture, and RBC 50-move draw.
- Repeat game anytime with the same color, bot, and timer setup.

## Quick Start With Docker

Docker is the easiest way to run the full app and share it with others.

```bash
make docker-up
```

Open:

```text
http://localhost:8081
```

The Docker version runs:

- `client`: Nginx serving the React app.
- `server`: FastAPI backend with Stockfish installed inside the container.

People using the Docker version do not need to install Stockfish on their own computer. `trout` is available by default.

Stop Docker:

```bash
make docker-down
```

Build without starting:

```bash
make docker-build
```

For a smaller local debug image without Stockfish:

```bash
INSTALL_STOCKFISH=false make docker-up
```

## Local Development

Install backend dependencies:

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Install frontend dependencies:

```bash
cd client
npm install
```

To use `trout` during local development, install Stockfish on your machine and set:

```bash
export STOCKFISH_PATH="$(which stockfish)"
```

Run the backend and frontend in two terminals from the repository root:

```bash
make server-dev
make client-dev
```

Open:

```text
http://127.0.0.1:5173
```

The Vite dev server proxies `/api` requests to `http://127.0.0.1:8000`.

## Validation

Run backend tests:

```bash
make server-test
```

Run frontend checks:

```bash
make client-test
make client-build
```

Run Playwright smoke tests:

```bash
make client-e2e
```

Run the combined local suite:

```bash
make test
```

## Troubleshooting

If the page does not load, check that both servers are running:

```bash
curl -s http://127.0.0.1:8000/api/health
curl -s http://127.0.0.1:5173/
```

If `trout` is unavailable in local development, check:

```bash
echo "$STOCKFISH_PATH"
test -x "$STOCKFISH_PATH"
```

If a game disappears after restart, start a new game. Persistence is intentionally not included yet.

## Commands

```bash
make server-dev     # Run FastAPI on 127.0.0.1:8000
make client-dev     # Run Vite on 127.0.0.1:5173
make docker-up      # Run Docker app on http://localhost:8080
make docker-down    # Stop Docker containers
make server-test    # Run backend tests
make client-test    # Run frontend tests
make client-build   # Build frontend
make client-e2e     # Run browser smoke tests
make test           # Run main local checks
```
