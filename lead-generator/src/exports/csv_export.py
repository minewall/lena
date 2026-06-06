"""Fase 9 — exportação para CSV."""
from __future__ import annotations

import csv
from pathlib import Path

from loguru import logger

from src.database.models import Company
from src.database.session import get_session

_COLUMNS = [
    "nome", "segmento", "categoria", "bairro", "telefone", "email",
    "website", "instagram", "linkedin", "whatsapp", "responsavel", "cargo", "score",
]


def export_csv(path: str = "exports/leads.csv", min_score: int = 0) -> int:
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    rows = 0
    with get_session() as s, out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=_COLUMNS)
        writer.writeheader()
        companies = (
            s.query(Company).filter(Company.lead_score >= min_score)
            .order_by(Company.lead_score.desc()).all()
        )
        for c in companies:
            socials = {so.platform: so.url for so in c.socials}
            wa = next((p.phone for p in c.phones if p.type == "whatsapp"), "")
            contact = c.contacts[0] if c.contacts else None
            writer.writerow({
                "nome": c.name,
                "segmento": c.segment.value,
                "categoria": c.category or "",
                "bairro": c.neighborhood or "",
                "telefone": c.phone or "",
                "email": c.emails[0].email if c.emails else "",
                "website": c.website or "",
                "instagram": socials.get("instagram", ""),
                "linkedin": socials.get("linkedin", ""),
                "whatsapp": wa,
                "responsavel": contact.name if contact else "",
                "cargo": contact.role if contact and contact.role else "",
                "score": c.lead_score,
            })
            rows += 1
    logger.info("Exportadas {} linhas para {}", rows, path)
    return rows
