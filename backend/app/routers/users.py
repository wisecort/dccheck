"""Users admin router for DCCheck.

Endpoints (all require admin):
    GET    /users/          – list all users
    POST   /users/          – create a new user
    PUT    /users/{id}      – update an existing user (email/role/active/password)
    DELETE /users/{id}      – delete a user (blocked if they have rondas)
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserAdminResponse, UserCreate, UserUpdate
from app.services.auth_service import hash_password
from app.utils.permissions import require_admin

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserAdminResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> list[UserAdminResponse]:
    result = await db.execute(select(User).order_by(User.username))
    users = result.scalars().all()
    return [UserAdminResponse.model_validate(u) for u in users]


@router.post("/", response_model=UserAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> UserAdminResponse:
    # Check conflicts
    existing = await db.execute(
        select(User).where(or_(User.username == body.username, User.email == body.email))
    )
    if existing.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um usuário com este username ou email.",
        )

    user = User(
        username=body.username,
        email=body.email,
        role=body.role,
        is_active=body.is_active,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um usuário com este username ou email.",
        )
    await db.refresh(user)
    return UserAdminResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserAdminResponse)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> UserAdminResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    data = body.model_dump(exclude_unset=True)
    if "password" in data:
        pwd = data.pop("password")
        if pwd:
            user.hashed_password = hash_password(pwd)
    for field, value in data.items():
        setattr(user, field, value)

    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já em uso.",
        )
    await db.refresh(user)
    return UserAdminResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    if str(admin.id) == str(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode excluir a si mesmo.",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    try:
        await db.delete(user)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível excluir um usuário com rondas associadas. Desative-o.",
        )
    return {"message": "Usuário excluído com sucesso."}
