"""Fases 2-6 + 8 — para cada empresa com site: crawl → extrai contatos → score.

Decisores (Fase 6) só rodam se LLM_PROVIDER estiver configurado (opcional).
"""
from __future__ import annotations

from loguru import logger

from src.config import get_settings
from src.crawler.website import crawl_site
from src.database.models import (
    Company,
    CompanyContact,
    CompanyEmail,
    CompanyPhone,
    CompanySocial,
)
from src.database.session import get_session
from src.extractors.contacts import extract_all, has_whatsapp
from src.services.scoring import compute_score


def _is_opted_out(session, identifiers: list[str]) -> bool:
    from src.database.models import DoNotContact

    rows = session.query(DoNotContact.identifier).all()
    blocked = {r[0] for r in rows}
    return any(i in blocked for i in identifiers)


async def enrich_company(company_id: int) -> bool:
    settings = get_settings()
    with get_session() as s:
        company = s.get(Company, company_id)
        if not company or not company.website:
            if company:
                company.enrich_status = "done"
            return False
        website = company.website

    pages = await crawl_site(website)
    combined = "\n".join(pages.values())
    contacts = extract_all(combined)
    wa = has_whatsapp(combined, contacts.phones)

    with get_session() as s:
        company = s.get(Company, company_id)
        domain = website.split("/")[2] if "://" in website else website

        # Respeita opt-out (LGPD art. 18)
        if _is_opted_out(s, [domain, *contacts.emails, *contacts.phones]):
            logger.info("Empresa {} em opt-out — não enriquecida", company_id)
            company.enrich_status = "done"
            return False

        existing_emails = {e.email for e in company.emails}
        for email in contacts.emails:
            if email not in existing_emails:
                company.emails.append(CompanyEmail(email=email, source_page=website))

        existing_phones = {p.phone for p in company.phones}
        for phone in contacts.phones:
            if phone not in existing_phones:
                ptype = "whatsapp" if wa and (phone in wa or phone == wa) else "phone"
                company.phones.append(CompanyPhone(phone=phone, type=ptype))
        if wa and wa.startswith("http") and not any(p.type == "whatsapp" for p in company.phones):
            # WhatsApp via link wa.me sem telefone textual
            company.phones.append(CompanyPhone(phone=wa[:32], type="whatsapp"))

        existing_socials = {so.url for so in company.socials}
        for platform, url in contacts.socials.items():
            if url not in existing_socials:
                company.socials.append(CompanySocial(platform=platform, url=url))

        company.lead_score = compute_score(company)
        company.enrich_status = "done"
    logger.info("Empresa {} enriquecida (score recalculado)", company_id)
    return True


async def run_enrich(limit: int | None = None) -> dict[str, int]:
    with get_session() as s:
        q = s.query(Company.id).filter(
            Company.enrich_status == "pending", Company.website.isnot(None)
        )
        if limit:
            q = q.limit(limit)
        ids = [row[0] for row in q.all()]

    ok = 0
    for cid in ids:
        try:
            if await enrich_company(cid):
                ok += 1
        except Exception as e:  # noqa: BLE001
            logger.error("Falha ao enriquecer {}: {}", cid, e)
            with get_session() as s:
                c = s.get(Company, cid)
                if c:
                    c.enrich_status = "failed"
    stats = {"processed": len(ids), "enriched": ok}
    logger.info("Enrich concluído: {}", stats)
    return stats
