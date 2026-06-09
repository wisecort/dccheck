from sqlalchemy import Boolean, Column, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Sala(Base):
    __tablename__ = "salas"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    slug = Column(String(32), unique=True, nullable=False, index=True)
    nome = Column(String(64), nullable=False)
    descricao = Column(Text, nullable=True)
    has_gerador = Column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    has_combustivel = Column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )

    # Relationships
    itens_sala = relationship(
        "ItemSala",
        back_populates="sala",
        cascade="all, delete-orphan",
        lazy="select",
    )
    rondas = relationship(
        "Ronda",
        back_populates="sala",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Sala id={self.id} slug={self.slug!r}>"
