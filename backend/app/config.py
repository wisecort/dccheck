from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dccheck"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_MINUTES: int = 60
    REFRESH_TOKEN_DAYS: int = 7

    # Storage
    STORAGE_PATH: str = "/app/storage/fotos"

    # CORS
    ALLOWED_ORIGINS: str = "http://dccheck.smart.intranet"

    # SMTP
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@smart.intranet"

    # Notifications
    GESTOR_EMAIL: str = ""

    # Password reset
    RESET_TOKEN_MINUTES: int = 30

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
