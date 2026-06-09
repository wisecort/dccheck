from sqlalchemy import Column, ForeignKey, Integer, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class FotoEvidencia(Base):
    __tablename__ = "fotos_evidencia"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    registro_id = Column(
        UUID(as_uuid=True),
        ForeignKey("registros_item.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = Column(String(255), nullable=True)
    path = Column(String(512), nullable=True)
    mimetype = Column(String(64), nullable=True)
    tamanho_bytes = Column(Integer, nullable=True)
    uploaded_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    registro = relationship("RegistroItem", back_populates="fotos", lazy="select")
    uploader = relationship("User", foreign_keys=[uploaded_by], lazy="select")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<FotoEvidencia id={self.id} filename={self.filename!r}>"
