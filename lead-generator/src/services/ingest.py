"""Fase 1 — orquestra a busca no Places e persiste com deduplicação (upsert por place_id)."""
from __future__ import annotations

import asyncio

from loguru import logger

from src.config import get_settings
from src.database.models import Company, Segment
from src.database.session import get_session
from src.maps.places_client import PlacesClient
from src.services.classifier import classify_segment
from src.validators.schemas import PlaceResult

# Queries por segmento (Fase 1)
SEGMENT_QUERIES: dict[str, list[str]] = {
    "salao": ["salão de beleza", "barbearia"],
    "clinica": ["clínica de estética", "harmonização facial", "spa estético"],
    "escola": ["escola particular", "colégio particular"],
    "petshop": ["petshop", "banho e tosa", "clínica veterinária"],
    "medica": ["clínica médica", "consultório médico"],
    "odontologia": ["consultório odontológico", "dentista", "clínica odontológica"],
    "terapias": ["clínica de psicologia", "fisioterapia", "terapias integrativas"],
    "imobiliaria": ["imobiliária", "corretor de imóveis"],
}


def _build_queries(segment: str, city: str) -> list[str]:
    keys = SEGMENT_QUERIES.keys() if segment == "all" else [segment]
    return [f"{q} {city}" for k in keys for q in SEGMENT_QUERIES[k]]


def _upsert(result: PlaceResult) -> bool:
    """Insere ou atualiza por place_id. Retorna True se for novo."""
    settings = get_settings()
    with get_session() as s:
        company = s.query(Company).filter_by(place_id=result.place_id).one_or_none()
        is_new = company is None
        if is_new:
            company = Company(place_id=result.place_id, data_source="google_places")
            s.add(company)
        company.name = result.name
        company.category = result.category
        company.address = result.address
        company.neighborhood = result.neighborhood
        company.phone = result.phone
        company.website = result.website
        company.rating = result.rating
        company.reviews_count = result.reviews_count
        company.opening_hours = result.opening_hours
        company.segment = classify_segment(result.name, result.category, result.types)
    return is_new


async def run_search(segment: str = "all") -> dict[str, int]:
    settings = get_settings()
    queries = _build_queries(segment, settings.search_city)
    client = PlacesClient(settings)

    results: list[PlaceResult] = []
    for batch in await asyncio.gather(*(client.search(q) for q in queries)):
        results.extend(batch)

    new_count = 0
    for r in results:
        if _upsert(r):
            new_count += 1

    stats = {"queries": len(queries), "found": len(results), "new": new_count}
    logger.info("Ingest concluído: {}", stats)
    return stats
