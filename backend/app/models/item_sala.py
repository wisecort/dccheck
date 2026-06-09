from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class ItemSala(Base):
    __tablename__ = "itens_sala"

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
    tipo = Column(
        String(32),
        nullable=True,
        comment="ac|rack|qdi|nobreak|gerador|extintor",
    )
    identificador = Column(
        String(64),
        nullable=True,
        comment="e.g. AC-07, SC 01 A",
    )
    dados_fixos = Column(JSONB, nullable=True)
    ativo = Column(Boolean, nullable=False, default=True, server_default=text("true"))
    ordem = Column(Integer, nullable=False, default=0, server_default=text("0"))
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    sala = relationship("Sala", back_populates="itens_sala", lazy="select")
    criador = relationship("User", foreign_keys=[created_by], lazy="select")
    registros = relationship(
        "RegistroItem",
        back_populates="item",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<ItemSala id={self.id} tipo={self.tipo!r} identificador={self.identificador!r}>"
