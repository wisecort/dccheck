from datetime import date, datetime, time
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class RondaCreate(BaseModel):
    sala_id: UUID
    hora_entrada: time
    hora_saida: time | None = None
    limpeza: Literal["limpo", "medio", "sujo"]
    organizacao: bool
    iluminacao: bool
    vazamento: bool
    observacoes: str | None = None


class RondaUpdate(BaseModel):
    hora_saida: time | None = None
    limpeza: Literal["limpo", "medio", "sujo"] | None = None
    organizacao: bool | None = None
    iluminacao: bool | None = None
    vazamento: bool | None = None
    observacoes: str | None = None
    falha_geral: bool | None = None


class RondaResponse(BaseModel):
    id: UUID
    sala_id: UUID
    data: date
    tecnico_id: UUID
    hora_entrada: time
    hora_saida: time | None
    limpeza: str
    organizacao: bool
    iluminacao: bool
    vazamento: bool
    falha_geral: bool
    observacoes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class RondaListResponse(RondaResponse):
    """Ronda with denormalized sala nome and tecnico username for list views."""

    sala_nome: str
    tecnico_username: str
