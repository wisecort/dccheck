"""Fotos router for DCCheck.

Endpoints:
    POST   /fotos/upload  – upload a photo (multipart form)
    DELETE /fotos/{id}    – delete a photo (owner or gestor/admin)
"""
from __future__ import annotations

import os
import uuid
from uuid import UUID

import aiofiles
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.foto_evidencia import FotoEvidencia
from app.models.registro_item import RegistroItem
from app.models.user import User, UserRole
from app.schemas.registro import FotoResponse
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/fotos", tags=["fotos"])

_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

_ALLOWED_MIMETYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


@router.post("/upload", response_model=FotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_foto(
    registro_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FotoResponse:
    """Upload a photo evidence file linked to a registro_item.

    Constraints:
    - File must be an image (validated via content-type)
    - Maximum file size: 10 MB
    """
    # Validate mimetype
    mimetype = file.content_type or ""
    if mimetype not in _ALLOWED_MIMETYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Tipo de arquivo não permitido: '{mimetype}'. Envie uma imagem.",
        )

    # Verify registro exists
    reg_result = await db.execute(
        select(RegistroItem).where(RegistroItem.id == registro_id)
    )
    registro: RegistroItem | None = reg_result.scalars().first()
    if registro is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado.",
        )

    # Read file contents (enforce size limit)
    contents = await file.read()
    if len(contents) > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Arquivo excede o limite de 10 MB.",
        )

    # Build a unique filename and persist to disk
    ext = os.path.splitext(file.filename or "foto")[1] or ".jpg"
    unique_name = f"{uuid.uuid4()}{ext}"
    dest_dir = settings.STORAGE_PATH
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, unique_name)

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(contents)

    foto = FotoEvidencia(
        registro_id=registro_id,
        filename=unique_name,
        path=dest_path,
        mimetype=mimetype,
        tamanho_bytes=len(contents),
        uploaded_by=current_user.id,
    )
    db.add(foto)
    await db.commit()
    await db.refresh(foto)
    return FotoResponse.model_validate(foto)


@router.delete("/{foto_id}", status_code=status.HTTP_200_OK)
async def delete_foto(
    foto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a photo. Only the file owner, a gestor, or an admin may do this."""
    result = await db.execute(select(FotoEvidencia).where(FotoEvidencia.id == foto_id))
    foto: FotoEvidencia | None = result.scalars().first()

    if foto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Foto não encontrada.",
        )

    is_privileged = current_user.role in {UserRole.gestor, UserRole.admin}
    is_owner = foto.uploaded_by == current_user.id

    if not is_privileged and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para excluir esta foto.",
        )

    # Remove from filesystem (best-effort)
    if foto.path and os.path.exists(foto.path):
        try:
            os.remove(foto.path)
        except OSError:
            pass

    await db.delete(foto)
    await db.commit()
    return {"message": "Foto excluída com sucesso."}
