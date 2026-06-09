"""Rondas router for DCCheck.

Endpoints:
    GET    /rondas/      – list rondas with optional filters
    GET    /rondas/{id}  – full ronda detail including registros_item and fotos
    POST   /rondas/      – create a new ronda (data=today, tecnico_id=current user)
    PUT    /rondas/{id}  – update a ronda
    DELETE /rondas/{id}  – delete a ronda (gestor/admin only)
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.ronda import Ronda
from app.models.sala import Sala
from app.models.user import User
from app.schemas.registro import FotoResponse, RegistroItemResponse
from app.schemas.ronda import RondaCreate, RondaListResponse, RondaResponse, RondaUpdate
from app.services.ronda_service import get_ronda_with_details
from app.utils.jwt import get_current_user
from app.utils.permissions import require_gestor_or_admin

router = APIRouter(prefix="/rondas", tags=["rondas"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

from app.utils.tz import local_today


def _today_utc() -> date:
    return datetime.now(tz=timezone.utc).date()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[RondaListResponse])
async def list_rondas(
    sala: str | None = Query(default=None, description="Slug da sala"),
    tecnico_id: UUID | None = Query(default=None),
    data_inicio: date | None = Query(default=None),
    data_fim: date | None = Query(default=None),
    falha: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[RondaListResponse]:
    """List rondas with optional filters. Returns sala nome and tecnico username."""
    stmt = (
        select(Ronda)
        .options(selectinload(Ronda.sala), selectinload(Ronda.tecnico))
        .order_by(Ronda.data.desc(), Ronda.hora_entrada.desc())
    )

    if sala is not None:
        sala_result = await db.execute(select(Sala).where(Sala.slug == sala))
        sala_obj: Sala | None = sala_result.scalars().first()
        if sala_obj is None:
            return []
        stmt = stmt.where(Ronda.sala_id == sala_obj.id)

    if tecnico_id is not None:
        stmt = stmt.where(Ronda.tecnico_id == tecnico_id)

    if data_inicio is not None:
        stmt = stmt.where(Ronda.data >= data_inicio)

    if data_fim is not None:
        stmt = stmt.where(Ronda.data <= data_fim)

    if falha is not None:
        stmt = stmt.where(Ronda.falha_geral == falha)

    result = await db.execute(stmt)
    rondas = result.scalars().all()

    return [
        RondaListResponse(
            id=r.id,
            sala_id=r.sala_id,
            data=r.data,
            tecnico_id=r.tecnico_id,
            hora_entrada=r.hora_entrada,
            hora_saida=r.hora_saida,
            limpeza=r.limpeza.value if hasattr(r.limpeza, "value") else r.limpeza,
            organizacao=r.organizacao,
            iluminacao=r.iluminacao,
            vazamento=r.vazamento,
            falha_geral=r.falha_geral,
            observacoes=r.observacoes,
            created_at=r.created_at,
            sala_nome=r.sala.nome if r.sala else "",
            tecnico_username=r.tecnico.username if r.tecnico else "",
        )
        for r in rondas
    ]


@router.get("/{ronda_id}/detail")
async def get_ronda_detail(
    ronda_id: UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> dict:
    """Return full ronda detail as a plain dict, including sala, tecnico,
    registros_item (with their item + fotos)."""
    data = await get_ronda_with_details(db, str(ronda_id))
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ronda não encontrada.",
        )
    return data


@router.get("/{ronda_id}", response_model=RondaResponse)
async def get_ronda(
    ronda_id: UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> RondaResponse:
    """Return full ronda detail including registros_item and fotos."""
    result = await db.execute(
        select(Ronda)
        .where(Ronda.id == ronda_id)
        .options(
            selectinload(Ronda.sala),
            selectinload(Ronda.tecnico),
            selectinload(Ronda.registros),
        )
    )
    ronda: Ronda | None = result.scalars().first()

    if ronda is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ronda não encontrada.",
        )

    return RondaResponse.model_validate(ronda)


@router.post("/", response_model=RondaResponse, status_code=status.HTTP_201_CREATED)
async def create_ronda(
    body: RondaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RondaResponse:
    """Create a new ronda. data is always set to today; tecnico_id to the current user."""
    # Verify sala exists
    sala_result = await db.execute(select(Sala).where(Sala.id == body.sala_id))
    if sala_result.scalars().first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sala '{body.sala_id}' não encontrada.",
        )

    ronda = Ronda(
        sala_id=body.sala_id,
        data=local_today(),
        tecnico_id=current_user.id,
        hora_entrada=body.hora_entrada,
        hora_saida=body.hora_saida,
        limpeza=body.limpeza,
        organizacao=body.organizacao,
        iluminacao=body.iluminacao,
        vazamento=body.vazamento,
        falha_geral=False,
        observacoes=body.observacoes,
    )
    db.add(ronda)
    await db.commit()
    await db.refresh(ronda)
    return RondaResponse.model_validate(ronda)


@router.put("/{ronda_id}", response_model=RondaResponse)
async def update_ronda(
    ronda_id: UUID,
    body: RondaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RondaResponse:
    """Update a ronda. Any authenticated user may update rondas they created;
    gestores and admins may update any ronda."""
    result = await db.execute(select(Ronda).where(Ronda.id == ronda_id))
    ronda: Ronda | None = result.scalars().first()

    if ronda is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ronda não encontrada.",
        )

    from app.models.user import UserRole  # noqa: PLC0415

    is_privileged = current_user.role in {UserRole.gestor, UserRole.admin}
    if not is_privileged and ronda.tecnico_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para editar esta ronda.",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ronda, field, value)

    db.add(ronda)
    await db.commit()
    await db.refresh(ronda)
    return RondaResponse.model_validate(ronda)


@router.delete("/{ronda_id}", status_code=status.HTTP_200_OK)
async def delete_ronda(
    ronda_id: UUID,
    db: AsyncSession = Depends(get_db),
    _privileged_user: User = Depends(require_gestor_or_admin),
) -> dict:
    """Delete a ronda permanently. Restricted to gestores and admins."""
    result = await db.execute(select(Ronda).where(Ronda.id == ronda_id))
    ronda: Ronda | None = result.scalars().first()

    if ronda is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ronda não encontrada.",
        )

    await db.delete(ronda)
    await db.commit()
    return {"message": "Ronda excluída com sucesso."}
