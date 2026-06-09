"""Ronda service for DCCheck.

Encapsulates database queries and aggregations related to rondas (inspection
rounds), dashboard summaries, and time-series data for the generator.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.utils.tz import local_today
from app.models.item_sala import ItemSala
from app.models.registro_item import RegistroItem
from app.models.ronda import Ronda
from app.models.sala import Sala

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Detail loader
# ---------------------------------------------------------------------------

async def get_ronda_with_details(db: AsyncSession, ronda_id: str) -> dict[str, Any] | None:
    """Load a single ronda and eagerly fetch all related objects.

    Returns a plain dictionary suitable for JSON serialisation, or ``None``
    when no ronda with *ronda_id* exists.

    The returned structure is::

        {
            "id": str,
            "data": str (ISO date),
            "hora_entrada": str,
            "hora_saida": str | None,
            "limpeza": str,
            "organizacao": bool,
            "iluminacao": bool,
            "vazamento": bool,
            "falha_geral": bool,
            "observacoes": str | None,
            "created_at": str (ISO datetime),
            "sala": {"id": str, "slug": str, "nome": str, "descricao": str | None},
            "tecnico": {"id": str, "username": str, "email": str, "role": str},
            "registros_item": [
                {
                    "id": str,
                    "tipo_secao": str | None,
                    "falha": bool,
                    "dados": dict,
                    "observacao": str | None,
                    "created_at": str,
                    "item": {
                        "id": str,
                        "tipo": str | None,
                        "identificador": str | None,
                        "dados_fixos": dict | None,
                    } | None,
                    "fotos": [{"id": str, "filename": str, "mimetype": str}],
                },
                ...
            ],
        }
    """
    result = await db.execute(
        select(Ronda)
        .where(Ronda.id == ronda_id)
        .options(
            selectinload(Ronda.sala),
            selectinload(Ronda.tecnico),
            selectinload(Ronda.registros).selectinload(RegistroItem.item),
            selectinload(Ronda.registros).selectinload(RegistroItem.fotos),
        )
    )
    ronda: Ronda | None = result.scalars().first()
    if ronda is None:
        return None

    return _ronda_to_dict(ronda)


def _ronda_to_dict(ronda: Ronda) -> dict[str, Any]:
    tecnico = ronda.tecnico
    sala = ronda.sala

    registros = []
    for reg in ronda.registros:
        item_data: dict | None = None
        if reg.item is not None:
            item_data = {
                "id": str(reg.item.id),
                "tipo": reg.item.tipo,
                "identificador": reg.item.identificador,
                "dados_fixos": reg.item.dados_fixos,
            }
        fotos = [
            {
                "id": str(f.id),
                "filename": f.filename,
                "mimetype": f.mimetype,
                "tamanho_bytes": f.tamanho_bytes,
            }
            for f in reg.fotos
        ]
        registros.append(
            {
                "id": str(reg.id),
                "tipo_secao": reg.tipo_secao,
                "falha": reg.falha,
                "dados": reg.dados,
                "observacao": reg.observacao,
                "created_at": reg.created_at.isoformat() if reg.created_at else None,
                "item": item_data,
                "fotos": fotos,
            }
        )

    return {
        "id": str(ronda.id),
        "data": ronda.data.isoformat() if ronda.data else None,
        "hora_entrada": str(ronda.hora_entrada) if ronda.hora_entrada else None,
        "hora_saida": str(ronda.hora_saida) if ronda.hora_saida else None,
        "limpeza": ronda.limpeza,
        "organizacao": ronda.organizacao,
        "iluminacao": ronda.iluminacao,
        "vazamento": ronda.vazamento,
        "falha_geral": ronda.falha_geral,
        "observacoes": ronda.observacoes,
        "created_at": ronda.created_at.isoformat() if ronda.created_at else None,
        "sala": {
            "id": str(sala.id),
            "slug": sala.slug,
            "nome": sala.nome,
            "descricao": sala.descricao,
        }
        if sala
        else None,
        "tecnico": {
            "id": str(tecnico.id),
            "username": tecnico.username,
            "email": tecnico.email,
            "role": tecnico.role,
        }
        if tecnico
        else None,
        "registros_item": registros,
    }


# ---------------------------------------------------------------------------
# Availability check
# ---------------------------------------------------------------------------

async def check_sala_ronda_today(db: AsyncSession, sala_id: str) -> bool:
    """Return ``True`` if a ronda already exists for *sala_id* on today's date."""
    today = local_today()
    result = await db.execute(
        select(func.count()).select_from(Ronda).where(
            Ronda.sala_id == sala_id,
            Ronda.data == today,
        )
    )
    count: int = result.scalar_one()
    return count > 0


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

async def get_dashboard_summary(db: AsyncSession) -> dict[str, Any]:
    """Aggregate key metrics for the main dashboard.

    Returns::

        {
            "rondas_hoje": int,        # total rondas performed today
            "falhas_hoje": int,        # rondas with falha_geral=True today
            "itens_nok": int,          # RegistroItem rows with falha=True today
            "salas_pendentes": int,    # salas with no ronda today
        }
    """
    today = local_today()

    # Rondas today
    rondas_hoje_result = await db.execute(
        select(func.count()).select_from(Ronda).where(Ronda.data == today)
    )
    rondas_hoje: int = rondas_hoje_result.scalar_one()

    # Rondas with general failure today
    falhas_hoje_result = await db.execute(
        select(func.count())
        .select_from(Ronda)
        .where(Ronda.data == today, Ronda.falha_geral.is_(True))
    )
    falhas_hoje: int = falhas_hoje_result.scalar_one()

    # Individual item failures today (via join on ronda date)
    itens_nok_result = await db.execute(
        select(func.count())
        .select_from(RegistroItem)
        .join(Ronda, RegistroItem.ronda_id == Ronda.id)
        .where(Ronda.data == today, RegistroItem.falha.is_(True))
    )
    itens_nok: int = itens_nok_result.scalar_one()

    # Salas that have no ronda at all today
    total_salas_result = await db.execute(select(func.count()).select_from(Sala))
    total_salas: int = total_salas_result.scalar_one()

    salas_com_ronda_result = await db.execute(
        select(func.count(Ronda.sala_id.distinct())).where(Ronda.data == today)
    )
    salas_com_ronda: int = salas_com_ronda_result.scalar_one()
    salas_pendentes = max(0, total_salas - salas_com_ronda)

    return {
        "rondas_hoje": rondas_hoje,
        "falhas_hoje": falhas_hoje,
        "itens_nok": itens_nok,
        "salas_pendentes": salas_pendentes,
    }


# ---------------------------------------------------------------------------
# Salas status list
# ---------------------------------------------------------------------------

async def get_salas_status(db: AsyncSession) -> list[dict[str, Any]]:
    """Return a status summary for every sala.

    For each sala the result contains:
    - Basic sala info (id, slug, nome, descricao)
    - ``ultima_ronda``: date of the most recent ronda (ISO string or ``None``)
    - ``falhas_total``: count of ``RegistroItem`` rows with ``falha=True``
    - ``ronda_hoje``: whether a ronda was already performed today

    The list is sorted by ``sala.nome``.
    """
    salas_result = await db.execute(select(Sala).order_by(Sala.nome))
    salas = salas_result.scalars().all()

    today = local_today()
    output: list[dict[str, Any]] = []

    for sala in salas:
        # Latest ronda date for this sala
        ultima_ronda_result = await db.execute(
            select(func.max(Ronda.data)).where(Ronda.sala_id == sala.id)
        )
        ultima_ronda: date | None = ultima_ronda_result.scalar_one()

        # Total failure count (all-time) for this sala
        falhas_result = await db.execute(
            select(func.count())
            .select_from(RegistroItem)
            .join(Ronda, RegistroItem.ronda_id == Ronda.id)
            .where(Ronda.sala_id == sala.id, RegistroItem.falha.is_(True))
        )
        falhas_total: int = falhas_result.scalar_one()

        # Check if a ronda was already done today
        ronda_hoje_result = await db.execute(
            select(func.count())
            .select_from(Ronda)
            .where(Ronda.sala_id == sala.id, Ronda.data == today)
        )
        ronda_hoje: bool = ronda_hoje_result.scalar_one() > 0

        output.append(
            {
                "id": str(sala.id),
                "slug": sala.slug,
                "nome": sala.nome,
                "descricao": sala.descricao,
                "ultima_ronda": ultima_ronda.isoformat() if ultima_ronda else None,
                "falhas_total": falhas_total,
                "ronda_hoje": ronda_hoje,
            }
        )

    return output


# ---------------------------------------------------------------------------
# Gerador histórico
# ---------------------------------------------------------------------------

async def get_gerador_historico(db: AsyncSession) -> list[dict[str, Any]]:
    """Return a chronological time-series of generator readings.

    Queries all ``RegistroItem`` rows where ``tipo_secao='gerador'`` and
    returns each row's ``dados`` JSONB payload alongside the ronda date and
    sala information, sorted oldest-first.

    Each element of the list has the shape::

        {
            "data": str (ISO date),
            "sala_id": str,
            "sala_nome": str,
            "registro_id": str,
            "dados": dict,           # raw gerador fields from the technician
            "falha": bool,
            "observacao": str | None,
        }
    """
    result = await db.execute(
        select(RegistroItem, Ronda.data, Sala.id.label("sala_id"), Sala.nome.label("sala_nome"))
        .join(Ronda, RegistroItem.ronda_id == Ronda.id)
        .join(Sala, Ronda.sala_id == Sala.id)
        .where(RegistroItem.tipo_secao == "gerador")
        .order_by(Ronda.data.asc(), RegistroItem.created_at.asc())
    )
    rows = result.all()

    return [
        {
            "data": row.data.isoformat() if row.data else None,
            "sala_id": str(row.sala_id),
            "sala_nome": row.sala_nome,
            "registro_id": str(row.RegistroItem.id),
            "dados": row.RegistroItem.dados,
            "falha": row.RegistroItem.falha,
            "observacao": row.RegistroItem.observacao,
        }
        for row in rows
    ]
