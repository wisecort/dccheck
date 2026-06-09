from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db

ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def create_access_token(data: dict[str, Any]) -> str:
    """Create a signed JWT access token that expires in ACCESS_TOKEN_MINUTES minutes."""
    payload = data.copy()
    expire = _utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict[str, Any]) -> str:
    """Create a signed JWT refresh token that expires in REFRESH_TOKEN_DAYS days."""
    payload = data.copy()
    expire = _utcnow() + timedelta(days=settings.REFRESH_TOKEN_DAYS)
    payload.update({"exp": expire, "type": "refresh"})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT token.

    Raises:
        HTTPException 401 – if the token is invalid, expired, or malformed.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise credentials_exception


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    FastAPI dependency that extracts and validates the current authenticated user
    from the Bearer token present in the Authorization header.

    Raises:
        HTTPException 401 – token invalid / user not found.
        HTTPException 403 – user account is inactive.
    """
    # Lazy import to avoid circular dependency at module load time
    from app.models.user import User  # noqa: PLC0415

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)

    # Expect "sub" to hold the user's string UUID
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Validate token type – must be an access token
    token_type: str | None = payload.get("type")
    if token_type != "access":
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalars().first()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta de usuário desativada.",
        )

    return user
