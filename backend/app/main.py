"""DCCheck FastAPI application entry point."""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy router imports – defined at module level to be testable without a DB
# ---------------------------------------------------------------------------

def _include_routers(app: FastAPI) -> None:
    """Register all API routers.

    Imports are deferred so that the application can start (and the /health
    endpoint respond) even if individual router modules have import errors
    during development.
    """
    from app.routers.auth import router as auth_router
    from app.routers.users import router as users_router
    from app.routers.salas import router as salas_router
    from app.routers.itens import router as itens_router
    from app.routers.rondas import router as rondas_router
    from app.routers.registros import router as registros_router
    from app.routers.fotos import router as fotos_router
    from app.routers.dashboard import router as dashboard_router

    app.include_router(auth_router, prefix="/api", tags=["auth"])
    app.include_router(users_router, prefix="/api", tags=["users"])
    app.include_router(salas_router, prefix="/api", tags=["salas"])
    app.include_router(itens_router, prefix="/api", tags=["itens"])
    app.include_router(rondas_router, prefix="/api", tags=["rondas"])
    app.include_router(registros_router, prefix="/api", tags=["registros"])
    app.include_router(fotos_router, prefix="/api", tags=["fotos"])
    app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Run startup and shutdown tasks."""
    # -- Startup --
    storage_path = settings.STORAGE_PATH
    os.makedirs(storage_path, exist_ok=True)
    logger.info("Storage directory ready: %s", storage_path)

    # Mount static file serving for uploaded photos.
    # We do this here (rather than at module level) so the directory exists
    # before StaticFiles tries to verify it.
    app.mount(
        "/api/fotos/files",
        StaticFiles(directory=storage_path),
        name="fotos_files",
    )
    logger.info("DCCheck API started")

    yield

    # -- Shutdown --
    logger.info("DCCheck API shutting down")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(
        title="DCCheck API",
        version="1.0.0",
        description=(
            "Backend API para o sistema DCCheck – checklist diário de datacenter."
        ),
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------
    allowed_origins: list[str] = [
        origin.strip()
        for origin in settings.ALLOWED_ORIGINS.split(",")
        if origin.strip()
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ------------------------------------------------------------------
    # Routers
    # ------------------------------------------------------------------
    _include_routers(app)

    # ------------------------------------------------------------------
    # Health-check (outside /api prefix so load balancers can probe it)
    # ------------------------------------------------------------------
    @app.get("/health", tags=["health"], include_in_schema=False)
    async def health_check() -> dict:
        return {"status": "ok", "service": "dccheck-api"}

    return app


# Module-level app instance used by uvicorn and tests.
app = create_app()
