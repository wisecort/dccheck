"""Registros router for DCCheck.

Endpoints:
    POST /registros/      – create a registro_item
    PUT  /registros/{id}  – update a registro_item
"""
from __future__ import annotations

import aiosmtplib
from email.mime.text import MIMEText
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.registro_item import RegistroItem
from app.models.ronda import Ronda
from app.models.sala import Sala
from app.models.user import User
from app.schemas.registro import RegistroItemCreate, RegistroItemResponse, RegistroItemUpdate
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/registros", tags=["registros"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _send_falha_email(
    sala_nome: str,
    tipo_secao: str,
    observacao: str,
    tecnico_username: str,
) -> None:
    """Notify the gestor about a registered failure (runs in background)."""
    if not settings.GESTOR_EMAIL:
        return

    body = (
        f"Uma falha foi registrada no DCCheck.\n\n"
        f"Sala: {sala_nome}\n"
        f"Seção: {tipo_secao}\n"
        f"Observação: {observacao}\n"
        f"Técnico: {tecnico_username}\n\n"
        "Acesse o sistema para mais detalhes."
    )
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = f"DCCheck – Falha registrada: {sala_nome} / {tipo_secao}"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = settings.GESTOR_EMAIL

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            start_tls=settings.SMTP_PORT == 587,
        )
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/", response_model=RegistroItemResponse, status_code=status.HTTP_201_CREATED)
async def create_registro(
    body: RegistroItemCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RegistroItemResponse:
    """Create a registro_item. If falha=True, observacao must be present and a
    failure-notification email is queued as a background task."""
    # Pydantic validator already enforces falha+observacao consistency, but
    # FastAPI surfaces that as a 422, which is the correct status code.

    # Verify ronda exists
    ronda_result = await db.execute(select(Ronda).where(Ronda.id == body.ronda_id))
    ronda: Ronda | None = ronda_result.scalars().first()
    if ronda is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ronda não encontrada.",
        )

    registro = RegistroItem(
        ronda_id=body.ronda_id,
        item_id=body.item_id,
        tipo_secao=body.tipo_secao,
        falha=body.falha,
        dados=body.dados,
        observacao=body.observacao,
    )
    db.add(registro)
    await db.commit()
    await db.refresh(registro)

    if body.falha:
        # Resolve sala name for the notification
        sala_nome = ""
        sala_result = await db.execute(select(Sala).where(Sala.id == ronda.sala_id))
        sala: Sala | None = sala_result.scalars().first()
        if sala:
            sala_nome = sala.nome

        background_tasks.add_task(
            _send_falha_email,
            sala_nome=sala_nome,
            tipo_secao=body.tipo_secao,
            observacao=body.observacao or "",
            tecnico_username=current_user.username,
        )

    return RegistroItemResponse.model_validate(registro)


@router.put("/{registro_id}", response_model=RegistroItemResponse)
async def update_registro(
    registro_id: UUID,
    body: RegistroItemUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> RegistroItemResponse:
    """Update a registro_item."""
    result = await db.execute(select(RegistroItem).where(RegistroItem.id == registro_id))
    registro: RegistroItem | None = result.scalars().first()

    if registro is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado.",
        )

    update_data = body.model_dump(exclude_unset=True)

    # Validate falha+observacao consistency when updating
    new_falha = update_data.get("falha", registro.falha)
    new_observacao = update_data.get("observacao", registro.observacao)
    if new_falha and not new_observacao:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="observacao é obrigatória quando falha é True.",
        )

    for field, value in update_data.items():
        setattr(registro, field, value)

    db.add(registro)
    await db.commit()
    await db.refresh(registro)
    return RegistroItemResponse.model_validate(registro)
