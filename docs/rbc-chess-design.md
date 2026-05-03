# Reconnaissance Blind Chess Game Design

Date: 2026-05-03

## 1. Goal

Build a playable Reconnaissance Blind Chess web game where a human challenges a bot. The user can choose to play as white, black, or random. The bot can be selected from a registry of opponents, starting with simple bots and expanding later to stronger models such as random, attacker, trout, Oracle, and Marmot.

The first usable version should prioritize a correct turn loop, clear information hiding, and readable code boundaries over advanced bot strength.

## 2. Source-Backed Rules

The implementation should follow the JHU/APL Reconnaissance Blind Chess rules:

- A player cannot see the opponent's pieces except through sensing.
- Each turn has a turn start phase, sense phase, then move phase.
- In the sense phase, the player selects a board square and sees the true contents of the centered 3x3 window.
- In the move phase, the player chooses a move or pass.
- There is no check or checkmate rule. The game is won by capturing the opponent king or by timeout.
- Captures reveal that a capture happened and where it happened, but not the captured piece type to the capturing player.
- Sliding moves that are blocked by an unseen opponent piece are modified to capture the first blocking opponent piece.
- Illegal moves fail, make no board change, and end the player's turn.
- The official rules use a 15-minute clock per player and add 5 seconds after each turn. For this project, make the timer configurable so the MVP can use exactly 15:00 total if desired.

References:

- JHU/APL challenge page: https://rbc.jhuapl.edu/challenge
- JHU/APL game rules: https://rbc.jhuapl.edu/gameRules
- reconchess rules: https://reconchess.readthedocs.io/en/latest/rules.html
- reconchess API: https://reconchess.readthedocs.io/en/latest/reconchess.html

## 3. Product Scope

### MVP

The MVP is a single local browser game:

- Start screen with color selection: random, white, black.
- Bot selection: random first, attacker second if easy.
- Game board styled like the reference screenshot.
- User turn flow:
  - Display "your turn to sense".
  - User selects a 3x3 sense area.
  - Opponent pieces in that area become visible.
  - User makes a move or passes.
  - Sense result disappears after the user's turn ends.
- Bot turn flow:
  - UI shows that the bot is thinking.
  - Bot senses and moves through the same backend rules.
  - User receives only allowed notifications.
- Timer display for both sides, backed by server-authoritative time.
- Pass and resign controls.
- Turn/event log.
- End game screen for king capture, timeout, resignation, or draw rule if enabled.

### Later Versions

- Add stronger bots: trout, Oracle, Marmot.
- Add Stockfish-backed bot support.
- Add "current observation only" versus "extra piece placement" display modes.
- Add optional piece tracking assistance.
- Add game replay/export.
- Add remote challenge server adapter if connecting to the official RBC server becomes a goal.

## 4. Recommended Technical Approach

Use a two-part application:

- Frontend: React + TypeScript + Vite.
- Backend: Python + FastAPI.

Reasoning:

- The official reconchess package is Python-first and already models RBC concepts such as sensing, move results, player callbacks, clocks, and game history.
- React/TypeScript keeps the board UI componentized and pleasant to evolve.
- FastAPI gives a small, readable API layer and supports WebSockets or server-sent events for live updates.

Avoid putting hidden board truth in the browser. The browser should receive only a `PlayerView`, never the full ground-truth board.

## 5. Architecture

```text
client/
  src/
    app/
      App.tsx
      routes.tsx
    features/game/
      GamePage.tsx
      GameSetup.tsx
      GameSidebar.tsx
      EventLog.tsx
      timers/
        ClockDisplay.tsx
      board/
        ChessBoard.tsx
        BoardSquare.tsx
        SenseOverlay.tsx
        Piece.tsx
      api/
        gameClient.ts
        gameEvents.ts
      state/
        gameStore.ts
      types.ts

server/
  app/
    main.py
    api/
      routes_games.py
      websocket.py
    domain/
      game_state.py
      player_view.py
      actions.py
      events.py
      clock.py
    services/
      game_service.py
      bot_service.py
      turn_service.py
    engine/
      rbc_engine.py
      reconchess_engine.py
    bots/
      base.py
      registry.py
      random_bot.py
      attacker_bot.py
      stockfish_bot.py
      external_bot.py
    storage/
      memory_store.py
      sqlite_store.py
    tests/
```

### Core Boundaries

`GameService`

- Owns game creation, lookup, lifecycle, and finalization.
- Exposes operations such as `create_game`, `sense`, `move`, `pass_turn`, and `resign`.
- Returns sanitized `PlayerView` objects.

`RbcEngine`

- Owns rules enforcement.
- Can initially wrap `reconchess.LocalGame`.
- Provides an internal interface so the app can later swap in a custom engine or remote server adapter.

`TurnService`

- Owns turn-phase transitions.
- Ensures actions happen only in the correct phase.
- Prevents double moves, sensing during bot turn, and stale actions.

`ClockService`

- Uses monotonic server time.
- Deducts active turn time.
- Applies configurable increment after a completed turn if enabled.
- Declares timeout server-side.

`BotService`

- Loads a bot from `BotRegistry`.
- Runs the bot's sense and move decisions.
- Protects the server from long bot computation with timeouts.

`PlayerView`

- The only state shape sent to the frontend.
- Contains own pieces, currently visible opponent pieces, last sense result, legal user actions, timers, phase, turn owner, and event log.
- Never contains the full hidden board.

## 6. Domain Model

```text
Game
  id
  status: setup | active | complete
  human_color: white | black
  bot_id
  turn_color
  phase: turn_start | sense | move | bot_thinking | game_over
  clock
  move_counters
  result

PlayerView
  game_id
  you: PlayerSummary
  opponent: PlayerSummary
  board: VisibleBoard
  phase
  turn
  selectable_sense_centers
  movable_pieces
  last_sense_window
  last_capture_notice
  clocks
  events
  result

VisibleBoard
  orientation
  own_pieces
  visible_opponent_pieces
  known_empty_squares_from_sense
  highlighted_sense_area
  last_move
  last_capture_square

GameEvent
  id
  created_at
  visibility: human | bot | both | system
  type
  message
  payload
```

## 7. Bot Interface

Use one internal interface even if different bots are implemented in different ways.

```python
class BotPlayer(Protocol):
    id: str
    display_name: str

    def start_game(self, color, initial_board, opponent_name) -> None: ...
    def notify_opponent_move(self, captured_my_piece, capture_square) -> None: ...
    def choose_sense(self, sense_actions, move_actions, seconds_left): ...
    def notify_sense_result(self, sense_result) -> None: ...
    def choose_move(self, move_actions, seconds_left): ...
    def notify_move_result(self, requested_move, taken_move, captured_opponent_piece, capture_square) -> None: ...
    def end_game(self, winner_color, win_reason, history) -> None: ...
```

### Bot Registry

```python
BOT_REGISTRY = {
    "random": BotSpec(name="random", factory=RandomBot, strength="beginner"),
    "attacker": BotSpec(name="attacker", factory=AttackerBot, strength="beginner"),
    "trout": BotSpec(name="trout", factory=TroutBot, strength="intermediate", requires=["stockfish"]),
    "oracle": BotSpec(name="Oracle", factory=OracleBot, strength="advanced", requires=["stockfish"]),
    "marmot": BotSpec(name="Marmot", factory=MarmotBot, strength="advanced"),
}
```

If trout, Oracle, or Marmot are not available locally at first, the registry can mark them as `coming_soon` or `unavailable` with a reason. The UI should render unavailable bots without breaking the setup flow.

## 8. Frontend Design

### Main Layout

Use a two-column desktop layout similar to the screenshot:

- Left: large chessboard.
- Right: player names, timers, controls, and event log.

On mobile:

- Board first.
- Compact turn/timer strip below or above the board.
- Controls and log below the board.

### Board Behavior

The board supports three interaction modes:

- `idle`: user is waiting or game is over.
- `sense_select`: hover and click show a 3x3 preview.
- `move_select`: click source square, then target square.

During `sense_select`:

- Hovering a square previews the 3x3 window.
- Clicking submits the center square.
- The returned result shows opponent pieces and empty squares in the sensed area.

During `move_select`:

- Own pieces are selectable.
- The UI may show pseudo-legal moves for convenience, but the backend remains authoritative.
- If a submitted move is illegal under the true hidden board, the backend returns an illegal move event and the turn ends.

When it is not the user's turn, opponent pieces outside allowed knowledge are hidden. The latest sense window is cleared unless the selected display mode says otherwise.

### Sidebar

The sidebar should show:

- Human and bot names with color indicators.
- Remaining clock time.
- Current phase message: "Your turn to sense", "Choose a move", "Waiting for Oracle", "Game over".
- Pass and resign buttons.
- Event cards for captures, illegal moves, sense prompt, bot thinking, and final result.

## 9. API Design

Use REST for commands and WebSocket or server-sent events for live updates.

```text
GET    /api/bots
POST   /api/games
GET    /api/games/{game_id}
POST   /api/games/{game_id}/sense
POST   /api/games/{game_id}/move
POST   /api/games/{game_id}/pass
POST   /api/games/{game_id}/resign
GET    /api/games/{game_id}/events
WS     /ws/games/{game_id}
```

Example create request:

```json
{
  "humanColor": "random",
  "botId": "random",
  "timer": {
    "initialSeconds": 900,
    "incrementSeconds": 0
  }
}
```

Example sense request:

```json
{
  "center": "e4"
}
```

Example move request:

```json
{
  "from": "e2",
  "to": "e4",
  "promotion": null
}
```

Every command returns the latest `PlayerView`.

## 10. Turn Flow

### Human Starts Turn

1. Backend applies opponent move notification to the human view.
2. Backend starts the human clock.
3. Frontend receives `phase = sense`.
4. User selects a sense center.
5. Backend returns the sense result.
6. Frontend switches to `phase = move`.
7. User moves, passes, or resigns.
8. Backend applies move result and capture notifications.
9. Backend stops the human clock and applies increment if configured.
10. Backend switches to bot turn.

### Bot Turn

1. Backend starts bot clock.
2. Bot receives opponent move result.
3. Bot chooses sense.
4. Backend applies sense.
5. Bot receives sense result.
6. Bot chooses move or pass.
7. Backend applies move.
8. Backend stops bot clock and applies increment if configured.
9. Backend emits a sanitized update to the human.

## 11. Information Hiding Rules

Information hiding is the most important correctness requirement.

- The server stores the ground-truth board.
- The frontend stores only the latest `PlayerView`.
- API responses must never include hidden opponent pieces.
- Sense result visibility expires when the user's turn ends unless the display mode supports notes or extra placement.
- Event payloads must respect RBC visibility. For example, a human can learn the capture square but not the opponent piece type they captured.
- Logs intended for debugging must be separated from player-visible event history.

## 12. Implementation Phases

### Phase 0: Project Skeleton

- Create `client` React/Vite app.
- Create `server` FastAPI app.
- Add shared conventions: formatting, linting, test commands, README.
- Add a simple health endpoint and frontend dev proxy.

Done when the browser can load the app and call `/api/health`.

### Phase 1: Static Board Prototype

- Render board with correct coordinates and orientation.
- Render starting pieces.
- Build sidebar, timers, pass/resign buttons, and event log as static components.
- Add responsive layout.

Done when the UI resembles the provided screenshot and works on desktop/mobile.

### Phase 2: Local Game Core

- Add `RbcEngine` wrapper.
- Create new games with chosen color and bot ID.
- Return `PlayerView`.
- Implement sense and move commands for human turns.
- Implement pass and resign.
- Add unit tests around phase transitions and hidden data.

Done when a human can complete a sense and move cycle against a minimal scripted bot.

### Phase 3: Random Bot

- Implement `RandomBot`.
- Run bot turns automatically after the human move.
- Emit bot thinking and result events.
- Add bot timeout protection.

Done when a full game can progress without manual backend intervention.

### Phase 4: Clock and End Conditions

- Add server-authoritative chess clock.
- Support `initialSeconds = 900`.
- Add configurable increment, defaulting to 0 for the user's requested 15-minute total or 5 for official-style play.
- Detect timeout, king capture, resignation, and optional draw rule.

Done when timers cannot be bypassed from the client.

### Phase 5: Move UX Polish

- Add click-to-move interactions.
- Add promotion selection.
- Add illegal move feedback.
- Add capture square highlights.
- Add sense hover preview and sense result styling.

Done when the user can play without typing moves.

### Phase 6: Bot Extensibility

- Add bot registry metadata.
- Add `AttackerBot`.
- Add `StockfishService`.
- Add trout as a Stockfish-backed bot if dependencies are available.
- Represent Oracle and Marmot as adapters with clear availability states.

Done when adding a bot requires implementing the bot interface and registering metadata.

### Phase 7: Persistence and Replay

- Add SQLite persistence for games and events.
- Save complete game history.
- Add replay page.
- Add export format compatible with future analysis tools.

Done when games survive server restart and can be replayed.

## 13. Testing Strategy

### Backend Unit Tests

- Game creation assigns correct colors.
- Random color selection is valid.
- Sense phase accepts only valid sense centers.
- Move phase rejects move-before-sense.
- Pass ends the turn.
- Resign ends the game.
- Timeout ends the game.
- `PlayerView` never leaks hidden opponent pieces.
- Illegal moves end the turn without changing board state.

### Backend Integration Tests

- Human vs random bot can play several turns.
- King capture ends the game.
- Sliding piece obstruction produces modified move behavior.
- Capture notices contain allowed information only.

### Frontend Tests

- Setup creates a game with selected options.
- Sense selection highlights a 3x3 area.
- Move mode begins after sense result.
- Pass and resign buttons call the right endpoints.
- Sidebar displays whose turn it is.
- Timers render from server state.

### End-to-End Tests

- Start a random-color game.
- Sense an area.
- Make a move.
- Wait for bot turn to complete.
- Confirm hidden opponent pieces are not rendered outside the sense window.
- Resign and confirm final state.

## 14. Readability and Extensibility Guidelines

- Keep rule enforcement out of UI components.
- Keep hidden state out of frontend stores.
- Keep bot logic behind `BotPlayer`.
- Keep transport models separate from engine internals.
- Prefer small services with explicit responsibilities.
- Use typed request/response models on both frontend and backend.
- Give phases explicit names rather than booleans like `isSensing`.
- Make timer settings data-driven.
- Add new bots through registry entries, not conditionals spread through the game loop.

## 15. Main Risks

- RBC move legality differs from standard chess, especially sliding obstruction and no-check rules.
- Strong bots may require extra dependencies, Stockfish processes, or published code with licensing constraints.
- It is easy to leak hidden board state through API responses, event logs, or frontend debugging.
- Timer correctness must be server-side or users can accidentally or intentionally bypass it.
- Bot computation must be bounded so one slow model does not stall the game.

## 16. Open Decisions

- Should the MVP use official timing with 15:00 plus 5 seconds per turn, or the user's requested strict 15:00 total?
- Should unavailable bots be hidden or shown as disabled?
- Should the first version use reconchess directly, or a small custom engine wrapper over python-chess with RBC-specific rules?
- Should game state persist from day one, or start in memory until the game loop is solid?

Recommended defaults:

- Use 15:00 with 0-second increment for MVP, but keep timer config ready for official 5-second increment.
- Show unavailable bots as disabled so the product shape is visible.
- Use reconchess first to reduce rule risk.
- Start with in-memory storage, then add SQLite once the turn loop is stable.
