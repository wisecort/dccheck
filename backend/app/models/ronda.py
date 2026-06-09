import enum
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Enum,
    ForeignKey,
    Text,
    Time,
    TIMESTAMP,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class LimpezaStatus(str, enum.Enum):
    limpo = "limpo"
    medio = "medio"
    sujo = "sujo"


class Ronda(Base):
    __tablename__ = "rondas"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    sala_id = Column(
        UUID(as_uuid=True),
        ForeignKey("salas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    data = Column(Date, nullable=False, index=True)
    tecnico_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    hora_entrada = Column(Time, nullable=False)
    hora_saida = Column(Time, nullable=True)
    limpeza = Column(
        Enum(LimpezaStatus, name="limpezastatus", create_type=True),
        nullable=False,
    )
    organizacao = Column(Boolean, nullable=False)
    iluminacao = Column(Boolean, nullable=False)
    vazamento = Column(Boolean, nullable=False)
    falha_geral = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    observacoes = Column(Text, nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    sala = relationship("Sala", back_populates="rondas", lazy="select")
    tecnico = relationship("User", foreign_keys=[tecnico_id], lazy="select")
    registros = relationship(
        "RegistroItem",
        back_populates="ronda",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Ronda id={self.id} sala_id={self.sala_id} data={self.data}>"
