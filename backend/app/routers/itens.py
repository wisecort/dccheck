"""Itens router for DCCheck (admin only).

Endpoints:
    GET    /itens/sala/{sala_id}  – list all items for a sala
    POST   /itens/                – create a new item
    PUT    /itens/{id}            – update an existing item
    DELETE /itens/{id}            – soft-delete (ativo=False)
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.item_sala import ItemSala
from app.models.sala import Sala
from app.schemas.sala import ItemSalaCreate, ItemSalaResponse, ItemSalaUpdate
from app.utils.permissions import require_admin

router = APIRouter(prefix="/itens", tags=["itens"])


@router.get("/sala/{sala_id}", response_model=list[ItemSalaResponse])
async def list_itens_by_sala(
    sala_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> list[ItemSalaResponse]:
    """List all items (including inactive) for a given sala."""
    result = await db.execute(
        select(ItemSala)
        .where(ItemSala.sala_id == sala_id)
        .order_by(ItemSala.ordem, ItemSala.id)
    )
    itens = result.scalars().all()
    return [ItemSalaResponse.model_validate(i) for i in itens]


@router.post("/", response_model=ItemSalaResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    body: ItemSalaCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
) -> ItemSalaResponse:
    """Create a new item for a sala."""
    # Verify sala exists
    sala_result = await db.execute(select(Sala).where(Sala.id == body.sala_id))
    if sala_result.scalars().first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sala '{body.sala_id}' não encontrada.",
        )

    item = ItemSala(
        sala_id=body.sala_id,
        tipo=body.tipo,
        identificador=body.identificador,
        dados_fixos=body.dados_fixos,
        ativo=True,
        ordem=body.ordem,
        created_by=admin.id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return ItemSalaResponse.model_validate(item)


@router.put("/{item_id}", response_model=ItemSalaResponse)
async def update_item(
    item_id: UUID,
    body: ItemSalaUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> ItemSalaResponse:
    """Update an existing item."""
    result = await db.execute(select(ItemSala).where(ItemSala.id == item_id))
    item: ItemSala | None = result.scalars().first()

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado.",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.add(item)
    await db.commit()
    await db.refresh(item)
    return ItemSalaResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
async def delete_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
) -> dict:
    """Soft-delete an item by setting ativo=False."""
    result = await db.execute(select(ItemSala).where(ItemSala.id == item_id))
    item: ItemSala | None = result.scalars().first()

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado.",
        )

    item.ativo = False
    db.add(item)
    await db.commit()
    return {"message": "Item desativado com sucesso."}
