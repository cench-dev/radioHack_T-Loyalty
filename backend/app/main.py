"""
точка входа в приложение
uvicorn app.main:app --reload --port 8000
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .seed import seed_database
from .routers import users, loyalty, offers, gamification

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """При старте: создать таблицы и загрузить CSV (один раз)."""
    seed_database()
    yield


app = FastAPI(
    title="Loyalty Hub API",
    description="Единый раздел лояльности банка — кэшбэк, программы, акции, AI-инсайты.",
    version="1.0.0",
    lifespan=lifespan,
)

# разрешения для фронтенда
cors_origins = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(loyalty.router)
app.include_router(offers.router)
app.include_router(gamification.router)


@app.get("/", tags=["health"])
def root():
    return {
        "name": "Loyalty Hub API",
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
