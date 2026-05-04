from fastapi import APIRouter, HTTPException

from app.api.schemas import CreateGameRequest, GameResponse
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
