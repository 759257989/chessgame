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
