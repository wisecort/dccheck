# Import all models here so that SQLAlchemy's metadata (and therefore Alembic's
# autogenerate) is aware of every table when env.py imports this package.

from app.models.user import User, UserRole  # noqa: F401
from app.models.sala import Sala  # noqa: F401
from app.models.item_sala import ItemSala  # noqa: F401
from app.models.ronda import Ronda, LimpezaStatus  # noqa: F401
from app.models.registro_item import RegistroItem  # noqa: F401
from app.models.foto_evidencia import FotoEvidencia  # noqa: F401
from app.models.password_reset_token import PasswordResetToken  # noqa: F401

__all__ = [
    "User",
    "UserRole",
    "Sala",
    "ItemSala",
    "Ronda",
    "LimpezaStatus",
    "RegistroItem",
    "FotoEvidencia",
    "PasswordResetToken",
]
