from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, model_validator


class RegistroItemCreate(BaseModel):
    ronda_id: UUID
    item_id: UUID | None = None
    tipo_secao: str
    falha: bool = False
    dados: dict
    observacao: str | None = None

    @model_validator(mode="after")
    def observacao_required_when_falha(self) -> "RegistroItemCreate":
        if self.falha and not self.observacao:
            raise ValueError("observacao is required when falha is True")
        return self


class RegistroItemUpdate(BaseModel):
    falha: bool | None = None
    dados: dict | None = None
    observacao: str | None = None

    @model_validator(mode="after")
    def observacao_required_when_falha(self) -> "RegistroItemUpdate":
        if self.falha is True and not self.observacao:
            raise ValueError("observacao is required when falha is True")
        return self


class RegistroItemResponse(BaseModel):
    id: UUID
    ronda_id: UUID
    item_id: UUID | None
    tipo_secao: str
    falha: bool
    dados: dict
    observacao: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FotoResponse(BaseModel):
    id: UUID
    registro_id: UUID
    filename: str
    mimetype: str
    tamanho_bytes: int
    created_at: datetime

    model_config = {"from_attributes": True}
