"""Configuração central via variáveis de ambiente (.env)."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Banco
    postgres_user: str = "leadgen"
    postgres_password: str = "leadgen"
    postgres_db: str = "leadgen"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    # Google Places
    google_places_api_key: str = ""

    # Coleta
    search_city: str = "São Paulo"
    search_region_code: str = "BR"
    search_language: str = "pt-BR"
    max_results_per_query: int = 120
    request_timeout: int = 20
    rate_limit_rps: float = 5.0

    # LGPD
    default_legal_basis: str = "legitimo_interesse_art_7_IX"

    # LLM opcional
    llm_provider: str = ""  # "" | "anthropic" | "openai"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    llm_model: str = "claude-sonnet-4-6"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
