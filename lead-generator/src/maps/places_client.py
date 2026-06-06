"""Fase 1 — Google Places API (New). Fonte oficial, estável e legal.

Usa o endpoint Text Search (New): POST https://places.googleapis.com/v1/places:searchText
Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
"""
from __future__ import annotations

import asyncio
import re

import httpx
from loguru import logger
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from src.config import Settings
from src.validators.schemas import PlaceResult

_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
_FIELD_MASK = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.regularOpeningHours.weekdayDescriptions",
        "places.primaryTypeDisplayName",
        "places.types",
        "nextPageToken",
    ]
)


class PlacesAPIError(RuntimeError):
    pass


def _extract_neighborhood(address: str | None) -> str | None:
    """Heurística simples de bairro: '..., Bairro, São Paulo - SP, CEP'."""
    if not address:
        return None
    parts = [p.strip() for p in address.split(",")]
    for p in parts:
        if re.search(r"S[aã]o Paulo", p):
            idx = parts.index(p)
            if idx > 0:
                return parts[idx - 1]
    return parts[1] if len(parts) > 1 else None


def _to_result(place: dict) -> PlaceResult | None:
    pid = place.get("id")
    name = (place.get("displayName") or {}).get("text")
    if not pid or not name:
        return None
    addr = place.get("formattedAddress")
    hours = (place.get("regularOpeningHours") or {}).get("weekdayDescriptions")
    return PlaceResult(
        place_id=pid,
        name=name,
        category=(place.get("primaryTypeDisplayName") or {}).get("text"),
        address=addr,
        neighborhood=_extract_neighborhood(addr),
        phone=place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber"),
        website=place.get("websiteUri"),
        rating=place.get("rating"),
        reviews_count=place.get("userRatingCount"),
        opening_hours="\n".join(hours) if hours else None,
        types=place.get("types", []),
    )


class PlacesClient:
    """Cliente assíncrono com retry e rate limiting."""

    def __init__(self, settings: Settings):
        if not settings.google_places_api_key:
            raise PlacesAPIError("GOOGLE_PLACES_API_KEY não configurada (.env)")
        self._settings = settings
        self._sem = asyncio.Semaphore(max(1, int(settings.rate_limit_rps)))
        self._headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": settings.google_places_api_key,
            "X-Goog-FieldMask": _FIELD_MASK,
        }

    @retry(
        retry=retry_if_exception_type((httpx.TransportError, PlacesAPIError)),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(4),
        reraise=True,
    )
    async def _post(self, client: httpx.AsyncClient, body: dict) -> dict:
        async with self._sem:
            resp = await client.post(_SEARCH_URL, json=body, headers=self._headers)
        if resp.status_code == 429 or resp.status_code >= 500:
            raise PlacesAPIError(f"Places API {resp.status_code}: {resp.text[:200]}")
        if resp.status_code != 200:
            # 4xx (ex.: chave inválida) — não adianta repetir
            raise PlacesAPIError(f"Places API {resp.status_code}: {resp.text[:300]}")
        return resp.json()

    async def search(self, query: str) -> list[PlaceResult]:
        """Busca textual paginada. Places retorna até 60 (3 páginas de 20)."""
        s = self._settings
        body = {"textQuery": query, "languageCode": s.search_language, "regionCode": s.search_region_code}
        results: list[PlaceResult] = []
        seen: set[str] = set()

        async with httpx.AsyncClient(timeout=s.request_timeout) as client:
            while len(results) < s.max_results_per_query:
                data = await self._post(client, body)
                for place in data.get("places", []):
                    r = _to_result(place)
                    if r and r.place_id not in seen:
                        seen.add(r.place_id)
                        results.append(r)
                token = data.get("nextPageToken")
                if not token:
                    break
                # nextPageToken leva ~1-2s para ficar válido
                await asyncio.sleep(2)
                body = {"pageToken": token}

        logger.info("Query '{}' → {} empresas", query, len(results))
        return results
