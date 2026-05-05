.PHONY: help server-dev server-test client-dev client-test client-build client-e2e test

help:
	@printf "RBC chess development commands:\n"
	@printf "  make server-dev    Run FastAPI on 127.0.0.1:8000\n"
	@printf "  make client-dev    Run the React client\n"
	@printf "  make server-test   Run backend pytest suite\n"
	@printf "  make client-test   Run Vitest component tests once\n"
	@printf "  make client-build  Run TypeScript and Vite build\n"
	@printf "  make client-e2e    Run Playwright browser smoke tests\n"
	@printf "  make test          Run all local validation checks\n"

server-dev:
	cd server && .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

server-test:
	cd server && PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 .venv/bin/pytest -q

client-dev:
	npm --prefix client run dev -- --host 127.0.0.1

client-test:
	npm --prefix client run test -- --run

client-build:
	npm --prefix client run build

client-e2e:
	cd client && npx playwright test

test: server-test client-test client-build
