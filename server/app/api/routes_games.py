from fastapi import APIRouter, HTTPException

from app.api.schemas import CreateGameRequest, GameResponse, MoveRequest, SenseRequest
from app.services.game_service import GameService, MemoryGameStore

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


@router.post("/games/{game_id}/sense", response_model=GameResponse)
def sense(game_id: str, request: SenseRequest) -> GameResponse:
    try:
        game = service.sense(game_id, request.center)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Game not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return GameResponse(view=service.view_for_human(game))


@router.post("/games/{game_id}/move", response_model=GameResponse)
def move(game_id: str, request: MoveRequest) -> GameResponse:
    try:
        game = service.move(game_id, request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Game not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return GameResponse(view=service.view_for_human(game))


@router.post("/games/{game_id}/pass", response_model=GameResponse)
def pass_turn(game_id: str) -> GameResponse:
    try:
        game = service.pass_turn(game_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Game not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return GameResponse(view=service.view_for_human(game))


@router.post("/games/{game_id}/resign", response_model=GameResponse)
def resign(game_id: str) -> GameResponse:
    try:
        game = service.resign(game_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Game not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return GameResponse(view=service.view_for_human(game))
