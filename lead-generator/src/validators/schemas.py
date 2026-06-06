"""Schemas Pydantic — validação na fronteira entre fontes externas e o banco."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class PlaceResult(BaseModel):
    """Resultado normalizado da Places API (Fase 1)."""

    place_id: str
    name: str
    category: str | None = None
    address: str | None = None
    neighborhood: str | None = None
    phone: str | None = None
    website: str | None = None
    rating: float | None = None
    reviews_count: int | None = None
    opening_hours: str | None = None
    types: list[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def _name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("name vazio")
        return v.strip()


class ExtractedContacts(BaseModel):
    """Saída dos extractors do crawler (Fases 3-5)."""

    emails: list[str] = Field(default_factory=list)
    phones: list[str] = Field(default_factory=list)  # normalizados +55...
    socials: dict[str, str] = Field(default_factory=dict)  # platform -> url


class DecisionMaker(BaseModel):
    """Decisor identificado (Fase 6) — dado pessoal sob base legal."""

    name: str
    role: str | None = None
