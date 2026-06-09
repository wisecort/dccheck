"""Authentication router for DCCheck.

Endpoints:
    POST /login           – exchange credentials for JWT tokens
    POST /refresh         – exchange a refresh token for a new access token
    POST /logout          – stateless logout (client discards tokens)
    POST /forgot-password – send a password-reset email
    POST /reset-password  – consume a reset token and update the password
    GET  /me              – return the current authenticated user
"""
from __future__ import annotations

import aiosmtplib
from email.mime.text import MIMEText

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    create_password_reset_token,
    hash_password,
    invalidate_user_sessions,
    mark_token_used,
    verify_reset_token,
)
from app.utils.jwt import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _send_reset_email(to_email: str, token: str) -> None:
    """Send password-reset email via SMTP (runs in a background task)."""
    reset_link = f"http://dccheck.smart.intranet/reset-password?token={token}"
    body = (
        f"Você solicitou a redefinição de senha do DCCheck.\n\n"
        f"Clique no link abaixo para redefinir sua senha (válido por "
        f"{settings.RESET_TOKEN_MINUTES} minutos):\n\n{reset_link}\n\n"
        "Se não foi você, ignore este e-mail."
    )
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = "DCCheck – Redefinição de senha"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            start_tls=settings.SMTP_PORT == 587,
        )
    except Exception:
        # Log but do not surface SMTP errors to the caller.
        pass


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate with username + password, return JWT access and refresh tokens."""
    user = await authenticate_user(db, body.username, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Exchange a valid refresh token for a new access token."""
    payload = decode_token(body.refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de atualização inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de atualização inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalars().first()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado ou inativo.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = {"sub": str(user.id), "role": user.role.value}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    _current_user: User = Depends(get_current_user),
) -> dict:
    """Stateless logout – instruct the client to discard its tokens."""
    return {"message": "Logout realizado com sucesso."}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    body: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Initiate password reset. Always returns 200 to avoid user enumeration."""
    result = await db.execute(select(User).where(User.email == body.email))
    user: User | None = result.scalars().first()

    if user and user.is_active:
        raw_token = await create_password_reset_token(db, user)
        background_tasks.add_task(_send_reset_email, user.email, raw_token)

    return {"message": "Se o e-mail existir, você receberá as instruções em breve."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Consume a password-reset token and update the user's password."""
    user = await verify_reset_token(db, body.token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido, expirado ou já utilizado.",
        )

    user.hashed_password = hash_password(body.new_password)
    db.add(user)

    # Mark this token as used and invalidate all other pending reset tokens.
    await mark_token_used(db, body.token)
    await invalidate_user_sessions(db, str(user.id))
    await db.commit()

    return {"message": "Senha redefinida com sucesso."}


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)
