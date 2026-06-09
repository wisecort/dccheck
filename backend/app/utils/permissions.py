from fastapi import Depends, HTTPException, status

from app.models.user import User, UserRole
from app.utils.jwt import get_current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that allows only users with the 'admin' role.

    Raises:
        HTTPException 403 – if the authenticated user is not an admin.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )
    return current_user


def require_gestor_or_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that allows users with the 'gestor' or 'admin' role.

    Raises:
        HTTPException 403 – if the authenticated user is a plain 'tecnico'.
    """
    allowed = {UserRole.gestor, UserRole.admin}
    if current_user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a gestores e administradores.",
        )
    return current_user


def require_tecnico_or_above(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that allows any authenticated and active user regardless of role
    (tecnico, gestor, or admin). Authentication itself is enforced by
    get_current_user, which already checks is_active.
    """
    return current_user
