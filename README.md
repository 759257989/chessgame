# Reconnaissance Blind Chess

Local web implementation of Reconnaissance Blind Chess with a React frontend and FastAPI backend.

## Development

Server:

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Client:

```bash
cd client
npm install
npm run dev
```

Validation:

```bash
make test
```
