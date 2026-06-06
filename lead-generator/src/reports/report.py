"""Fase 10 — relatório analítico de qualidade dos dados (HTML)."""
from __future__ import annotations

from pathlib import Path

from loguru import logger
from sqlalchemy import func

from src.database.models import (
    Company,
    CompanyEmail,
    CompanyPhone,
    CompanySocial,
)
from src.database.session import get_session


def _collect_metrics() -> dict:
    with get_session() as s:
        total = s.query(func.count(Company.id)).scalar() or 0
        emails = s.query(func.count(func.distinct(CompanyEmail.company_id))).scalar() or 0
        whats = (
            s.query(func.count(func.distinct(CompanyPhone.company_id)))
            .filter(CompanyPhone.type == "whatsapp").scalar() or 0
        )
        insta = (
            s.query(func.count(func.distinct(CompanySocial.company_id)))
            .filter(CompanySocial.platform == "instagram").scalar() or 0
        )
        linkedin = (
            s.query(func.count(func.distinct(CompanySocial.company_id)))
            .filter(CompanySocial.platform == "linkedin").scalar() or 0
        )
        by_neighborhood = (
            s.query(Company.neighborhood, func.count(Company.id))
            .filter(Company.neighborhood.isnot(None))
            .group_by(Company.neighborhood)
            .order_by(func.count(Company.id).desc()).limit(10).all()
        )
        by_segment = (
            s.query(Company.segment, func.count(Company.id))
            .group_by(Company.segment).order_by(func.count(Company.id).desc()).all()
        )
        avg_score = s.query(func.avg(Company.lead_score)).scalar() or 0

    enrichment_rate = round(100 * emails / total, 1) if total else 0.0
    return {
        "total": total, "emails": emails, "whats": whats, "insta": insta,
        "linkedin": linkedin, "avg_score": round(float(avg_score), 1),
        "enrichment_rate": enrichment_rate,
        "by_neighborhood": by_neighborhood,
        "by_segment": [(seg.value, n) for seg, n in by_segment],
    }


def _bars(rows: list[tuple[str, int]], total: int) -> str:
    out = []
    for label, n in rows:
        pct = round(100 * n / total, 1) if total else 0
        out.append(
            f'<div class="bar-row"><span class="bar-label">{label}</span>'
            f'<span class="bar"><span class="bar-fill" style="width:{pct}%"></span></span>'
            f'<span class="bar-val">{n}</span></div>'
        )
    return "\n".join(out)


def generate_report(path: str = "reports/report.html") -> str:
    m = _collect_metrics()
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    cards = [
        ("Empresas", m["total"]), ("Com e-mail", m["emails"]),
        ("Com WhatsApp", m["whats"]), ("Instagram", m["insta"]),
        ("LinkedIn", m["linkedin"]), ("Score médio", m["avg_score"]),
    ]
    cards_html = "".join(
        f'<div class="card"><div class="card-val">{v}</div><div class="card-lbl">{k}</div></div>'
        for k, v in cards
    )
    html = f"""<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Lead Generator — Relatório de Qualidade</title>
<style>
  :root{{--terra:#D9613A;--cafe:#241B15;--creme:#FBF3E7;--salvia:#4E9E78}}
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:system-ui,-apple-system,sans-serif;background:var(--creme);color:var(--cafe);padding:40px 24px;line-height:1.5}}
  .wrap{{max-width:920px;margin:0 auto}}
  h1{{font-size:1.7rem;margin-bottom:4px}}
  .sub{{color:#897866;margin-bottom:28px}}
  .cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;margin-bottom:36px}}
  .card{{background:#fff;border-radius:14px;padding:20px;box-shadow:0 8px 24px -16px rgba(36,27,21,.3)}}
  .card-val{{font-size:2rem;font-weight:800;color:var(--terra)}}
  .card-lbl{{font-size:.85rem;color:#897866;margin-top:2px}}
  h2{{font-size:1.1rem;margin:28px 0 12px}}
  .bar-row{{display:flex;align-items:center;gap:12px;margin-bottom:8px}}
  .bar-label{{width:150px;font-size:.9rem;text-align:right;color:#6B5D4F}}
  .bar{{flex:1;background:#E8DFD0;border-radius:999px;height:14px;overflow:hidden}}
  .bar-fill{{display:block;height:100%;background:linear-gradient(90deg,var(--terra),#F2A93C);border-radius:999px}}
  .bar-val{{width:44px;font-weight:700;font-size:.9rem}}
  .rate{{display:inline-block;background:var(--salvia);color:#fff;padding:4px 12px;border-radius:999px;font-weight:700}}
  footer{{margin-top:40px;font-size:.8rem;color:#897866}}
</style></head>
<body><div class="wrap">
  <h1>Relatório de Qualidade dos Leads</h1>
  <p class="sub">Taxa de enriquecimento (empresas com e-mail): <span class="rate">{m['enrichment_rate']}%</span></p>
  <div class="cards">{cards_html}</div>
  <h2>Top bairros</h2>
  {_bars(m['by_neighborhood'], m['total'])}
  <h2>Por segmento</h2>
  {_bars(m['by_segment'], m['total'])}
  <footer>Lead Generator · dados públicos · uso sob legítimo interesse (LGPD art. 7º, IX) · alimenta a Lena (lena.ia.br)</footer>
</div></body></html>"""
    out.write_text(html, encoding="utf-8")
    logger.info("Relatório gerado em {}", path)
    return str(out)
