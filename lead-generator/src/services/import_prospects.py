"""Importa listas de prospecção manuais (CSV) para a base.

Para leads coletados à mão (sem place_id do Google). Dedup por nome (case-insensitive).
Reusa normalização de telefone e score já existentes.
"""
from __future__ import annotations

import csv
from pathlib import Path

from loguru import logger

from src.database.models import (
    Company,
    CompanyEmail,
    CompanyPhone,
    CompanySocial,
    Segment,
)

# Colunas de rede social aceitas no CSV (= plataformas do modelo)
SOCIAL_COLUMNS = ("instagram", "facebook", "linkedin", "tiktok", "youtube")
from src.database.session import get_session
from src.extractors.contacts import normalize_phone_br
from src.services.scoring import compute_score

_SPLIT = "|"


def _split(value: str) -> list[str]:
    return [p.strip() for p in (value or "").split(_SPLIT) if p.strip()]


def _segment(value: str) -> Segment:
    try:
        return Segment(value.strip().upper())
    except (ValueError, AttributeError):
        return Segment.CLINICA_ESTETICA


def import_csv(path: str) -> dict[str, int]:
    csv_path = Path(path)
    if not csv_path.exists():
        raise FileNotFoundError(path)

    stats = {"rows": 0, "new": 0, "updated": 0, "emails": 0, "phones": 0, "socials": 0}
    with get_session() as s, csv_path.open(encoding="utf-8") as f:
        # índice de nomes existentes p/ dedup
        existing = {c.name.lower(): c for c in s.query(Company).all()}

        for row in csv.DictReader(f):
            name = (row.get("nome") or "").strip()
            if not name:
                continue
            stats["rows"] += 1

            company = existing.get(name.lower())
            if company is None:
                company = Company(name=name, place_id=None, data_source="manual_prospecting")
                s.add(company)
                existing[name.lower()] = company
                stats["new"] += 1
            else:
                stats["updated"] += 1

            company.segment = _segment(row.get("segmento", ""))
            bairros = _split(row.get("bairros", ""))
            if bairros:
                company.neighborhood = bairros[0]
            company.data_source = "manual_prospecting"

            website = (row.get("website") or "").strip()
            if website:
                company.website = website

            current_phones = {p.phone for p in company.phones}
            current_emails = {e.email for e in company.emails}

            # telefones fixos
            for raw in _split(row.get("telefones", "")):
                norm = normalize_phone_br(raw)
                if norm and norm not in current_phones:
                    company.phones.append(CompanyPhone(phone=norm, type="phone"))
                    current_phones.add(norm)
                    stats["phones"] += 1

            # whatsapp
            for raw in _split(row.get("whatsapps", "")):
                norm = normalize_phone_br(raw)
                if norm and norm not in current_phones:
                    company.phones.append(CompanyPhone(phone=norm, type="whatsapp"))
                    current_phones.add(norm)
                    stats["phones"] += 1

            # telefone "principal" para a coluna direta
            if not company.phone and company.phones:
                company.phone = company.phones[0].phone

            for email in _split(row.get("emails", "")):
                email = email.lower()
                if email not in current_emails:
                    company.emails.append(CompanyEmail(email=email, source_page=row.get("fonte", "")))
                    current_emails.add(email)
                    stats["emails"] += 1

            # redes sociais (uma coluna por plataforma; aceita múltiplas URLs por " | ")
            current_socials = {so.url for so in company.socials}
            for platform in SOCIAL_COLUMNS:
                for url in _split(row.get(platform, "")):
                    if url not in current_socials:
                        company.socials.append(CompanySocial(platform=platform, url=url))
                        current_socials.add(url)
                        stats["socials"] += 1

            company.lead_score = compute_score(company)
            # Com website → deixa 'pending' para o crawler (enrich) visitar e extrair mais dados.
            # Sem website → não há o que crawlear, marca como 'done'.
            # Não rebaixa quem já foi enriquecido ('done' permanece 'done').
            if not company.website:
                company.enrich_status = "done"
            elif company.enrich_status not in ("done", "failed"):
                company.enrich_status = "pending"

    logger.info("Import de prospects concluído: {}", stats)
    return stats
