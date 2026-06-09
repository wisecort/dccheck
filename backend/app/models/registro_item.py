from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    String,
    Text,
    TIMESTAMP,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class RegistroItem(Base):
    __tablename__ = "registros_item"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    ronda_id = Column(
        UUID(as_uuid=True),
        ForeignKey("rondas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("itens_sala.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    tipo_secao = Column(String(32), nullable=True)
    falha = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    dados = Column(JSONB, nullable=False)
    observacao = Column(Text, nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    ronda = relationship("Ronda", back_populates="registros", lazy="select")
    item = relationship("ItemSala", back_populates="registros", lazy="select")
    fotos = relationship(
        "FotoEvidencia",
        back_populates="registro",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<RegistroItem id={self.id} ronda_id={self.ronda_id} falha={self.falha}>"
