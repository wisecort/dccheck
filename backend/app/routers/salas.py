"""Salas router for DCCheck.

Endpoints:
    GET    /salas/         – list all salas
    GET    /salas/{slug}   – sala detail with its active itens
    POST   /salas/         – create a new sala (admin)
    PUT    /salas/{slug}   – update sala metadata (admin)
    DELETE /salas/{slug}   – delete a sala and its items (admin)
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.sala import Sala
from app.schemas.sala import (
    ItemSalaResponse,
    SalaCreate,
    SalaDetailResponse,
    SalaResponse,
    SalaUpdate,
)
from app.utils.jwt import get_current_user
from app.utils.permissions import require_admin

router = APIRouter(prefix="/salas", tags=["salas"])


@router.get("/", response_model=list[SalaResponse])
async def list_salas(
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
) -> list[SalaResponse]:
    """Return all salas."""
    result = await db.execute(select(Sala).order_by(Sala.nome))
    salas = result.scalars().all()
    return [SalaResponse.model_validate(s) for s in salas]


@router.get("/{slug}", response_model=SalaDetailResponse)
async def get_sala(
    slug: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
) -> SalaDetailResponse:
    """Return a single sala with its active itens ordered by ordem."""
    result = await db.execute(
        select(Sala)
        .where(Sala.slug == slug)
        .options(selectinload(Sala.itens_sala))
    )
    sala: Sala | None = result.scalars().first()

    if sala is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sala '{slug}' não encontrada.",
        )

    active_itens = sorted(
        [i for i in sala.itens_sala if i.ativo],
        key=lambda i: (i.ordem, str(i.id)),
    )

    return SalaDetailResponse(
        id=sala.id,
        slug=sala.slug,
        nome=sala.nome,
        descricao=sala.descricao,
        has_gerador=sala.has_gerador,
        has_combustivel=sala.has_combustivel,
        itens=[ItemSalaResponse.model_validate(i) for i in active_itens],
    )


@router.post("/", response_model=SalaResponse, status_code=status.HTTP_201_CREATED)
async def create_sala(
    body: SalaCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> SalaResponse:
    """Create a new sala. Slug must be unique."""
    existing = await db.execute(select(Sala).where(Sala.slug == body.slug))
    if existing.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe uma sala com slug '{body.slug}'.",
        )

    sala = Sala(
        slug=body.slug,
        nome=body.nome,
        descricao=body.descricao,
        has_gerador=body.has_gerador,
        has_combustivel=body.has_combustivel,
    )
    db.add(sala)
    await db.commit()
    await db.refresh(sala)
    return SalaResponse.model_validate(sala)


@router.put("/{slug}", response_model=SalaResponse)
async def update_sala(
    slug: str,
    body: SalaUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> SalaResponse:
    """Update sala metadata. Slug is immutable."""
    result = await db.execute(select(Sala).where(Sala.slug == slug))
    sala: Sala | None = result.scalars().first()

    if sala is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sala '{slug}' não encontrada.",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sala, field, value)

    db.add(sala)
    await db.commit()
    await db.refresh(sala)
    return SalaResponse.model_validate(sala)


@router.delete("/{slug}", status_code=status.HTTP_200_OK)
async def delete_sala(
    slug: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> dict:
    """Delete a sala (cascades to its itens and rondas)."""
    result = await db.execute(select(Sala).where(Sala.slug == slug))
    sala: Sala | None = result.scalars().first()

    if sala is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sala '{slug}' não encontrada.",
        )

    await db.delete(sala)
    await db.commit()
    return {"message": "Sala excluída com sucesso."}
