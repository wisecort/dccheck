"""002_sala_gerador_flags

Add has_gerador and has_combustivel boolean columns to salas so that the form
can dynamically render gerador/combustivel sections instead of hardcoding by slug.

Revision ID: 002
Revises: 001
Create Date: 2026-04-06
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "salas",
        sa.Column(
            "has_gerador",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "salas",
        sa.Column(
            "has_combustivel",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    # Backfill: existing salagerador gets both flags
    op.execute(
        "UPDATE salas SET has_gerador = true, has_combustivel = true WHERE slug = 'salagerador'"
    )


def downgrade() -> None:
    op.drop_column("salas", "has_combustivel")
    op.drop_column("salas", "has_gerador")
