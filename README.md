# Reconnaissance Blind Chess

Local web implementation of Reconnaissance Blind Chess with a React frontend and FastAPI backend. The current MVP supports in-memory games against available bots, 3x3 sensing, move attempts with hidden information, live clocks, pass/resign, end conditions, and repeat-game from either an active or completed game.

Persistence is intentionally not included right now. Restarting the backend clears active games, and repeat-game creates a fresh in-memory game from the same setup.

## Features

- Human color selection: random, white, or black.
- Bot selection: `random` and `attacker` are playable.
- Future bot slots remain visible through the backend registry as unavailable until their dependencies are implemented.
- RBC turn flow: sense, move or pass, bot response, then the next human sense turn.
- Hidden opponent pieces are only revealed inside the active sense result.
- 15:00 clocks with 5-second increment, timeout finalization, resign, king-capture wins, and automatic RBC 50-move draw.
- Repeat game anytime from the sidebar.

## Development

Install server dependencies:

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Install client dependencies:

```bash
cd client
npm install
```

Run both dev servers from the repo root:

```bash
make server-dev
make client-dev
```

Then open `http://127.0.0.1:5173/`.

The Vite dev server proxies API calls to `http://127.0.0.1:8000`.

## Configuration

Copy `.env.example` if you want to document local environment values. `STOCKFISH_PATH` is reserved for future Stockfish-backed bots; setting it does not make trout/oracle/marmot playable yet.

## Validation

Run focused checks:

```bash
make server-test
make client-test
make client-build
make client-e2e
```

Run the full local validation suite:

```bash
make test
```

Run browser smoke tests:

```bash
cd client
npx playwright test
```

## Command Reference

```bash
make server-dev     # FastAPI dev server on 127.0.0.1:8000
make client-dev     # Vite dev server on 127.0.0.1:5173
make server-test    # Backend pytest suite
make client-test    # Vitest component tests
make client-build   # TypeScript and Vite production build
make client-e2e     # Playwright browser smoke tests
make test           # Backend tests, client tests, and client build
```
