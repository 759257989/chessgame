# Reconnaissance Blind Chess

Local web implementation of Reconnaissance Blind Chess with a React frontend and FastAPI backend. Stage 1 is a static player-view shell: the client renders a sanitized `PlayerView` fixture while the backend exposes starter health and contract endpoints.

## Development

Install server dependencies:

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Run the server:

```bash
make server-dev
```

Install client dependencies:

```bash
cd client
npm install
```

Run the Stage 1 client:

```bash
make client-dev
```

The Vite dev server serves the static RBC game page and proxies API calls to `http://127.0.0.1:8000`.

## Validation

Run focused checks:

```bash
make server-test
make client-test
make client-build
```

Run the full local validation suite:

```bash
make test
```

Equivalent direct client test command:

```bash
cd client
npm run test -- --run
```

## Command Reference

```bash
make server-dev     # FastAPI dev server on 127.0.0.1:8000
make client-dev     # Vite dev server on 127.0.0.1
make server-test    # Backend pytest suite
make client-test    # Vitest component tests
make client-build   # TypeScript and Vite production build
make test           # Backend tests, client tests, and client build
```
