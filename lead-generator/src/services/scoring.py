"""Fase 8 — score de qualidade do lead (0-100)."""
from __future__ import annotations

from src.database.models import Company

WEIGHTS = {
    "website": 20,
    "email": 20,
    "whatsapp": 20,
    "instagram": 10,
    "linkedin": 10,
    "decisor": 20,
}


def compute_score(company: Company) -> int:
    score = 0
    if company.website:
        score += WEIGHTS["website"]
    if company.emails:
        score += WEIGHTS["email"]
    if any(p.type == "whatsapp" for p in company.phones):
        score += WEIGHTS["whatsapp"]
    platforms = {s.platform for s in company.socials}
    if "instagram" in platforms:
        score += WEIGHTS["instagram"]
    if "linkedin" in platforms:
        score += WEIGHTS["linkedin"]
    if company.contacts:
        score += WEIGHTS["decisor"]
    return min(score, 100)
