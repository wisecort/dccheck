from uuid import UUID

from pydantic import BaseModel, Field


class SalaResponse(BaseModel):
    id: UUID
    slug: str
    nome: str
    descricao: str | None
    has_gerador: bool = False
    has_combustivel: bool = False

    model_config = {"from_attributes": True}


class SalaCreate(BaseModel):
    slug: str = Field(..., min_length=2, max_length=32, pattern=r"^[a-z0-9_-]+$")
    nome: str = Field(..., min_length=2, max_length=64)
    descricao: str | None = None
    has_gerador: bool = False
    has_combustivel: bool = False


class SalaUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    has_gerador: bool | None = None
    has_combustivel: bool | None = None


class ItemSalaCreate(BaseModel):
    sala_id: UUID
    tipo: str
    identificador: str
    dados_fixos: dict = {}
    ordem: int = 0


class ItemSalaUpdate(BaseModel):
    tipo: str | None = None
    identificador: str | None = None
    dados_fixos: dict | None = None
    ativo: bool | None = None
    ordem: int | None = None


class ItemSalaResponse(BaseModel):
    id: UUID
    sala_id: UUID
    tipo: str
    identificador: str
    dados_fixos: dict
    ativo: bool
    ordem: int

    model_config = {"from_attributes": True}


class SalaDetailResponse(SalaResponse):
    """Sala with its active items included."""

    itens: list[ItemSalaResponse] = []
