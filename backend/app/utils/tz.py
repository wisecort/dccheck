"""Timezone helpers for DCCheck.

Rondas and dashboard KPIs are reasoned about in local business time, not UTC.
The container runs in UTC by default, so computing ``date.today()`` there will
roll the date over three hours early compared to São Paulo, making yesterday's
evening rondas count as "today" for the next day's dashboard.

``APP_TZ`` env var can override the default (``America/Sao_Paulo``).
"""
from __future__ import annotations

import os
from datetime import date, datetime
from zoneinfo import ZoneInfo

APP_TZ = ZoneInfo(os.getenv("APP_TZ", "America/Sao_Paulo"))


def local_today() -> date:
    """Return today's date in the application's local timezone."""
    return datetime.now(tz=APP_TZ).date()


def local_now() -> datetime:
    """Return the current datetime in the application's local timezone."""
    return datetime.now(tz=APP_TZ)
