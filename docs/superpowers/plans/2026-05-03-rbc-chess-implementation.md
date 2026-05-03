# Reconnaissance Blind Chess Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable local Reconnaissance Blind Chess web game where a human can choose color, challenge a registered bot, sense a 3x3 area, move/pass/resign, and finish games through king capture, timeout, resignation, or draw rules.

**Architecture:** Use a Python FastAPI backend as the only owner of ground-truth board state, RBC rules, bot turns, clocks, and information hiding. Use a React/TypeScript frontend that renders only a sanitized `PlayerView`, never the full hidden board.

**Tech Stack:** Python 3.11+, FastAPI, pytest, reconchess, python-chess, React, TypeScript, Vite, Vitest, Testing Library, Playwright.

---

## How To Use This Plan

Work in stage order. A stage is complete only when every validation command for that stage passes and the stage has a small commit. When parallel agents are suggested, assign each agent the listed file ownership and do not let two agents edit the same file set at the same time.

All file paths are relative to `/Users/yuwang/Desktop/chessgame`.

Recommended commit style:

```bash
git add <changed-files>
git commit -m "stage N: concise summary"
```

If the repo is not initialized, initialize it before Stage 0:

```bash
git init
git add docs/rbc-chess-design.md docs/superpowers/plans/2026-05-03-rbc-chess-implementation.md
git commit -m "docs: add rbc design and implementation plan"
```

## Stage Dependency Map

```text
Stage 0: Workspace skeleton
  -> Stage 1A: Backend contracts
  -> Stage 1B: Static frontend shell
  -> Stage 1C: Developer docs and scripts

Stage 2: Backend game core
  -> Stage 3: API integration and random bot
  -> Stage 4: Clock and end conditions

Stage 5A: Frontend API/store integration
Stage 5B: Board interaction UX
Stage 5C: Sidebar/event UX
  -> Stage 6: End-to-end playable MVP

Stage 7A: Additional bots
Stage 7B: Persistence and replay
Stage 7C: Hardening and deployment docs
```

## Parallel Agent Rules

Use parallel agents when:

- The agents own disjoint directories or files.
- Their outputs are reviewed and merged by one coordinator.
- Each agent can run a narrow validation command.

Do not parallelize:

- Changes to shared API schema files without one owner.
- Engine rule changes that affect many tests.
- Dependency installation decisions.
- Fixes after an integration test failure until the failure is grouped by subsystem.

## Target File Map

### Root

- Create: `README.md` - setup, commands, project status.
- Create: `.gitignore` - Python, Node, editor, and build artifacts.
- Create: `Makefile` - common dev/test commands.
- Create: `package.json` - root script wrapper for frontend commands.

### Server

- Create: `server/pyproject.toml` - Python dependencies and pytest configuration.
- Create: `server/app/main.py` - FastAPI application factory.
- Create: `server/app/api/routes_health.py` - health endpoint.
- Create: `server/app/api/routes_bots.py` - bot registry endpoint.
- Create: `server/app/api/routes_games.py` - game command endpoints.
- Create: `server/app/api/schemas.py` - request/response DTOs.
- Create: `server/app/domain/types.py` - enums and value types.
- Create: `server/app/domain/events.py` - player-visible and internal events.
- Create: `server/app/domain/player_view.py` - sanitized view model builder.
- Create: `server/app/domain/clock.py` - server-side clock model.
- Create: `server/app/domain/game_record.py` - persisted game aggregate.
- Create: `server/app/engine/base.py` - engine protocol.
- Create: `server/app/engine/reconchess_engine.py` - reconchess-backed rules adapter.
- Create: `server/app/bots/base.py` - bot protocol.
- Create: `server/app/bots/random_bot.py` - random bot.
- Create: `server/app/bots/attacker_bot.py` - simple attacker bot.
- Create: `server/app/bots/registry.py` - metadata and factory lookup.
- Create: `server/app/services/game_service.py` - command orchestration.
- Create: `server/app/services/bot_service.py` - bot turn runner.
- Create: `server/app/services/turn_service.py` - phase validation.
- Create: `server/app/storage/memory_store.py` - in-memory game store.
- Create: `server/tests/` - backend unit and integration tests.

### Client

- Create: `client/package.json` - frontend dependencies and scripts.
- Create: `client/vite.config.ts` - Vite config and API proxy.
- Create: `client/tsconfig.json` - TypeScript config.
- Create: `client/index.html` - app host.
- Create: `client/src/main.tsx` - React entrypoint.
- Create: `client/src/app/App.tsx` - top-level routing.
- Create: `client/src/features/game/types.ts` - `PlayerView` TypeScript types.
- Create: `client/src/features/game/api/gameClient.ts` - REST client.
- Create: `client/src/features/game/state/gameStore.ts` - game state reducer/store.
- Create: `client/src/features/game/GameSetup.tsx` - setup screen.
- Create: `client/src/features/game/GamePage.tsx` - board plus sidebar layout.
- Create: `client/src/features/game/board/ChessBoard.tsx` - board container.
- Create: `client/src/features/game/board/BoardSquare.tsx` - one square.
- Create: `client/src/features/game/board/Piece.tsx` - piece renderer.
- Create: `client/src/features/game/board/SenseOverlay.tsx` - 3x3 preview/result.
- Create: `client/src/features/game/GameSidebar.tsx` - names, timers, controls.
- Create: `client/src/features/game/EventLog.tsx` - event cards.
- Create: `client/src/features/game/timers/ClockDisplay.tsx` - clock display.
- Create: `client/src/styles.css` - app styling.
- Create: `client/tests/` - Vitest component tests.
- Create: `client/e2e/` - Playwright tests.

---

## Stage 0: Workspace Skeleton

**Files:**

- Create: `.gitignore`
- Create: `README.md`
- Create: `Makefile`
- Create: `package.json`
- Create: `server/pyproject.toml`
- Create: `server/app/main.py`
- Create: `server/app/api/routes_health.py`
- Create: `server/tests/test_health.py`
- Create: `client/package.json`
- Create: `client/index.html`
- Create: `client/vite.config.ts`
- Create: `client/tsconfig.json`
- Create: `client/src/main.tsx`
- Create: `client/src/app/App.tsx`
- Create: `client/src/styles.css`

### Task 0.1: Initialize Root Project

- [ ] Create `.gitignore`.

```gitignore
.DS_Store
__pycache__/
.pytest_cache/
.venv/
server/.venv/
server/dist/
server/*.egg-info/
node_modules/
client/node_modules/
client/dist/
client/.vite/
playwright-report/
test-results/
.env
.env.*
```

- [ ] Create root `package.json`.

```json
{
  "name": "rbc-chess-workspace",
  "private": true,
  "scripts": {
    "dev": "npm --prefix client run dev",
    "build": "npm --prefix client run build",
    "test": "npm --prefix client run test"
  }
}
```

- [ ] Create `Makefile`.

```makefile
.PHONY: server-dev server-test client-dev client-test client-build test

server-dev:
	cd server && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

server-test:
	cd server && pytest -q

client-dev:
	npm --prefix client run dev -- --host 127.0.0.1

client-test:
	npm --prefix client run test -- --run

client-build:
	npm --prefix client run build

test: server-test client-test client-build
```

- [ ] Create `README.md`.

```markdown
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
```

### Task 0.2: Create Backend Health App

- [ ] Create `server/pyproject.toml`.

```toml
[project]
name = "rbc-chess-server"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.30.0",
  "pydantic>=2.8.0",
  "python-chess>=1.999",
  "reconchess>=1.6.9"
]

[project.optional-dependencies]
dev = [
  "httpx>=0.27.0",
  "pytest>=8.3.0",
  "pytest-asyncio>=0.23.0"
]

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
```

- [ ] Create `server/app/api/routes_health.py`.

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] Create `server/app/main.py`.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_health import router as health_router

app = FastAPI(title="RBC Chess")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
```

- [ ] Create `server/tests/test_health.py`.

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok():
    client = TestClient(app)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] Run backend validation.

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
```

Expected: `1 passed`.

### Task 0.3: Create Frontend Shell

- [ ] Create `client/package.json`.

```json
{
  "name": "rbc-chess-client",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "typescript": "^5.5.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "jsdom": "^24.1.1",
    "vitest": "^2.0.5"
  }
}
```

- [ ] Create `client/vite.config.ts`.

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000"
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  }
});
```

- [ ] Create `client/tsconfig.json`.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
```

- [ ] Create `client/index.html`.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RBC Chess</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] Create `client/src/app/App.tsx`.

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>Reconnaissance Blind Chess</h1>
      <p>Local game shell ready.</p>
    </main>
  );
}
```

- [ ] Create `client/src/main.tsx`.

```tsx
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] Create `client/src/styles.css`.

```css
:root {
  color: #1f2933;
  background: #f7f5f0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
```

- [ ] Create `client/src/test/setup.ts`.

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] Run frontend validation.

```bash
cd client
npm install
npm run build
npm run test -- --run
```

Expected: build succeeds; tests exit successfully with no test files or with initial smoke tests if added.

### Stage 0 Validation

- [ ] Run:

```bash
make server-test
make client-build
```

- [ ] Start both apps:

```bash
make server-dev
make client-dev
```

- [ ] Open `http://127.0.0.1:5173`.

Expected: app shell loads and `/api/health` returns `{"status":"ok"}`.

### Parallel Agent Opportunity After Stage 0

Once Stage 0 is committed, dispatch these agents in parallel:

- Agent 1: Stage 1A Backend contracts. Owns `server/app/api/schemas.py`, `server/app/domain/*`, and backend tests for models.
- Agent 2: Stage 1B Static frontend shell. Owns `client/src/features/game/*` components and CSS.
- Agent 3: Stage 1C Developer docs and smoke tests. Owns `README.md`, `Makefile`, and basic smoke test files.

Coordinator owns dependency files and resolves naming mismatches before Stage 2.

---

## Stage 1A: Backend Contracts

**Files:**

- Create: `server/app/domain/types.py`
- Create: `server/app/domain/events.py`
- Create: `server/app/domain/player_view.py`
- Create: `server/app/api/schemas.py`
- Test: `server/tests/test_player_view_contract.py`

### Task 1A.1: Define Domain Types

- [ ] Write failing tests in `server/tests/test_player_view_contract.py`.

```python
from app.domain.player_view import VisibleBoard, build_initial_player_view
from app.domain.types import Color, GamePhase


def test_initial_player_view_has_only_human_color_pieces():
    view = build_initial_player_view(
        game_id="game-1",
        human_color=Color.WHITE,
        bot_name="random",
        phase=GamePhase.SENSE,
        human_seconds_left=900,
        bot_seconds_left=900,
    )

    assert view.game_id == "game-1"
    assert view.you.color == Color.WHITE
    assert view.opponent.name == "random"
    assert all(piece.color == Color.WHITE for piece in view.board.own_pieces)
    assert view.board.visible_opponent_pieces == []


def test_visible_board_defaults_do_not_leak_opponent_state():
    board = VisibleBoard(orientation=Color.BLACK)

    assert board.own_pieces == []
    assert board.visible_opponent_pieces == []
    assert board.known_empty_squares_from_sense == []
```

- [ ] Run test to verify it fails.

```bash
cd server
pytest tests/test_player_view_contract.py -q
```

Expected: fails because modules do not exist.

- [ ] Create `server/app/domain/types.py`.

```python
from enum import StrEnum


class Color(StrEnum):
    WHITE = "white"
    BLACK = "black"

    @property
    def opposite(self) -> "Color":
        return Color.BLACK if self is Color.WHITE else Color.WHITE


class GamePhase(StrEnum):
    SETUP = "setup"
    SENSE = "sense"
    MOVE = "move"
    BOT_THINKING = "bot_thinking"
    GAME_OVER = "game_over"


class GameStatus(StrEnum):
    ACTIVE = "active"
    COMPLETE = "complete"


class WinReason(StrEnum):
    KING_CAPTURE = "king_capture"
    TIMEOUT = "timeout"
    RESIGN = "resign"
    MOVE_LIMIT = "move_limit"


class BotAvailability(StrEnum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
```

- [ ] Create `server/app/domain/player_view.py`.

```python
from pydantic import BaseModel, Field

from app.domain.types import Color, GamePhase, GameStatus, WinReason


class PieceView(BaseModel):
    square: str
    type: str
    color: Color


class PlayerSummary(BaseModel):
    name: str
    color: Color


class ClockView(BaseModel):
    human_seconds_left: float
    bot_seconds_left: float


class VisibleBoard(BaseModel):
    orientation: Color
    own_pieces: list[PieceView] = Field(default_factory=list)
    visible_opponent_pieces: list[PieceView] = Field(default_factory=list)
    known_empty_squares_from_sense: list[str] = Field(default_factory=list)
    highlighted_sense_area: list[str] = Field(default_factory=list)
    last_move: str | None = None
    last_capture_square: str | None = None


class GameResultView(BaseModel):
    winner: Color | None = None
    reason: WinReason | None = None
    message: str | None = None


class GameEventView(BaseModel):
    id: str
    type: str
    message: str
    created_at: str


class PlayerView(BaseModel):
    game_id: str
    status: GameStatus = GameStatus.ACTIVE
    phase: GamePhase
    turn: Color
    you: PlayerSummary
    opponent: PlayerSummary
    board: VisibleBoard
    clocks: ClockView
    selectable_sense_centers: list[str] = Field(default_factory=list)
    legal_move_uci: list[str] = Field(default_factory=list)
    events: list[GameEventView] = Field(default_factory=list)
    result: GameResultView | None = None


def _starting_pieces(color: Color) -> list[PieceView]:
    back_rank = "1" if color is Color.WHITE else "8"
    pawn_rank = "2" if color is Color.WHITE else "7"
    pieces = [
        ("a" + back_rank, "rook"),
        ("b" + back_rank, "knight"),
        ("c" + back_rank, "bishop"),
        ("d" + back_rank, "queen"),
        ("e" + back_rank, "king"),
        ("f" + back_rank, "bishop"),
        ("g" + back_rank, "knight"),
        ("h" + back_rank, "rook"),
    ]
    pieces.extend((file + pawn_rank, "pawn") for file in "abcdefgh")
    return [PieceView(square=square, type=piece_type, color=color) for square, piece_type in pieces]


def build_initial_player_view(
    game_id: str,
    human_color: Color,
    bot_name: str,
    phase: GamePhase,
    human_seconds_left: float,
    bot_seconds_left: float,
) -> PlayerView:
    return PlayerView(
        game_id=game_id,
        phase=phase,
        turn=Color.WHITE,
        you=PlayerSummary(name="You", color=human_color),
        opponent=PlayerSummary(name=bot_name, color=human_color.opposite),
        board=VisibleBoard(orientation=human_color, own_pieces=_starting_pieces(human_color)),
        clocks=ClockView(human_seconds_left=human_seconds_left, bot_seconds_left=bot_seconds_left),
        selectable_sense_centers=[file + rank for rank in "12345678" for file in "abcdefgh"],
    )
```

- [ ] Create `server/app/domain/events.py`.

```python
from datetime import datetime, timezone
from uuid import uuid4

from app.domain.player_view import GameEventView


def player_event(event_type: str, message: str) -> GameEventView:
    return GameEventView(
        id=str(uuid4()),
        type=event_type,
        message=message,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
```

- [ ] Create `server/app/api/schemas.py`.

```python
from pydantic import BaseModel, Field

from app.domain.player_view import PlayerView
from app.domain.types import BotAvailability


class TimerRequest(BaseModel):
    initial_seconds: int = Field(default=900, ge=1)
    increment_seconds: int = Field(default=0, ge=0)


class CreateGameRequest(BaseModel):
    human_color: str = "random"
    bot_id: str = "random"
    timer: TimerRequest = Field(default_factory=TimerRequest)


class SenseRequest(BaseModel):
    center: str


class MoveRequest(BaseModel):
    source: str
    target: str
    promotion: str | None = None


class BotResponse(BaseModel):
    id: str
    name: str
    description: str
    availability: BotAvailability
    unavailable_reason: str | None = None


class GameResponse(BaseModel):
    view: PlayerView
```

- [ ] Run validation.

```bash
cd server
pytest tests/test_player_view_contract.py -q
```

Expected: `2 passed`.

---

## Stage 1B: Static Frontend Shell

**Files:**

- Create: `client/src/features/game/types.ts`
- Create: `client/src/features/game/GameSetup.tsx`
- Create: `client/src/features/game/GamePage.tsx`
- Create: `client/src/features/game/board/ChessBoard.tsx`
- Create: `client/src/features/game/board/BoardSquare.tsx`
- Create: `client/src/features/game/board/Piece.tsx`
- Create: `client/src/features/game/board/SenseOverlay.tsx`
- Create: `client/src/features/game/GameSidebar.tsx`
- Create: `client/src/features/game/EventLog.tsx`
- Create: `client/src/features/game/timers/ClockDisplay.tsx`
- Modify: `client/src/app/App.tsx`
- Modify: `client/src/styles.css`
- Test: `client/src/features/game/GamePage.test.tsx`

### Task 1B.1: Add Static PlayerView Fixture

- [ ] Create `client/src/features/game/types.ts`.

```ts
export type Color = "white" | "black";
export type GamePhase = "setup" | "sense" | "move" | "bot_thinking" | "game_over";
export type GameStatus = "active" | "complete";

export interface PieceView {
  square: string;
  type: "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
  color: Color;
}

export interface VisibleBoard {
  orientation: Color;
  ownPieces: PieceView[];
  visibleOpponentPieces: PieceView[];
  knownEmptySquaresFromSense: string[];
  highlightedSenseArea: string[];
  lastMove: string | null;
  lastCaptureSquare: string | null;
}

export interface PlayerSummary {
  name: string;
  color: Color;
}

export interface ClockView {
  humanSecondsLeft: number;
  botSecondsLeft: number;
}

export interface GameEventView {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface PlayerView {
  gameId: string;
  status: GameStatus;
  phase: GamePhase;
  turn: Color;
  you: PlayerSummary;
  opponent: PlayerSummary;
  board: VisibleBoard;
  clocks: ClockView;
  selectableSenseCenters: string[];
  legalMoveUci: string[];
  events: GameEventView[];
}
```

- [ ] Create `client/src/features/game/staticView.ts`.

```ts
import type { PlayerView, PieceView } from "./types";

const whiteBackRank: PieceView[] = [
  { square: "a1", type: "rook", color: "white" },
  { square: "b1", type: "knight", color: "white" },
  { square: "c1", type: "bishop", color: "white" },
  { square: "d1", type: "queen", color: "white" },
  { square: "e1", type: "king", color: "white" },
  { square: "f1", type: "bishop", color: "white" },
  { square: "g1", type: "knight", color: "white" },
  { square: "h1", type: "rook", color: "white" }
];

const whitePawns: PieceView[] = "abcdefgh".split("").map((file) => ({
  square: `${file}2`,
  type: "pawn",
  color: "white"
}));

export const staticPlayerView: PlayerView = {
  gameId: "static",
  status: "active",
  phase: "sense",
  turn: "white",
  you: { name: "You", color: "white" },
  opponent: { name: "Oracle", color: "black" },
  board: {
    orientation: "white",
    ownPieces: [...whiteBackRank, ...whitePawns],
    visibleOpponentPieces: [{ square: "g5", type: "knight", color: "black" }],
    knownEmptySquaresFromSense: ["f4", "g4", "h4", "f5", "h5", "f6", "g6", "h6"],
    highlightedSenseArea: ["f4", "g4", "h4", "f5", "g5", "h5", "f6", "g6", "h6"],
    lastMove: null,
    lastCaptureSquare: null
  },
  clocks: { humanSecondsLeft: 900, botSecondsLeft: 900 },
  selectableSenseCenters: [],
  legalMoveUci: [],
  events: [
    { id: "1", type: "sense_prompt", message: "Your turn to sense.", createdAt: new Date().toISOString() }
  ]
};
```

### Task 1B.2: Build Static Board and Sidebar

- [ ] Create `client/src/features/game/board/Piece.tsx`.

```tsx
import type { PieceView } from "../types";

const symbols: Record<PieceView["color"], Record<PieceView["type"], string>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" }
};

export function Piece({ piece }: { piece: PieceView }) {
  return <span className={`piece piece-${piece.color}`}>{symbols[piece.color][piece.type]}</span>;
}
```

- [ ] Create `client/src/features/game/board/BoardSquare.tsx`.

```tsx
import type { PieceView } from "../types";
import { Piece } from "./Piece";

interface BoardSquareProps {
  square: string;
  piece?: PieceView;
  tone: "light" | "dark";
  highlighted: boolean;
  knownEmpty: boolean;
}

export function BoardSquare({ square, piece, tone, highlighted, knownEmpty }: BoardSquareProps) {
  return (
    <button
      className={[
        "board-square",
        `board-square-${tone}`,
        highlighted ? "board-square-highlighted" : "",
        knownEmpty ? "board-square-known-empty" : ""
      ].join(" ")}
      aria-label={square}
      type="button"
    >
      {piece ? <Piece piece={piece} /> : null}
      <span className="square-coordinate">{square}</span>
    </button>
  );
}
```

- [ ] Create `client/src/features/game/board/ChessBoard.tsx`.

```tsx
import type { PieceView, VisibleBoard } from "../types";
import { BoardSquare } from "./BoardSquare";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

function pieceAt(square: string, pieces: PieceView[]) {
  return pieces.find((piece) => piece.square === square);
}

export function ChessBoard({ board }: { board: VisibleBoard }) {
  const visiblePieces = [...board.ownPieces, ...board.visibleOpponentPieces];
  const displayedRanks = board.orientation === "white" ? ranks : [...ranks].reverse();
  const displayedFiles = board.orientation === "white" ? files : [...files].reverse();

  return (
    <section className="board-wrap" aria-label="Chess board">
      <div className="chess-board">
        {displayedRanks.flatMap((rank, rankIndex) =>
          displayedFiles.map((file, fileIndex) => {
            const square = `${file}${rank}`;
            const tone = (rankIndex + fileIndex) % 2 === 0 ? "light" : "dark";
            return (
              <BoardSquare
                key={square}
                square={square}
                piece={pieceAt(square, visiblePieces)}
                tone={tone}
                highlighted={board.highlightedSenseArea.includes(square)}
                knownEmpty={board.knownEmptySquaresFromSense.includes(square)}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
```

- [ ] Create `client/src/features/game/timers/ClockDisplay.tsx`.

```tsx
function formatSeconds(seconds: number) {
  const clamped = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clamped / 60);
  const remaining = String(clamped % 60).padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export function ClockDisplay({ label, seconds }: { label: string; seconds: number }) {
  return (
    <p className="clock-line">
      {label} <strong>{formatSeconds(seconds)}</strong>
    </p>
  );
}
```

- [ ] Create `client/src/features/game/EventLog.tsx`.

```tsx
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
```

- [ ] Create `client/src/features/game/GameSidebar.tsx`.

```tsx
import { Crown } from "lucide-react";

import { EventLog } from "./EventLog";
import { ClockDisplay } from "./timers/ClockDisplay";
import type { PlayerView } from "./types";

export function GameSidebar({ view }: { view: PlayerView }) {
  return (
    <aside className="game-sidebar">
      <div className="player-row">
        <span><Crown size={18} /> {view.you.name}</span>
        <strong>{view.opponent.name}</strong>
      </div>
      <div className="phase-message">
        {view.phase === "sense" ? "Your turn to sense" : "Choose your move"}
      </div>
      <ClockDisplay label="You have" seconds={view.clocks.humanSecondsLeft} />
      <ClockDisplay label="Opponent has" seconds={view.clocks.botSecondsLeft} />
      <div className="control-row">
        <button type="button">Pass</button>
        <button type="button">Resign</button>
      </div>
      <EventLog events={view.events} />
    </aside>
  );
}
```

- [ ] Create `client/src/features/game/GamePage.tsx`.

```tsx
import { ChessBoard } from "./board/ChessBoard";
import { GameSidebar } from "./GameSidebar";
import type { PlayerView } from "./types";

export function GamePage({ view }: { view: PlayerView }) {
  return (
    <main className="game-page">
      <ChessBoard board={view.board} />
      <GameSidebar view={view} />
    </main>
  );
}
```

- [ ] Modify `client/src/app/App.tsx`.

```tsx
import { GamePage } from "../features/game/GamePage";
import { staticPlayerView } from "../features/game/staticView";

export function App() {
  return <GamePage view={staticPlayerView} />;
}
```

- [ ] Modify `client/src/styles.css` to replace the shell styles.

```css
:root {
  color: #1f2933;
  background: #f8f7f4;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button {
  font: inherit;
}

.game-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(320px, 68vmin) minmax(280px, 420px);
  gap: 48px;
  align-items: start;
  justify-content: center;
  padding: 40px;
}

.board-wrap {
  width: min(68vmin, calc(100vw - 32px));
  aspect-ratio: 1;
}

.chess-board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: 100%;
  aspect-ratio: 1;
  box-shadow: 0 6px 22px rgb(30 23 16 / 12%);
}

.board-square {
  position: relative;
  display: grid;
  place-items: center;
  border: 0;
  min-width: 0;
  min-height: 0;
  cursor: pointer;
}

.board-square-light {
  background: #a79370;
}

.board-square-dark {
  background: #765237;
}

.board-square-highlighted {
  outline: 3px solid #c8915f;
  outline-offset: -3px;
}

.board-square-known-empty {
  background: #f0d8ad;
}

.piece {
  font-size: clamp(32px, 7vmin, 72px);
  line-height: 1;
  text-shadow: 0 2px 2px rgb(0 0 0 / 28%);
}

.piece-white {
  color: #fff;
}

.piece-black {
  color: #111827;
}

.square-coordinate {
  position: absolute;
  left: 4px;
  bottom: 2px;
  font-size: clamp(10px, 1.6vmin, 16px);
  color: rgb(255 255 255 / 60%);
}

.game-sidebar {
  display: grid;
  gap: 20px;
  padding-top: 8px;
}

.player-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 22px;
}

.player-row span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}

.phase-message {
  font-size: 26px;
  font-weight: 700;
}

.clock-line {
  margin: 0;
  font-size: 22px;
}

.control-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 2px solid #0b74ff;
  border-radius: 8px;
  overflow: hidden;
}

.control-row button {
  min-height: 64px;
  border: 0;
  background: #fff;
  color: #0b74ff;
  font-size: 28px;
  cursor: pointer;
}

.control-row button + button {
  border-left: 2px solid #0b74ff;
}

.event-log {
  display: grid;
  gap: 16px;
}

.event-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 18px rgb(15 23 42 / 8%);
}

.event-card-title {
  display: flex;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #edf0f2;
  color: #6b7280;
}

.event-card p {
  margin: 0;
  padding: 18px;
  font-size: 20px;
}

@media (max-width: 900px) {
  .game-page {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 16px;
  }

  .board-wrap {
    width: min(100%, 620px);
    margin: 0 auto;
  }
}
```

- [ ] Run validation.

```bash
cd client
npm run build
```

Expected: TypeScript and Vite build succeed.

---

## Stage 1C: Developer Docs And Smoke Tests

**Files:**

- Modify: `README.md`
- Modify: `Makefile`
- Create: `client/src/features/game/GamePage.test.tsx`

### Task 1C.1: Add Frontend Smoke Test

- [ ] Create `client/src/features/game/GamePage.test.tsx`.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GamePage } from "./GamePage";
import { staticPlayerView } from "./staticView";

describe("GamePage", () => {
  it("renders board, timers, and turn message", () => {
    render(<GamePage view={staticPlayerView} />);

    expect(screen.getByLabelText("Chess board")).toBeInTheDocument();
    expect(screen.getByText("Your turn to sense")).toBeInTheDocument();
    expect(screen.getByText(/You have/)).toBeInTheDocument();
    expect(screen.getByText(/Opponent has/)).toBeInTheDocument();
  });
});
```

- [ ] Run validation.

```bash
cd client
npm run test -- --run
```

Expected: `GamePage` test passes.

### Stage 1 Validation

- [ ] Run full validation.

```bash
make server-test
make client-test
make client-build
```

Expected: all commands exit 0.

---

## Stage 2: Backend Game Core

**Files:**

- Create: `server/app/domain/clock.py`
- Create: `server/app/domain/game_record.py`
- Create: `server/app/engine/base.py`
- Create: `server/app/engine/reconchess_engine.py`
- Create: `server/app/services/turn_service.py`
- Create: `server/app/storage/memory_store.py`
- Test: `server/tests/test_clock.py`
- Test: `server/tests/test_turn_service.py`
- Test: `server/tests/test_reconchess_engine.py`

### Task 2.1: Clock Model

- [ ] Create failing tests in `server/tests/test_clock.py`.

```python
from app.domain.clock import ChessClock


def test_clock_deducts_elapsed_time_from_active_side():
    clock = ChessClock(initial_seconds=900, increment_seconds=0)

    clock.start_turn(monotonic_now=100.0)
    clock.stop_turn(monotonic_now=115.5)

    assert clock.active_started_at is None
    assert clock.active_seconds_left == 884.5


def test_clock_applies_increment_after_turn():
    clock = ChessClock(initial_seconds=20, increment_seconds=5)

    clock.start_turn(monotonic_now=10.0)
    clock.stop_turn(monotonic_now=13.0)

    assert clock.active_seconds_left == 22.0
```

- [ ] Run failing tests.

```bash
cd server
pytest tests/test_clock.py -q
```

Expected: import failure.

- [ ] Create `server/app/domain/clock.py`.

```python
from pydantic import BaseModel


class ChessClock(BaseModel):
    initial_seconds: float
    increment_seconds: float = 0
    active_seconds_left: float | None = None
    active_started_at: float | None = None

    def model_post_init(self, __context: object) -> None:
        if self.active_seconds_left is None:
            self.active_seconds_left = float(self.initial_seconds)

    def start_turn(self, monotonic_now: float) -> None:
        self.active_started_at = monotonic_now

    def current_seconds_left(self, monotonic_now: float) -> float:
        if self.active_started_at is None:
            return float(self.active_seconds_left)
        return max(0.0, float(self.active_seconds_left) - (monotonic_now - self.active_started_at))

    def stop_turn(self, monotonic_now: float) -> None:
        remaining = self.current_seconds_left(monotonic_now)
        self.active_seconds_left = remaining + self.increment_seconds if remaining > 0 else 0.0
        self.active_started_at = None

    def is_flagged(self, monotonic_now: float) -> bool:
        return self.current_seconds_left(monotonic_now) <= 0
```

- [ ] Run validation.

```bash
cd server
pytest tests/test_clock.py -q
```

Expected: `2 passed`.

### Task 2.2: Turn Service

- [ ] Create failing tests in `server/tests/test_turn_service.py`.

```python
import pytest

from app.domain.types import Color, GamePhase
from app.services.turn_service import TurnError, TurnService


def test_user_must_sense_before_moving():
    service = TurnService(turn=Color.WHITE, human_color=Color.WHITE, phase=GamePhase.SENSE)

    with pytest.raises(TurnError, match="Cannot move during sense phase"):
        service.require_human_move()


def test_sense_advances_to_move_phase():
    service = TurnService(turn=Color.WHITE, human_color=Color.WHITE, phase=GamePhase.SENSE)

    service.after_human_sense()

    assert service.phase == GamePhase.MOVE


def test_move_advances_to_bot_thinking():
    service = TurnService(turn=Color.WHITE, human_color=Color.WHITE, phase=GamePhase.MOVE)

    service.after_human_move()

    assert service.phase == GamePhase.BOT_THINKING
    assert service.turn == Color.BLACK
```

- [ ] Create `server/app/services/turn_service.py`.

```python
from dataclasses import dataclass

from app.domain.types import Color, GamePhase


class TurnError(ValueError):
    pass


@dataclass
class TurnService:
    turn: Color
    human_color: Color
    phase: GamePhase

    def require_human_sense(self) -> None:
        if self.turn != self.human_color:
            raise TurnError("It is not the human turn")
        if self.phase != GamePhase.SENSE:
            raise TurnError(f"Cannot sense during {self.phase} phase")

    def require_human_move(self) -> None:
        if self.turn != self.human_color:
            raise TurnError("It is not the human turn")
        if self.phase == GamePhase.SENSE:
            raise TurnError("Cannot move during sense phase")
        if self.phase != GamePhase.MOVE:
            raise TurnError(f"Cannot move during {self.phase} phase")

    def after_human_sense(self) -> None:
        self.require_human_sense()
        self.phase = GamePhase.MOVE

    def after_human_move(self) -> None:
        self.require_human_move()
        self.turn = self.human_color.opposite
        self.phase = GamePhase.BOT_THINKING

    def after_bot_move(self) -> None:
        self.turn = self.human_color
        self.phase = GamePhase.SENSE
```

- [ ] Run validation.

```bash
cd server
pytest tests/test_turn_service.py -q
```

Expected: `3 passed`.

### Task 2.3: Reconchess Engine Adapter

- [ ] Create `server/app/engine/base.py`.

```python
from typing import Protocol

from app.domain.types import Color


class RbcEngine(Protocol):
    def sense_actions(self) -> list[str]: ...
    def move_actions(self) -> list[str]: ...
    def sense(self, center: str) -> list[tuple[str, str | None, Color | None]]: ...
    def move(self, uci: str | None) -> tuple[str | None, str | None, str | None]: ...
    def is_over(self) -> bool: ...
```

- [ ] Create failing tests in `server/tests/test_reconchess_engine.py`.

```python
from app.engine.reconchess_engine import ReconchessEngine


def test_engine_sense_returns_nine_or_fewer_squares_on_corner():
    engine = ReconchessEngine()

    result = engine.sense("a1")

    squares = {square for square, _piece_type, _color in result}
    assert squares == {"a1", "a2", "b1", "b2"}


def test_engine_exposes_uci_move_actions():
    engine = ReconchessEngine()

    moves = engine.move_actions()

    assert "e2e4" in moves
    assert "g1f3" in moves
```

- [ ] Create `server/app/engine/reconchess_engine.py`.

```python
import chess

from app.domain.types import Color


def _to_square_name(square: int) -> str:
    return chess.square_name(square)


def _to_square(square_name: str) -> int:
    return chess.parse_square(square_name)


def _piece_type_name(piece: chess.Piece | None) -> str | None:
    if piece is None:
        return None
    return chess.piece_name(piece.piece_type)


def _piece_color(piece: chess.Piece | None) -> Color | None:
    if piece is None:
        return None
    return Color.WHITE if piece.color == chess.WHITE else Color.BLACK


class ReconchessEngine:
    def __init__(self) -> None:
        self.board = chess.Board()

    def sense_actions(self) -> list[str]:
        return [_to_square_name(square) for square in chess.SQUARES]

    def move_actions(self) -> list[str]:
        return [move.uci() for move in self.board.pseudo_legal_moves]

    def sense(self, center: str) -> list[tuple[str, str | None, Color | None]]:
        center_square = _to_square(center)
        center_file = chess.square_file(center_square)
        center_rank = chess.square_rank(center_square)
        result: list[tuple[str, str | None, Color | None]] = []

        for file_index in range(center_file - 1, center_file + 2):
            for rank_index in range(center_rank - 1, center_rank + 2):
                if 0 <= file_index <= 7 and 0 <= rank_index <= 7:
                    square = chess.square(file_index, rank_index)
                    piece = self.board.piece_at(square)
                    result.append((_to_square_name(square), _piece_type_name(piece), _piece_color(piece)))

        return result

    def move(self, uci: str | None) -> tuple[str | None, str | None, str | None]:
        if uci is None:
            return None, None, None

        move = chess.Move.from_uci(uci)
        requested = move.uci()
        if move not in self.board.pseudo_legal_moves:
            return requested, None, None

        capture_square = chess.square_name(move.to_square) if self.board.is_capture(move) else None
        self.board.push(move)
        return requested, move.uci(), capture_square

    def is_over(self) -> bool:
        return self.board.king(chess.WHITE) is None or self.board.king(chess.BLACK) is None
```

- [ ] Run validation.

```bash
cd server
pytest tests/test_reconchess_engine.py tests/test_clock.py tests/test_turn_service.py -q
```

Expected: all tests pass.

Note: this first engine uses `python-chess` pseudo-legal moves and does not fully implement RBC sliding-obstruction behavior. Stage 4 replaces the risky pieces with `reconchess` behavior or explicit tests before the MVP is called complete.

### Stage 2 Validation

- [ ] Run:

```bash
make server-test
```

Expected: all backend tests pass.

### Parallel Agent Opportunity After Stage 2

Dispatch in parallel:

- Agent 1: Game API endpoints and service orchestration. Owns `server/app/api/routes_games.py`, `server/app/services/game_service.py`, `server/tests/test_game_api.py`.
- Agent 2: Bot registry and random bot. Owns `server/app/bots/*`, `server/app/services/bot_service.py`, `server/tests/test_bots.py`.
- Agent 3: Frontend API client and state. Owns `client/src/features/game/api/*`, `client/src/features/game/state/*`, related frontend tests.

Coordinator owns `server/app/api/schemas.py` and `client/src/features/game/types.ts` while reconciling response field names.

---

## Stage 3: Game API And Random Bot

**Files:**

- Create: `server/app/domain/game_record.py`
- Create: `server/app/storage/memory_store.py`
- Create: `server/app/bots/base.py`
- Create: `server/app/bots/random_bot.py`
- Create: `server/app/bots/registry.py`
- Create: `server/app/services/bot_service.py`
- Create: `server/app/services/game_service.py`
- Create: `server/app/api/routes_bots.py`
- Create: `server/app/api/routes_games.py`
- Modify: `server/app/main.py`
- Test: `server/tests/test_bot_registry.py`
- Test: `server/tests/test_game_api.py`

### Task 3.1: Bot Registry

- [ ] Create tests in `server/tests/test_bot_registry.py`.

```python
from app.bots.registry import get_bot_spec, list_bot_specs
from app.domain.types import BotAvailability


def test_registry_lists_random_available():
    bots = list_bot_specs()

    random_bot = next(bot for bot in bots if bot.id == "random")
    assert random_bot.availability == BotAvailability.AVAILABLE


def test_registry_marks_advanced_bots_unavailable_initially():
    oracle = get_bot_spec("oracle")

    assert oracle.availability == BotAvailability.UNAVAILABLE
    assert oracle.unavailable_reason == "Not bundled in the local MVP"
```

- [ ] Create `server/app/bots/base.py`.

```python
from typing import Protocol


class BotPlayer(Protocol):
    id: str
    display_name: str

    def choose_sense(self, sense_actions: list[str], move_actions: list[str], seconds_left: float) -> str | None: ...
    def handle_sense_result(self, sense_result: list[tuple[str, str | None, str | None]]) -> None: ...
    def choose_move(self, move_actions: list[str], seconds_left: float) -> str | None: ...
```

- [ ] Create `server/app/bots/random_bot.py`.

```python
import random


class RandomBot:
    id = "random"
    display_name = "random"

    def choose_sense(self, sense_actions: list[str], move_actions: list[str], seconds_left: float) -> str | None:
        return random.choice(sense_actions) if sense_actions else None

    def handle_sense_result(self, sense_result: list[tuple[str, str | None, str | None]]) -> None:
        return None

    def choose_move(self, move_actions: list[str], seconds_left: float) -> str | None:
        return random.choice(move_actions) if move_actions else None
```

- [ ] Create `server/app/bots/registry.py`.

```python
from collections.abc import Callable
from dataclasses import dataclass

from app.bots.random_bot import RandomBot
from app.domain.types import BotAvailability


@dataclass(frozen=True)
class BotSpec:
    id: str
    name: str
    description: str
    availability: BotAvailability
    factory: Callable[[], object] | None = None
    unavailable_reason: str | None = None


_REGISTRY: dict[str, BotSpec] = {
    "random": BotSpec(
        id="random",
        name="random",
        description="Senses and moves randomly.",
        availability=BotAvailability.AVAILABLE,
        factory=RandomBot,
    ),
    "attacker": BotSpec(
        id="attacker",
        name="attacker",
        description='Senses randomly and tries a simple attacking plan.',
        availability=BotAvailability.UNAVAILABLE,
        unavailable_reason="Scheduled for Stage 7",
    ),
    "trout": BotSpec(
        id="trout",
        name="trout",
        description="Tracks a naive board state and uses Stockfish.",
        availability=BotAvailability.UNAVAILABLE,
        unavailable_reason="Requires Stockfish integration",
    ),
    "oracle": BotSpec(
        id="oracle",
        name="Oracle",
        description="Tracks possible board states and uses Stockfish plus heuristics.",
        availability=BotAvailability.UNAVAILABLE,
        unavailable_reason="Not bundled in the local MVP",
    ),
    "marmot": BotSpec(
        id="marmot",
        name="Marmot",
        description="Uses Monte Carlo counterfactual regret minimization ideas.",
        availability=BotAvailability.UNAVAILABLE,
        unavailable_reason="Not bundled in the local MVP",
    ),
}


def list_bot_specs() -> list[BotSpec]:
    return list(_REGISTRY.values())


def get_bot_spec(bot_id: str) -> BotSpec:
    return _REGISTRY[bot_id]
```

- [ ] Run validation.

```bash
cd server
pytest tests/test_bot_registry.py -q
```

Expected: `2 passed`.

### Task 3.2: Game Service And API

- [ ] Create `server/app/domain/game_record.py`.

```python
from pydantic import BaseModel, Field

from app.domain.clock import ChessClock
from app.domain.events import player_event
from app.domain.player_view import GameEventView
from app.domain.types import Color, GamePhase, GameStatus
from app.engine.reconchess_engine import ReconchessEngine


class GameRecord(BaseModel):
    id: str
    status: GameStatus = GameStatus.ACTIVE
    human_color: Color
    bot_id: str
    bot_name: str
    turn: Color = Color.WHITE
    phase: GamePhase = GamePhase.SENSE
    human_clock: ChessClock
    bot_clock: ChessClock
    events: list[GameEventView] = Field(default_factory=list)

    model_config = {"arbitrary_types_allowed": True}

    engine: ReconchessEngine = Field(default_factory=ReconchessEngine)

    def add_event(self, event_type: str, message: str) -> None:
        self.events.insert(0, player_event(event_type, message))
        self.events = self.events[:20]
```

- [ ] Create `server/app/storage/memory_store.py`.

```python
from app.domain.game_record import GameRecord


class MemoryGameStore:
    def __init__(self) -> None:
        self._games: dict[str, GameRecord] = {}

    def save(self, game: GameRecord) -> None:
        self._games[game.id] = game

    def get(self, game_id: str) -> GameRecord:
        return self._games[game_id]
```

- [ ] Create `server/app/services/game_service.py`.

```python
import random
from uuid import uuid4

from app.api.schemas import CreateGameRequest
from app.bots.registry import get_bot_spec
from app.domain.clock import ChessClock
from app.domain.game_record import GameRecord
from app.domain.player_view import build_initial_player_view
from app.domain.types import BotAvailability, Color, GamePhase
from app.storage.memory_store import MemoryGameStore


class GameService:
    def __init__(self, store: MemoryGameStore) -> None:
        self.store = store

    def create_game(self, request: CreateGameRequest) -> GameRecord:
        bot_spec = get_bot_spec(request.bot_id)
        if bot_spec.availability != BotAvailability.AVAILABLE:
            raise ValueError(f"Bot {request.bot_id} is not available: {bot_spec.unavailable_reason}")

        human_color = self._choose_color(request.human_color)
        game = GameRecord(
            id=str(uuid4()),
            human_color=human_color,
            bot_id=bot_spec.id,
            bot_name=bot_spec.name,
            human_clock=ChessClock(
                initial_seconds=request.timer.initial_seconds,
                increment_seconds=request.timer.increment_seconds,
            ),
            bot_clock=ChessClock(
                initial_seconds=request.timer.initial_seconds,
                increment_seconds=request.timer.increment_seconds,
            ),
        )
        game.add_event("game_started", "Game started. Your turn to sense." if human_color is Color.WHITE else "Game started. Waiting for bot.")
        self.store.save(game)
        return game

    def view_for_human(self, game: GameRecord):
        return build_initial_player_view(
            game_id=game.id,
            human_color=game.human_color,
            bot_name=game.bot_name,
            phase=game.phase,
            human_seconds_left=game.human_clock.current_seconds_left(monotonic_now=0),
            bot_seconds_left=game.bot_clock.current_seconds_left(monotonic_now=0),
        ).model_copy(update={"events": game.events, "turn": game.turn})

    def _choose_color(self, requested: str) -> Color:
        if requested == "white":
            return Color.WHITE
        if requested == "black":
            return Color.BLACK
        return random.choice([Color.WHITE, Color.BLACK])
```

- [ ] Create `server/app/api/routes_bots.py`.

```python
from fastapi import APIRouter

from app.api.schemas import BotResponse
from app.bots.registry import list_bot_specs

router = APIRouter()


@router.get("/bots", response_model=list[BotResponse])
def list_bots() -> list[BotResponse]:
    return [
        BotResponse(
            id=bot.id,
            name=bot.name,
            description=bot.description,
            availability=bot.availability,
            unavailable_reason=bot.unavailable_reason,
        )
        for bot in list_bot_specs()
    ]
```

- [ ] Create `server/app/api/routes_games.py`.

```python
from fastapi import APIRouter, HTTPException

from app.api.schemas import CreateGameRequest, GameResponse
from app.services.game_service import GameService
from app.storage.memory_store import MemoryGameStore

router = APIRouter()
store = MemoryGameStore()
service = GameService(store)


@router.post("/games", response_model=GameResponse)
def create_game(request: CreateGameRequest) -> GameResponse:
    try:
        game = service.create_game(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return GameResponse(view=service.view_for_human(game))


@router.get("/games/{game_id}", response_model=GameResponse)
def get_game(game_id: str) -> GameResponse:
    try:
        game = store.get(game_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Game not found") from exc

    return GameResponse(view=service.view_for_human(game))
```

- [ ] Modify `server/app/main.py` imports and routers.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_bots import router as bots_router
from app.api.routes_games import router as games_router
from app.api.routes_health import router as health_router

app = FastAPI(title="RBC Chess")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(bots_router, prefix="/api")
app.include_router(games_router, prefix="/api")
```

- [ ] Create tests in `server/tests/test_game_api.py`.

```python
from fastapi.testclient import TestClient

from app.main import app


def test_create_game_returns_player_view():
    client = TestClient(app)

    response = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})

    assert response.status_code == 200
    body = response.json()
    assert body["view"]["you"]["color"] == "white"
    assert body["view"]["opponent"]["name"] == "random"
    assert body["view"]["board"]["visible_opponent_pieces"] == []


def test_unavailable_bot_rejected():
    client = TestClient(app)

    response = client.post("/api/games", json={"human_color": "white", "bot_id": "oracle"})

    assert response.status_code == 400
    assert "not available" in response.json()["detail"]
```

- [ ] Run validation.

```bash
cd server
pytest tests/test_game_api.py tests/test_bot_registry.py -q
```

Expected: all tests pass.

### Stage 3 Validation

- [ ] Run:

```bash
make server-test
```

Expected: all backend tests pass.

---

## Stage 4: Human Actions, Clock, And End Conditions

**Files:**

- Modify: `server/app/services/game_service.py`
- Modify: `server/app/api/routes_games.py`
- Modify: `server/app/domain/player_view.py`
- Modify: `server/app/engine/reconchess_engine.py`
- Test: `server/tests/test_human_actions.py`
- Test: `server/tests/test_information_hiding.py`
- Test: `server/tests/test_end_conditions.py`

### Task 4.1: Sense, Move, Pass, Resign Endpoints

- [ ] Add tests in `server/tests/test_human_actions.py`.

```python
from fastapi.testclient import TestClient

from app.main import app


def _new_game(client: TestClient) -> str:
    response = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})
    return response.json()["view"]["game_id"]


def test_human_sense_reveals_only_sense_window():
    client = TestClient(app)
    game_id = _new_game(client)

    response = client.post(f"/api/games/{game_id}/sense", json={"center": "e2"})

    assert response.status_code == 200
    view = response.json()["view"]
    assert view["phase"] == "move"
    assert set(view["board"]["highlighted_sense_area"]) == {"d1", "e1", "f1", "d2", "e2", "f2", "d3", "e3", "f3"}


def test_move_before_sense_is_rejected():
    client = TestClient(app)
    game_id = _new_game(client)

    response = client.post(f"/api/games/{game_id}/move", json={"source": "e2", "target": "e4"})

    assert response.status_code == 409


def test_resign_completes_game():
    client = TestClient(app)
    game_id = _new_game(client)

    response = client.post(f"/api/games/{game_id}/resign")

    assert response.status_code == 200
    assert response.json()["view"]["status"] == "complete"
```

- [ ] Extend `GameRecord` with transient human-visible sense data.

```python
from app.domain.player_view import GameResultView, PieceView

last_sense_area: list[str] = Field(default_factory=list)
visible_opponent_pieces: list[PieceView] = Field(default_factory=list)
known_empty_squares_from_sense: list[str] = Field(default_factory=list)
result: GameResultView | None = None
```

- [ ] Extend `GameService` with `sense`, `move`, `pass_turn`, and `resign` using these method contracts.

```python
from app.api.schemas import MoveRequest
from app.domain.player_view import GameResultView, PieceView
from app.domain.types import GamePhase, GameStatus, WinReason
from app.services.turn_service import TurnService


def sense(self, game_id: str, center: str) -> GameRecord:
    game = self.store.get(game_id)
    turn = TurnService(turn=game.turn, human_color=game.human_color, phase=game.phase)
    turn.require_human_sense()

    result = game.engine.sense(center)
    game.last_sense_area = [square for square, _piece_type, _color in result]
    game.visible_opponent_pieces = [
        PieceView(square=square, type=piece_type, color=color)
        for square, piece_type, color in result
        if piece_type is not None and color == game.human_color.opposite
    ]
    game.known_empty_squares_from_sense = [square for square, piece_type, _color in result if piece_type is None]
    game.phase = GamePhase.MOVE
    game.add_event("sense_result", f"Sensed {center}.")
    self.store.save(game)
    return game


def move(self, game_id: str, request: MoveRequest) -> GameRecord:
    game = self.store.get(game_id)
    turn = TurnService(turn=game.turn, human_color=game.human_color, phase=game.phase)
    turn.require_human_move()

    requested, taken, capture_square = game.engine.move(f"{request.source}{request.target}{request.promotion or ''}")
    game.last_sense_area = []
    game.visible_opponent_pieces = []
    game.known_empty_squares_from_sense = []
    game.turn = game.human_color.opposite
    game.phase = GamePhase.BOT_THINKING
    if taken is None:
        game.add_event("illegal_move", "That move did not succeed. Your turn is over.")
    elif capture_square is not None:
        game.add_event("capture", f"You captured a piece on {capture_square}.")
    else:
        game.add_event("move", f"Move played: {taken}.")
    self.store.save(game)
    return game


def pass_turn(self, game_id: str) -> GameRecord:
    game = self.store.get(game_id)
    turn = TurnService(turn=game.turn, human_color=game.human_color, phase=game.phase)
    turn.require_human_move()
    game.last_sense_area = []
    game.visible_opponent_pieces = []
    game.known_empty_squares_from_sense = []
    game.turn = game.human_color.opposite
    game.phase = GamePhase.BOT_THINKING
    game.add_event("pass", "You passed.")
    self.store.save(game)
    return game


def resign(self, game_id: str) -> GameRecord:
    game = self.store.get(game_id)
    game.status = GameStatus.COMPLETE
    game.phase = GamePhase.GAME_OVER
    game.result = GameResultView(
        winner=game.human_color.opposite,
        reason=WinReason.RESIGN,
        message="You resigned.",
    )
    game.add_event("resign", "You resigned. Game over.")
    self.store.save(game)
    return game
```

Use `TurnService` for phase validation. Sense results should set `visible_opponent_pieces`, `known_empty_squares_from_sense`, and `highlighted_sense_area` only in the returned view after sensing.

- [ ] Extend `routes_games.py` with command endpoints.

```python
@router.post("/games/{game_id}/sense", response_model=GameResponse)
def sense(game_id: str, request: SenseRequest) -> GameResponse:
    try:
        game = service.sense(game_id, request.center)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return GameResponse(view=service.view_for_human(game))


@router.post("/games/{game_id}/move", response_model=GameResponse)
def move(game_id: str, request: MoveRequest) -> GameResponse:
    try:
        game = service.move(game_id, request)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return GameResponse(view=service.view_for_human(game))


@router.post("/games/{game_id}/pass", response_model=GameResponse)
def pass_turn(game_id: str) -> GameResponse:
    game = service.pass_turn(game_id)
    return GameResponse(view=service.view_for_human(game))


@router.post("/games/{game_id}/resign", response_model=GameResponse)
def resign(game_id: str) -> GameResponse:
    game = service.resign(game_id)
    return GameResponse(view=service.view_for_human(game))
```

- [ ] Run validation.

```bash
cd server
pytest tests/test_human_actions.py -q
```

Expected: tests pass.

### Task 4.2: Information Hiding Regression Tests

- [ ] Add tests in `server/tests/test_information_hiding.py`.

```python
from fastapi.testclient import TestClient

from app.main import app


def test_initial_view_never_contains_black_pieces_for_white_human():
    client = TestClient(app)

    response = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})

    pieces = response.json()["view"]["board"]["visible_opponent_pieces"]
    assert pieces == []


def test_sense_view_contains_only_window_opponent_pieces():
    client = TestClient(app)
    create = client.post("/api/games", json={"human_color": "white", "bot_id": "random"})
    game_id = create.json()["view"]["game_id"]

    response = client.post(f"/api/games/{game_id}/sense", json={"center": "e7"})

    view = response.json()["view"]
    sensed_squares = set(view["board"]["highlighted_sense_area"])
    for piece in view["board"]["visible_opponent_pieces"]:
      assert piece["square"] in sensed_squares
```

- [ ] Run validation.

```bash
cd server
pytest tests/test_information_hiding.py -q
```

Expected: tests pass.

### Task 4.3: End Conditions

- [ ] Add tests in `server/tests/test_end_conditions.py`.

```python
from app.domain.clock import ChessClock
from app.domain.types import WinReason


def test_clock_flags_when_time_expires():
    clock = ChessClock(initial_seconds=3, increment_seconds=0)

    clock.start_turn(monotonic_now=10)

    assert clock.is_flagged(monotonic_now=13.1)
```

- [ ] Extend game service so timeout and resignation set `status = complete` and a `GameResultView`.

- [ ] Add a focused king-capture test after the engine adapter uses reconchess or an explicit board setup hook.

- [ ] Run validation.

```bash
cd server
pytest tests/test_end_conditions.py -q
```

Expected: tests pass.

### Stage 4 Validation

- [ ] Run:

```bash
make server-test
```

Expected: all backend tests pass, including information hiding tests.

---

## Stage 5: Frontend API Integration And Game Store

**Files:**

- Create: `client/src/features/game/api/gameClient.ts`
- Create: `client/src/features/game/state/gameStore.ts`
- Modify: `client/src/features/game/GameSetup.tsx`
- Modify: `client/src/features/game/GamePage.tsx`
- Modify: `client/src/app/App.tsx`
- Test: `client/src/features/game/api/gameClient.test.ts`
- Test: `client/src/features/game/state/gameStore.test.ts`

### Task 5.1: API Client

- [ ] Create `client/src/features/game/api/gameClient.ts`.

```ts
import type { Color, GameEventView, PieceView, PlayerView } from "../types";

interface ApiPieceView {
  square: string;
  type: PieceView["type"];
  color: Color;
}

interface ApiVisibleBoard {
  orientation: Color;
  own_pieces: ApiPieceView[];
  visible_opponent_pieces: ApiPieceView[];
  known_empty_squares_from_sense: string[];
  highlighted_sense_area: string[];
  last_move: string | null;
  last_capture_square: string | null;
}

interface ApiPlayerView {
  game_id: string;
  status: PlayerView["status"];
  phase: PlayerView["phase"];
  turn: Color;
  you: PlayerView["you"];
  opponent: PlayerView["opponent"];
  board: ApiVisibleBoard;
  clocks: {
    human_seconds_left: number;
    bot_seconds_left: number;
  };
  selectable_sense_centers: string[];
  legal_move_uci: string[];
  events: Array<{
    id: string;
    type: string;
    message: string;
    created_at: string;
  }>;
}

interface ApiGameResponse {
  view: ApiPlayerView;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function mapEvents(events: ApiPlayerView["events"]): GameEventView[] {
  return events.map((event) => ({
    id: event.id,
    type: event.type,
    message: event.message,
    createdAt: event.created_at
  }));
}

function mapPlayerView(view: ApiPlayerView): PlayerView {
  return {
    gameId: view.game_id,
    status: view.status,
    phase: view.phase,
    turn: view.turn,
    you: view.you,
    opponent: view.opponent,
    board: {
      orientation: view.board.orientation,
      ownPieces: view.board.own_pieces,
      visibleOpponentPieces: view.board.visible_opponent_pieces,
      knownEmptySquaresFromSense: view.board.known_empty_squares_from_sense,
      highlightedSenseArea: view.board.highlighted_sense_area,
      lastMove: view.board.last_move,
      lastCaptureSquare: view.board.last_capture_square
    },
    clocks: {
      humanSecondsLeft: view.clocks.human_seconds_left,
      botSecondsLeft: view.clocks.bot_seconds_left
    },
    selectableSenseCenters: view.selectable_sense_centers,
    legalMoveUci: view.legal_move_uci,
    events: mapEvents(view.events)
  };
}

async function command(path: string, init?: RequestInit): Promise<{ view: PlayerView }> {
  const response = await request<ApiGameResponse>(path, init);
  return { view: mapPlayerView(response.view) };
}

export function createGame(input: { humanColor: "random" | "white" | "black"; botId: string }) {
  return command("/api/games", {
    method: "POST",
    body: JSON.stringify({
      human_color: input.humanColor,
      bot_id: input.botId,
      timer: { initial_seconds: 900, increment_seconds: 0 }
    })
  });
}

export function sense(gameId: string, center: string) {
  return command(`/api/games/${gameId}/sense`, {
    method: "POST",
    body: JSON.stringify({ center })
  });
}

export function move(gameId: string, source: string, target: string, promotion: string | null) {
  return command(`/api/games/${gameId}/move`, {
    method: "POST",
    body: JSON.stringify({ source, target, promotion })
  });
}

export function passTurn(gameId: string) {
  return command(`/api/games/${gameId}/pass`, { method: "POST" });
}

export function resign(gameId: string) {
  return command(`/api/games/${gameId}/resign`, { method: "POST" });
}
```

- [ ] Create `client/src/features/game/api/gameClient.test.ts`.

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { createGame } from "./gameClient";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("gameClient", () => {
  it("creates a game with snake_case backend payload and maps response to camelCase", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        view: {
          game_id: "game-1",
          status: "active",
          phase: "sense",
          turn: "white",
          you: { name: "You", color: "white" },
          opponent: { name: "random", color: "black" },
          board: {
            orientation: "white",
            own_pieces: [],
            visible_opponent_pieces: [],
            known_empty_squares_from_sense: [],
            highlighted_sense_area: [],
            last_move: null,
            last_capture_square: null
          },
          clocks: { human_seconds_left: 900, bot_seconds_left: 900 },
          selectable_sense_centers: ["e4"],
          legal_move_uci: [],
          events: [{ id: "event-1", type: "game_started", message: "Game started.", created_at: "2026-05-03T00:00:00Z" }]
        }
      })
    } as Response);

    const result = await createGame({ humanColor: "white", botId: "random" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/games",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          human_color: "white",
          bot_id: "random",
          timer: { initial_seconds: 900, increment_seconds: 0 }
        })
      })
    );
    expect(result.view.gameId).toBe("game-1");
    expect(result.view.clocks.humanSecondsLeft).toBe(900);
    expect(result.view.events[0].createdAt).toBe("2026-05-03T00:00:00Z");
  });
});
```

- [ ] Run validation.

```bash
cd client
npm run test -- --run gameClient
```

Expected: API client tests pass.

### Task 5.2: Game Setup And Store

- [ ] Create `client/src/features/game/state/gameStore.ts`.

```ts
import type { PlayerView } from "../types";

export interface GameState {
  view: PlayerView | null;
  selectedSource: string | null;
  hoveredSenseCenter: string | null;
  loading: boolean;
  error: string | null;
}

export type GameAction =
  | { type: "loading" }
  | { type: "view_received"; view: PlayerView }
  | { type: "select_source"; square: string | null }
  | { type: "hover_sense"; square: string | null }
  | { type: "error"; message: string };

export const initialGameState: GameState = {
  view: null,
  selectedSource: null,
  hoveredSenseCenter: null,
  loading: false,
  error: null
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "loading":
      return { ...state, loading: true, error: null };
    case "view_received":
      return { ...state, view: action.view, loading: false, error: null, selectedSource: null };
    case "select_source":
      return { ...state, selectedSource: action.square };
    case "hover_sense":
      return { ...state, hoveredSenseCenter: action.square };
    case "error":
      return { ...state, loading: false, error: action.message };
  }
}
```

- [ ] Create `client/src/features/game/state/gameStore.test.ts`.

```ts
import { describe, expect, it } from "vitest";

import { gameReducer, initialGameState } from "./gameStore";
import { staticPlayerView } from "../staticView";

describe("gameReducer", () => {
  it("stores the latest PlayerView and clears transient selection", () => {
    const state = { ...initialGameState, selectedSource: "e2", loading: true };

    const next = gameReducer(state, { type: "view_received", view: staticPlayerView });

    expect(next.view?.gameId).toBe("static");
    expect(next.selectedSource).toBeNull();
    expect(next.loading).toBe(false);
  });
});
```

- [ ] Create `GameSetup.tsx` with three color buttons, a bot selector, and a Start button that calls `createGame`.

```tsx
import { useState } from "react";

export function GameSetup({ onStart }: { onStart: (input: { humanColor: "random" | "white" | "black"; botId: string }) => void }) {
  const [humanColor, setHumanColor] = useState<"random" | "white" | "black">("random");
  const [botId, setBotId] = useState("random");

  return (
    <main className="setup-page">
      <h1>Reconnaissance Blind Chess</h1>
      <div className="segmented-control" aria-label="Choose color">
        {(["random", "white", "black"] as const).map((color) => (
          <button
            key={color}
            type="button"
            aria-pressed={humanColor === color}
            onClick={() => setHumanColor(color)}
          >
            {color}
          </button>
        ))}
      </div>
      <label>
        Bot
        <select value={botId} onChange={(event) => setBotId(event.target.value)}>
          <option value="random">random</option>
        </select>
      </label>
      <button type="button" onClick={() => onStart({ humanColor, botId })}>
        Start
      </button>
    </main>
  );
}
```

- [ ] Update `App.tsx` to show setup until a game is created.

```tsx
import { useReducer } from "react";

import { createGame } from "../features/game/api/gameClient";
import { GamePage } from "../features/game/GamePage";
import { GameSetup } from "../features/game/GameSetup";
import { gameReducer, initialGameState } from "../features/game/state/gameStore";

export function App() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  async function handleStart(input: { humanColor: "random" | "white" | "black"; botId: string }) {
    dispatch({ type: "loading" });
    try {
      const response = await createGame(input);
      dispatch({ type: "view_received", view: response.view });
    } catch (error) {
      dispatch({ type: "error", message: error instanceof Error ? error.message : "Could not create game" });
    }
  }

  if (!state.view) {
    return <GameSetup onStart={handleStart} />;
  }

  return <GamePage view={state.view} />;
}
```

- [ ] Run:

```bash
cd client
npm run build
npm run test -- --run
```

Expected: build and tests pass.

### Parallel Agent Opportunity During Stage 5

Dispatch in parallel after `types.ts` and `gameClient.ts` stabilize:

- Agent 1: Game setup form and bot selector. Owns `GameSetup.tsx` and setup tests.
- Agent 2: Board interactions. Owns `ChessBoard.tsx`, `BoardSquare.tsx`, `SenseOverlay.tsx`, and board tests.
- Agent 3: Sidebar controls and event log. Owns `GameSidebar.tsx`, `EventLog.tsx`, `ClockDisplay.tsx`, and sidebar tests.

Coordinator owns `GamePage.tsx` and app-level wiring.

---

## Stage 6: Playable MVP End-To-End

**Files:**

- Modify: `server/app/services/bot_service.py`
- Modify: `server/app/services/game_service.py`
- Modify: `client/src/features/game/board/*`
- Modify: `client/src/features/game/GameSidebar.tsx`
- Create: `client/e2e/playable-mvp.spec.ts`
- Create: `client/playwright.config.ts`

### Task 6.1: Bot Turn Runner

- [ ] Add a `BotService` that runs random bot sense and move after the human turn.

```python
from app.bots.registry import get_bot_spec
from app.domain.game_record import GameRecord
from app.domain.types import GamePhase


class BotService:
    def run_turn(self, game: GameRecord, seconds_left: float) -> GameRecord:
        bot_spec = get_bot_spec(game.bot_id)
        if bot_spec.factory is None:
            game.add_event("bot_error", f"{bot_spec.name} is unavailable.")
            game.phase = GamePhase.SENSE
            game.turn = game.human_color
            return game

        bot = bot_spec.factory()
        sense_square = bot.choose_sense(game.engine.sense_actions(), game.engine.move_actions(), seconds_left)
        sense_result = game.engine.sense(sense_square) if sense_square else []
        bot.handle_sense_result([(square, piece_type, color.value if color else None) for square, piece_type, color in sense_result])
        bot_move = bot.choose_move(game.engine.move_actions(), seconds_left)
        _requested, taken, capture_square = game.engine.move(bot_move)

        game.turn = game.human_color
        game.phase = GamePhase.SENSE
        if capture_square is not None:
            game.add_event("opponent_capture", f"Your piece was captured on {capture_square}.")
        elif taken is not None:
            game.add_event("opponent_move", "Opponent moved.")
        else:
            game.add_event("opponent_pass", "Opponent passed or made an illegal move.")
        game.add_event("sense_prompt", "Your turn to sense.")
        return game
```

- [ ] Bound bot action time with a short server-side timeout.
- [ ] Emit human-visible events: "Waiting for opponent", "Opponent moved", "Your turn to sense".
- [ ] Verify bot updates do not expose bot sense results.

Backend validation:

```bash
cd server
pytest tests/test_game_api.py tests/test_information_hiding.py -q
```

Expected: all tests pass.

### Task 6.2: Board Interaction UX

- [ ] In sense phase, hover previews 3x3 squares.
- [ ] Clicking a center calls `sense`.
- [ ] In move phase, first click selects own piece.
- [ ] Second click submits move.
- [ ] Pass button calls `passTurn`.
- [ ] Resign button calls `resign`.

Frontend validation:

```bash
cd client
npm run test -- --run
npm run build
```

Expected: tests and build pass.

### Task 6.3: End-To-End Test

- [ ] Create `client/playwright.config.ts`.

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:5173"
  }
});
```

- [ ] Create `client/e2e/playable-mvp.spec.ts`.

```ts
import { expect, test } from "@playwright/test";

test("human can start, sense, and resign a game", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /start/i }).click();
  await expect(page.getByText(/Your turn to sense/i)).toBeVisible();

  await page.getByRole("button", { name: "e2" }).click();
  await expect(page.getByText(/Choose/i)).toBeVisible();

  await page.getByRole("button", { name: /resign/i }).click();
  await expect(page.getByText(/resigned|game over/i)).toBeVisible();
});
```

- [ ] Run E2E with server and client dev servers running.

```bash
cd client
npx playwright install chromium
npx playwright test
```

Expected: E2E test passes.

### Stage 6 Validation

- [ ] Run:

```bash
make server-test
make client-test
make client-build
cd client && npx playwright test
```

Expected: all commands pass. The user can play a minimal local game against random bot.

---

## Stage 7: Extensibility, More Bots, Persistence, Replay

### Stage 7A: Additional Bots

**Files:**

- Create: `server/app/bots/attacker_bot.py`
- Create: `server/app/bots/stockfish_service.py`
- Modify: `server/app/bots/registry.py`
- Test: `server/tests/test_attacker_bot.py`

Tasks:

- [ ] Implement `AttackerBot` with a deterministic opening preference and random fallback.

```python
import random


class AttackerBot:
    id = "attacker"
    display_name = "attacker"

    preferred_moves = ["e2e4", "d1h5", "f1c4", "h5f7", "g1f3", "f3g5"]

    def choose_sense(self, sense_actions: list[str], move_actions: list[str], seconds_left: float) -> str | None:
        return random.choice(sense_actions) if sense_actions else None

    def handle_sense_result(self, sense_result: list[tuple[str, str | None, str | None]]) -> None:
        return None

    def choose_move(self, move_actions: list[str], seconds_left: float) -> str | None:
        for move in self.preferred_moves:
            if move in move_actions:
                return move
        captures = [move for move in move_actions if len(move) >= 4]
        return random.choice(captures or move_actions) if move_actions else None
```

- [ ] Keep `trout`, `oracle`, and `marmot` disabled until dependencies and licensing are verified.
- [ ] Add `StockfishService` as a small process wrapper with a health check.
- [ ] Mark `trout` available only when Stockfish binary path is configured.

Validation:

```bash
cd server
pytest tests/test_attacker_bot.py tests/test_bot_registry.py -q
```

Expected: tests pass; unavailable bots report clear reasons.

### Stage 7B: Persistence And Replay

**Files:**

- Create: `server/app/storage/sqlite_store.py`
- Create: `server/app/domain/game_history.py`
- Create: `server/app/api/routes_replay.py`
- Create: `client/src/features/replay/ReplayPage.tsx`
- Test: `server/tests/test_sqlite_store.py`
- Test: `client/src/features/replay/ReplayPage.test.tsx`

Tasks:

- [ ] Save game records and player-visible events to SQLite after each command.
- [ ] Add `GET /api/games/{game_id}/replay`.
- [ ] Add replay page that steps through stored `PlayerView` snapshots with this component shape.

```tsx
import { useState } from "react";

import { GamePage } from "../game/GamePage";
import type { PlayerView } from "../game/types";

export function ReplayPage({ snapshots }: { snapshots: PlayerView[] }) {
  const [index, setIndex] = useState(0);
  const current = snapshots[index];

  return (
    <main className="replay-page">
      <GamePage view={current} />
      <div className="replay-controls">
        <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))}>
          Previous
        </button>
        <span>{index + 1} / {snapshots.length}</span>
        <button type="button" onClick={() => setIndex((value) => Math.min(snapshots.length - 1, value + 1))}>
          Next
        </button>
      </div>
    </main>
  );
}
```

- [ ] Keep replay read-only.

Validation:

```bash
make server-test
make client-test
make client-build
```

Expected: games survive server restart in a manual smoke test.

### Stage 7C: Hardening And Deployment Docs

**Files:**

- Modify: `README.md`
- Create: `.env.example`
- Create: `docs/operations.md`
- Create: `client/e2e/information-hiding.spec.ts`

Tasks:

- [ ] Document local setup, environment variables, and known bot availability in `docs/operations.md` with sections named `Local Development`, `Bot Availability`, `Validation`, and `Troubleshooting`.
- [ ] Add E2E test that confirms hidden pieces are not rendered outside a sense window.

```ts
import { expect, test } from "@playwright/test";

test("opponent pieces are hidden outside the active sense window", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /start/i }).click();
  await page.getByRole("button", { name: "e7" }).click();

  const visibleBlackPieces = page.locator(".piece-black");
  const highlightedSquares = page.locator(".board-square-highlighted .piece-black");

  await expect(visibleBlackPieces).toHaveCount(await highlightedSquares.count());
});
```

- [ ] Add manual QA checklist with desktop and mobile viewport checks.
- [ ] Add production build instructions.

Validation:

```bash
make test
cd client && npx playwright test
```

Expected: all automated checks pass, and manual QA checklist has no blocking visual issues.

### Parallel Agent Opportunity During Stage 7

Dispatch in parallel:

- Agent 1: `AttackerBot` and bot registry tests.
- Agent 2: SQLite persistence and replay API.
- Agent 3: Replay frontend.
- Agent 4: E2E hardening and operations docs.

Coordinator reviews schema changes and runs full validation after all agents return.

---

## Stage 8: Full Finish Criteria

The project is finished when all criteria are true:

- User can start a game as random, white, or black.
- User can choose an available bot.
- Unavailable bots are shown with clear reasons.
- User can sense a 3x3 area on each turn.
- Sensed opponent pieces are hidden again after the turn unless a future display mode intentionally keeps notes.
- User can move, pass, and resign.
- Backend owns all hidden state.
- Timers are server-authoritative with configurable 15:00 strict mode and official-style increment mode.
- Game can end by resignation, timeout, king capture, or enabled draw rule.
- Random bot can complete full games.
- At least one additional simple bot is registered or explicitly disabled with reason.
- Tests cover information hiding, turn phase enforcement, bot registry, and API commands.
- E2E covers start, sense, move or pass, bot response, and resign.

Final validation:

```bash
make server-test
make client-test
make client-build
cd client && npx playwright test
```

Expected: all commands pass.

---

## Agent Dispatch Prompts

Use these prompts when assigning work to parallel agents. Each agent should report changed files, tests run, and remaining risk.

### Backend Contracts Agent

```markdown
You own backend contracts for the RBC chess project.

Scope:
- `server/app/domain/types.py`
- `server/app/domain/events.py`
- `server/app/domain/player_view.py`
- `server/app/api/schemas.py`
- `server/tests/test_player_view_contract.py`

Goal:
Implement Stage 1A from `docs/superpowers/plans/2026-05-03-rbc-chess-implementation.md`.

Constraints:
- Do not edit frontend files.
- Do not edit game engine or bot service files.
- The browser must never receive hidden opponent pieces outside the explicit `visible_opponent_pieces` list.

Return:
- Files changed
- Tests run
- Any schema naming concerns for the coordinator
```

### Static Frontend Agent

```markdown
You own the static frontend board and sidebar.

Scope:
- `client/src/features/game/*`
- `client/src/features/game/board/*`
- `client/src/features/game/timers/*`
- `client/src/app/App.tsx`
- `client/src/styles.css`

Goal:
Implement Stage 1B from `docs/superpowers/plans/2026-05-03-rbc-chess-implementation.md`.

Constraints:
- Do not edit server files.
- Use only sanitized `PlayerView` fixture data.
- Keep the layout close to the provided screenshot: board left, controls/log right, responsive stack on mobile.

Return:
- Files changed
- Build/test commands run
- Visual issues noticed
```

### Game API Agent

```markdown
You own game creation and command API.

Scope:
- `server/app/domain/game_record.py`
- `server/app/storage/memory_store.py`
- `server/app/services/game_service.py`
- `server/app/api/routes_games.py`
- `server/tests/test_game_api.py`
- `server/tests/test_human_actions.py`

Goal:
Implement Stages 3 and 4 API pieces from `docs/superpowers/plans/2026-05-03-rbc-chess-implementation.md`.

Constraints:
- Do not edit frontend files.
- Do not implement advanced bots.
- Preserve information hiding in every API response.

Return:
- Files changed
- Tests run
- Any endpoints whose behavior needs frontend coordination
```

### Bot Agent

```markdown
You own bot registry and simple bot behavior.

Scope:
- `server/app/bots/*`
- `server/app/services/bot_service.py`
- `server/tests/test_bot_registry.py`
- `server/tests/test_bots.py`

Goal:
Implement random bot first, then attacker bot if random is complete and tested.

Constraints:
- Do not edit game API route files.
- Do not add Stockfish as a hard dependency for the MVP.
- Mark unavailable advanced bots with clear reasons.

Return:
- Files changed
- Tests run
- Bot limitations
```

### Frontend Integration Agent

```markdown
You own frontend API integration and local game state.

Scope:
- `client/src/features/game/api/*`
- `client/src/features/game/state/*`
- `client/src/features/game/GameSetup.tsx`
- `client/src/features/game/GamePage.tsx`
- Related frontend tests

Goal:
Implement Stage 5 from `docs/superpowers/plans/2026-05-03-rbc-chess-implementation.md`.

Constraints:
- Do not edit backend files.
- Keep fetch payload names aligned with backend schemas.
- Store only `PlayerView` and transient UI selection state.

Return:
- Files changed
- Tests run
- API naming mismatches found
```

### E2E Agent

```markdown
You own browser-level validation.

Scope:
- `client/playwright.config.ts`
- `client/e2e/*`
- Minimal test IDs or accessible labels in frontend files if needed

Goal:
Implement Stage 6 E2E tests from `docs/superpowers/plans/2026-05-03-rbc-chess-implementation.md`.

Constraints:
- Prefer accessible roles and labels over test IDs.
- Do not change backend behavior.
- Report whether server/client startup is manual or scripted.

Return:
- Files changed
- Test command output summary
- Any flaky interaction risks
```

---

## Coordinator Review Checklist

After each parallel batch:

- [ ] Read every agent summary.
- [ ] Check for overlapping file edits.
- [ ] Run `git diff --stat`.
- [ ] Run narrow tests for each changed area.
- [ ] Run full validation for the completed stage.
- [ ] Open the app in a browser after frontend changes.
- [ ] Confirm hidden opponent pieces are not present in API payloads or rendered DOM outside the sense window.
- [ ] Commit the stage with a concise message.

## Known Technical Watchpoints

- `python-chess` pseudo-legal moves are not enough for final RBC rules. Before the MVP is called complete, replace risky move resolution with `reconchess` semantics or explicit RBC obstruction tests.
- Pydantic uses snake_case by default while frontend TypeScript prefers camelCase. Pick one API convention early. The plan starts with snake_case requests and current Python response field names; frontend can map at the API boundary.
- Bot turns must be bounded. A slow bot should lose on time or fail gracefully, not freeze the whole game.
- The browser must never receive a full FEN or full opponent piece list during active play.
- Timer display can tick locally for smoothness, but server responses decide actual remaining time.
