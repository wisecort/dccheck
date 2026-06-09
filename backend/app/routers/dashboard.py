"""Dashboard router for DCCheck.

Endpoints:
    GET /dashboard/summary          – high-level KPIs for today
    GET /dashboard/salas-status     – per-sala status summary
    GET /dashboard/gerador-historico – time-series of gerador readings
    GET /dashboard/rondas-pendentes  – salas without a ronda today
"""
from __future__ import annotations

from datetime import date, datetime, timezone

from app.utils.tz import local_today
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.registro_item import RegistroItem
from app.models.ronda import Ronda
from app.models.sala import Sala
from app.models.user import User
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _today() -> date:
    return local_today()


# ---------------------------------------------------------------------------
# GET /summary
# ---------------------------------------------------------------------------

@router.get("/summary")
async def summary(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Return KPI counts for today.

    Response shape:
        {
            "rondas_hoje":    <int>,
            "falhas_hoje":    <int>,
            "itens_nok":      <int>,
            "salas_pendentes":<int>,
        }
    """
    today = _today()

    # Total rondas today
    rondas_hoje_result = await db.execute(
        select(func.count(Ronda.id)).where(Ronda.data == today)
    )
    rondas_hoje: int = rondas_hoje_result.scalar_one()

    # Rondas with falha_geral today
    falhas_hoje_result = await db.execute(
        select(func.count(Ronda.id)).where(
            Ronda.data == today,
            Ronda.falha_geral.is_(True),
        )
    )
    falhas_hoje: int = falhas_hoje_result.scalar_one()

    # RegistroItem rows with falha=True (all-time is useful for ops; today only could be done too)
    # We scope to today's rondas for context relevance.
    today_ronda_ids_result = await db.execute(
        select(Ronda.id).where(Ronda.data == today)
    )
    today_ronda_ids = [row[0] for row in today_ronda_ids_result.all()]

    itens_nok: int = 0
    if today_ronda_ids:
        nok_result = await db.execute(
            select(func.count(RegistroItem.id)).where(
                RegistroItem.ronda_id.in_(today_ronda_ids),
                RegistroItem.falha.is_(True),
            )
        )
        itens_nok = nok_result.scalar_one()

    # Salas without a ronda today
    all_salas_result = await db.execute(select(func.count(Sala.id)))
    total_salas: int = all_salas_result.scalar_one()

    salas_com_ronda_result = await db.execute(
        select(func.count(func.distinct(Ronda.sala_id))).where(Ronda.data == today)
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
# GET /salas-status
# ---------------------------------------------------------------------------

@router.get("/salas-status")
async def salas_status(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Return status summary for each sala.

    Each item:
        {
            "sala_id":       <uuid>,
            "slug":          <str>,
            "nome":          <str>,
            "ultima_ronda":  <date | null>,
            "falhas_hoje":   <int>,
            "tem_ronda_hoje":<bool>,
        }
    """
    today = _today()

    salas_result = await db.execute(select(Sala).order_by(Sala.nome))
    salas = salas_result.scalars().all()

    response = []
    for sala in salas:
        # Last ronda date for this sala
        last_ronda_result = await db.execute(
            select(Ronda.data)
            .where(Ronda.sala_id == sala.id)
            .order_by(Ronda.data.desc(), Ronda.hora_entrada.desc())
            .limit(1)
        )
        last_ronda_date: date | None = last_ronda_result.scalar_one_or_none()

        # Falha count today
        falhas_result = await db.execute(
            select(func.count(Ronda.id)).where(
                Ronda.sala_id == sala.id,
                Ronda.data == today,
                Ronda.falha_geral.is_(True),
            )
        )
        falhas_hoje: int = falhas_result.scalar_one()

        tem_ronda_hoje = last_ronda_date == today

        response.append(
            {
                "sala_id": sala.id,
                "slug": sala.slug,
                "nome": sala.nome,
                "ultima_ronda": last_ronda_date,
                "falhas_hoje": falhas_hoje,
                "tem_ronda_hoje": tem_ronda_hoje,
            }
        )

    return response


# ---------------------------------------------------------------------------
# GET /gerador-historico
# ---------------------------------------------------------------------------

@router.get("/gerador-historico")
async def gerador_historico(
    sala: str | None = Query(default=None, description="Slug da sala do gerador"),
    limite: int = Query(default=30, ge=1, le=365, description="Número de registros"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Return a time-series of gerador readings stored in RegistroItem.dados.

    Gerador records are RegistroItem rows where tipo_secao='gerador'.
    The ``dados`` JSONB field is expected to contain keys like:
        kw, kva, frequencia, tensao, corrente
    along with the associated ronda date.

    Response items:
        {
            "data":       <date>,
            "hora":       <time>,
            "kw":         <float | null>,
            "kva":        <float | null>,
            "frequencia": <float | null>,
            "tensao":     <float | null>,
            "corrente":   <float | null>,
        }
    """
    # Build base query: join RegistroItem -> Ronda for date/time; filter gerador
    stmt = (
        select(RegistroItem, Ronda.data, Ronda.hora_entrada, Sala.slug)
        .join(Ronda, RegistroItem.ronda_id == Ronda.id)
        .join(Sala, Ronda.sala_id == Sala.id)
        .where(RegistroItem.tipo_secao == "gerador")
        .order_by(Ronda.data.desc(), Ronda.hora_entrada.desc())
        .limit(limite)
    )

    if sala is not None:
        stmt = stmt.where(Sala.slug == sala)

    result = await db.execute(stmt)
    rows = result.all()

    def _to_float(v: Any) -> float | None:
        if v is None or v == "":
            return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    def _avg(*vals: Any) -> float | None:
        nums = [x for x in (_to_float(v) for v in vals) if x is not None]
        if not nums:
            return None
        return round(sum(nums) / len(nums), 2)

    historico = []
    for registro, ronda_data, hora_entrada, sala_slug in rows:
        dados: dict = registro.dados or {}
        historico.append(
            {
                "data": ronda_data,
                "hora": hora_entrada,
                "sala_slug": sala_slug,
                "kw": _to_float(dados.get("load_kw") or dados.get("kw")),
                "kva": _to_float(dados.get("load_kva") or dados.get("kva")),
                "frequencia": _to_float(
                    dados.get("frequencia_hz") or dados.get("frequencia")
                ),
                "tensao": _avg(
                    dados.get("tensao_l1_n"),
                    dados.get("tensao_l2_n"),
                    dados.get("tensao_l3_n"),
                ) or _to_float(dados.get("tensao")),
                "corrente": _avg(
                    dados.get("corrente_l1"),
                    dados.get("corrente_l2"),
                    dados.get("corrente_l3"),
                ) or _to_float(dados.get("corrente")),
            }
        )

    # Return in chronological order for chart consumption
    historico.reverse()
    return historico


# ---------------------------------------------------------------------------
# GET /rondas-pendentes
# ---------------------------------------------------------------------------

@router.get("/rondas-pendentes")
async def rondas_pendentes(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Return salas that have not yet received a ronda today.

    Response items:
        {
            "sala_id": <uuid>,
            "slug":    <str>,
            "nome":    <str>,
        }
    """
    today = _today()

    # Sala IDs that already have at least one ronda today
    covered_result = await db.execute(
        select(func.distinct(Ronda.sala_id)).where(Ronda.data == today)
    )
    covered_ids = {row[0] for row in covered_result.all()}

    # All salas
    salas_result = await db.execute(select(Sala).order_by(Sala.nome))
    salas = salas_result.scalars().all()

    return [
        {"sala_id": s.id, "slug": s.slug, "nome": s.nome}
        for s in salas
        if s.id not in covered_ids
    ]
