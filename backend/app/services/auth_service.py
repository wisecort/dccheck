"""Authentication service for DCCheck.

Provides user authentication, password reset token lifecycle management,
and session invalidation helpers.
"""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User

# Lazy import to avoid circular dependency – PasswordResetToken is defined
# in its own module that depends on User.
from app.models.password_reset_token import PasswordResetToken


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hash_token(raw_token: str) -> str:
    """Return the SHA-256 hex digest of *raw_token*."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


def _verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def hash_password(plain: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return _bcrypt.hashpw(plain.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

async def authenticate_user(
    db: AsyncSession, username: str, password: str
) -> User | None:
    """Return the User if *username* exists and *password* is correct.

    Returns ``None`` for unknown users or wrong passwords – callers must not
    distinguish between the two cases (timing-safe via passlib).
    """
    result = await db.execute(select(User).where(User.username == username))
    user: User | None = result.scalars().first()
    if user is None:
        # Run a dummy verify so timing is consistent regardless of existence.
        _bcrypt.checkpw(b"dummy", _bcrypt.hashpw(b"dummy", _bcrypt.gensalt()))
        return None
    if not _verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


async def create_password_reset_token(
    db: AsyncSession, user: User
) -> str:
    """Generate a password-reset token, persist its hash, and return the raw token.

    The raw token is never stored; only its SHA-256 hash is persisted so that
    a database breach cannot be used to reset passwords.

    Expires after ``settings.RESET_TOKEN_MINUTES`` minutes (default 30).
    """
    raw_token = str(uuid.uuid4())
    token_hash = _hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.RESET_TOKEN_MINUTES
    )
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=False,
    )
    db.add(reset_token)
    await db.commit()
    await db.refresh(reset_token)
    return raw_token


async def verify_reset_token(
    db: AsyncSession, raw_token: str
) -> User | None:
    """Look up a valid (unused, non-expired) reset token.

    Returns the associated ``User`` when the token is valid, otherwise
    ``None``.
    """
    token_hash = _hash_token(raw_token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(PasswordResetToken)
        .where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used.is_(False),
            PasswordResetToken.expires_at > now,
        )
        .limit(1)
    )
    reset_token: PasswordResetToken | None = result.scalars().first()
    if reset_token is None:
        return None

    user_result = await db.execute(
        select(User).where(User.id == reset_token.user_id)
    )
    return user_result.scalars().first()


async def mark_token_used(db: AsyncSession, raw_token: str) -> None:
    """Mark the reset token identified by *raw_token* as used.

    Safe to call even if the token no longer exists.
    """
    token_hash = _hash_token(raw_token)
    await db.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.token_hash == token_hash)
        .values(used=True)
    )
    await db.commit()


async def invalidate_user_sessions(db: AsyncSession, user_id: str) -> None:
    """Invalidate all active reset tokens for *user_id*.

    Because DCCheck uses stateless JWT access tokens there is no server-side
    session store to clear.  This function marks all outstanding (unused,
    non-expired) password-reset tokens as used so that a concurrent reset
    attempt cannot succeed after a successful password change.
    """
    await db.execute(
        update(PasswordResetToken)
        .where(
            PasswordResetToken.user_id == user_id,
            PasswordResetToken.used.is_(False),
        )
        .values(used=True)
    )
    await db.commit()
