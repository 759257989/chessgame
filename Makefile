.PHONY: server-dev server-test client-dev client-test client-build test

server-dev:
	cd server && .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

server-test:
	cd server && .venv/bin/pytest -q

client-dev:
	npm --prefix client run dev -- --host 127.0.0.1

client-test:
	npm --prefix client run test -- --run

client-build:
	npm --prefix client run build

test: server-test client-test client-build
