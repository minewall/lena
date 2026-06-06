"""Fases 3-5 — extração de e-mails, telefones/WhatsApp e redes sociais do HTML.

Princípio LGPD/qualidade: SÓ extraímos o que aparece no site. Nunca adivinhamos
(ex.: 'comercial@dominio') — e-mail gerado é spam e polui a base.
"""
from __future__ import annotations

import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from src.validators.schemas import ExtractedContacts

# --- E-mail ---
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
# e-mails de imagem/asset que não interessam
_EMAIL_BLOCKLIST = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", "@example.", "@sentry.", "@2x.")

# --- Telefone BR ---
# Aceita formatos com/sem DDI, com pontuação. Captura DDD + 8/9 dígitos.
_PHONE_RE = re.compile(r"(?:\+?55\s*)?\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}")

# --- Redes sociais ---
_SOCIAL_PATTERNS = {
    "instagram": re.compile(r"https?://(?:www\.)?instagram\.com/[^\s\"'<>?]+", re.I),
    "facebook": re.compile(r"https?://(?:www\.)?facebook\.com/[^\s\"'<>?]+", re.I),
    "linkedin": re.compile(r"https?://(?:[\w-]+\.)?linkedin\.com/[^\s\"'<>?]+", re.I),
    "tiktok": re.compile(r"https?://(?:www\.)?tiktok\.com/@[^\s\"'<>?]+", re.I),
    "youtube": re.compile(r"https?://(?:www\.)?youtube\.com/[^\s\"'<>?]+", re.I),
}
_WHATSAPP_RE = re.compile(r"https?://(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)/[^\s\"'<>]+", re.I)


def extract_emails(html: str) -> list[str]:
    found = {m.group(0).lower() for m in _EMAIL_RE.finditer(html)}
    clean = [e for e in found if not any(b in e for b in _EMAIL_BLOCKLIST)]
    return sorted(clean)


def normalize_phone_br(raw: str) -> str | None:
    """Normaliza para +5511999999999. Retorna None se não for telefone BR plausível."""
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("55"):
        digits = digits[2:]
    # esperado: DDD (2) + número (8 ou 9 dígitos)
    if len(digits) not in (10, 11):
        return None
    ddd = digits[:2]
    if not (11 <= int(ddd) <= 99):
        return None
    return f"+55{digits}"


def extract_phones(html: str) -> list[str]:
    out: set[str] = set()
    for m in _PHONE_RE.finditer(html):
        norm = normalize_phone_br(m.group(0))
        if norm:
            out.add(norm)
    return sorted(out)


def extract_socials(html: str) -> dict[str, str]:
    socials: dict[str, str] = {}
    for platform, pat in _SOCIAL_PATTERNS.items():
        m = pat.search(html)
        if m:
            socials[platform] = m.group(0).rstrip("/")
    return socials


def has_whatsapp(html: str, phones: list[str]) -> str | None:
    """Retorna a URL/telefone de WhatsApp, se houver."""
    m = _WHATSAPP_RE.search(html)
    if m:
        return m.group(0)
    if re.search(r"whats\s?app", html, re.I) and phones:
        return phones[0]
    return None


def extract_all(html: str) -> ExtractedContacts:
    emails = extract_emails(html)
    phones = extract_phones(html)
    socials = extract_socials(html)
    return ExtractedContacts(emails=emails, phones=phones, socials=socials)


# --- Descoberta de páginas relevantes (Fase 2) ---
_RELEVANT_HINTS = ("contato", "fale-conosco", "fale_conosco", "contact", "sobre",
                   "about", "equipe", "team", "diretoria", "quem-somos", "quem_somos")


def find_relevant_links(html: str, base_url: str) -> list[str]:
    """Encontra links para páginas de contato/sobre/equipe a partir da home."""
    soup = BeautifulSoup(html, "lxml")
    base = urlparse(base_url)
    out: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        low = href.lower()
        if any(h in low for h in _RELEVANT_HINTS):
            if href.startswith("http"):
                out.add(href)
            elif href.startswith("/"):
                out.add(f"{base.scheme}://{base.netloc}{href}")
    return sorted(out)[:8]
