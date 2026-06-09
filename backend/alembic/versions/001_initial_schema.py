"""001_initial_schema

Create all DCCheck tables and seed the four datacenter rooms.

Revision ID: 001
Revises:
Create Date: 2026-04-06

"""
from __future__ import annotations

import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# ---------------------------------------------------------------------------
# Alembic metadata
# ---------------------------------------------------------------------------
revision: str = "001"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


# ---------------------------------------------------------------------------
# Upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:
    # ------------------------------------------------------------------
    # Custom enum types
    # ------------------------------------------------------------------
    userrole = postgresql.ENUM("admin", "gestor", "tecnico", name="userrole", create_type=False)
    userrole.create(op.get_bind(), checkfirst=True)

    limpezastatus = postgresql.ENUM("limpo", "medio", "sujo", name="limpezastatus", create_type=False)
    limpezastatus.create(op.get_bind(), checkfirst=True)

    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            postgresql.ENUM("admin", "gestor", "tecnico", name="userrole", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ------------------------------------------------------------------
    # salas
    # ------------------------------------------------------------------
    op.create_table(
        "salas",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("slug", sa.String(32), nullable=False),
        sa.Column("nome", sa.String(64), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
    )
    op.create_index("ix_salas_slug", "salas", ["slug"], unique=True)

    # ------------------------------------------------------------------
    # itens_sala
    # ------------------------------------------------------------------
    op.create_table(
        "itens_sala",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "sala_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("salas.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("tipo", sa.String(32), nullable=True),
        sa.Column("identificador", sa.String(64), nullable=True),
        sa.Column("dados_fixos", postgresql.JSONB(), nullable=True),
        sa.Column(
            "ativo",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "ordem",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_itens_sala_sala_id", "itens_sala", ["sala_id"])

    # ------------------------------------------------------------------
    # rondas
    # ------------------------------------------------------------------
    op.create_table(
        "rondas",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "sala_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("salas.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column(
            "tecnico_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("hora_entrada", sa.Time(), nullable=False),
        sa.Column("hora_saida", sa.Time(), nullable=True),
        sa.Column(
            "limpeza",
            postgresql.ENUM("limpo", "medio", "sujo", name="limpezastatus", create_type=False),
            nullable=False,
        ),
        sa.Column("organizacao", sa.Boolean(), nullable=False),
        sa.Column("iluminacao", sa.Boolean(), nullable=False),
        sa.Column("vazamento", sa.Boolean(), nullable=False),
        sa.Column(
            "falha_geral",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_rondas_sala_id", "rondas", ["sala_id"])
    op.create_index("ix_rondas_data", "rondas", ["data"])
    op.create_index("ix_rondas_tecnico_id", "rondas", ["tecnico_id"])

    # ------------------------------------------------------------------
    # registros_item
    # ------------------------------------------------------------------
    op.create_table(
        "registros_item",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "ronda_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("rondas.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("itens_sala.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("tipo_secao", sa.String(32), nullable=True),
        sa.Column(
            "falha",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("dados", postgresql.JSONB(), nullable=False),
        sa.Column("observacao", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_registros_item_ronda_id", "registros_item", ["ronda_id"])
    op.create_index("ix_registros_item_item_id", "registros_item", ["item_id"])

    # ------------------------------------------------------------------
    # fotos_evidencia
    # ------------------------------------------------------------------
    op.create_table(
        "fotos_evidencia",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "registro_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("registros_item.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("filename", sa.String(255), nullable=True),
        sa.Column("path", sa.String(512), nullable=True),
        sa.Column("mimetype", sa.String(64), nullable=True),
        sa.Column("tamanho_bytes", sa.Integer(), nullable=True),
        sa.Column(
            "uploaded_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_fotos_evidencia_registro_id", "fotos_evidencia", ["registro_id"])

    # ------------------------------------------------------------------
    # password_reset_tokens
    # ------------------------------------------------------------------
    op.create_table(
        "password_reset_tokens",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(255), nullable=False),
        sa.Column(
            "used",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"]
    )
    op.create_index(
        "ix_password_reset_tokens_token_hash",
        "password_reset_tokens",
        ["token_hash"],
        unique=True,
    )

    # ------------------------------------------------------------------
    # Seed data – the four datacenter rooms
    # ------------------------------------------------------------------
    salas_table = sa.table(
        "salas",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("slug", sa.String),
        sa.column("nome", sa.String),
        sa.column("descricao", sa.Text),
    )

    op.bulk_insert(
        salas_table,
        [
            {
                "id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
                "slug": "antisala",
                "nome": "Anti Sala",
                "descricao": "NOC / área de suporte e controle",
            },
            {
                "id": uuid.UUID("00000000-0000-0000-0000-000000000002"),
                "slug": "salatelecom",
                "nome": "Sala Telecom",
                "descricao": "Equipamentos de telecomunicações",
            },
            {
                "id": uuid.UUID("00000000-0000-0000-0000-000000000003"),
                "slug": "salacofre",
                "nome": "Sala Cofre",
                "descricao": "Servidores e storage (datacenter)",
            },
            {
                "id": uuid.UUID("00000000-0000-0000-0000-000000000004"),
                "slug": "salaenergia",
                "nome": "Sala de Energia",
                "descricao": "Nobreaks, gerador e quadros elétricos",
            },
        ],
    )


# ---------------------------------------------------------------------------
# Downgrade
# ---------------------------------------------------------------------------

def downgrade() -> None:
    # Drop tables in reverse dependency order.
    op.drop_table("password_reset_tokens")
    op.drop_table("fotos_evidencia")
    op.drop_table("registros_item")
    op.drop_table("rondas")
    op.drop_table("itens_sala")
    op.drop_table("salas")
    op.drop_table("users")

    # Drop custom enum types.
    sa.Enum(name="limpezastatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=True)
