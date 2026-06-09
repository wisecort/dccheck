"""Alembic migration environment for DCCheck.

Supports both *offline* (generate SQL) and *online* (run against the DB)
modes.  The online mode uses an async engine via asyncpg so that it matches
the production SQLAlchemy setup.
"""
from __future__ import annotations

import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

# ---------------------------------------------------------------------------
# Pull the Alembic config object so we can access alembic.ini values.
# ---------------------------------------------------------------------------
config = context.config

# Interpret the config file for Python logging if present.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Import Base and *all* models so that Base.metadata is fully populated.
# ---------------------------------------------------------------------------
# app must be importable from the cwd (i.e. run alembic from backend/).
from app.database import Base  # noqa: E402
import app.models  # noqa: E402, F401  – registers all ORM classes

target_metadata = Base.metadata

# ---------------------------------------------------------------------------
# Database URL resolution
# ---------------------------------------------------------------------------

def get_url() -> str:
    """Return the database URL.

    Priority:
    1. ``DATABASE_URL`` environment variable (set by Docker / CI).
    2. ``sqlalchemy.url`` from alembic.ini (local development fallback).
    """
    url = os.environ.get("DATABASE_URL")
    if url:
        # Ensure we use the async driver even if a sync URL is provided.
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url
    return config.get_main_option("sqlalchemy.url")


# ---------------------------------------------------------------------------
# Offline mode – emit SQL to stdout without connecting to the DB
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Configures the context with just a URL and not an Engine, so no DB
    connection is required.  Calls to ``context.execute()`` emit the SQL to
    the script output.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online mode – connect and run migrations
# ---------------------------------------------------------------------------

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode using an async engine."""
    connectable = create_async_engine(
        get_url(),
        poolclass=pool.NullPool,  # Avoid holding a connection pool open.
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
