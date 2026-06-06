"""Fase 2 — crawler de website com Playwright.

Boas práticas embutidas: respeita robots.txt, timeout, user-agent honesto,
rate limit por execução e persistência do HTML bruto em /data/raw.
"""
from __future__ import annotations

import asyncio
import hashlib
import urllib.robotparser as robotparser
from pathlib import Path
from urllib.parse import urlparse

from loguru import logger
from playwright.async_api import async_playwright

from src.extractors.contacts import find_relevant_links

_UA = "LenaLeadBot/0.5 (+https://lena.ia.br; prospecção B2B; contato@lena.ia.br)"
_RAW_DIR = Path("data/raw")


def _robots_allowed(url: str) -> bool:
    try:
        p = urlparse(url)
        rp = robotparser.RobotFileParser()
        rp.set_url(f"{p.scheme}://{p.netloc}/robots.txt")
        rp.read()
        return rp.can_fetch(_UA, url)
    except Exception:
        # Sem robots acessível → assume permitido (página pública)
        return True


def _persist_html(url: str, html: str) -> str:
    _RAW_DIR.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha1(url.encode()).hexdigest()[:16]
    path = _RAW_DIR / f"{key}.html"
    path.write_text(html, encoding="utf-8")
    return str(path)


async def crawl_site(base_url: str, max_pages: int = 5) -> dict[str, str]:
    """Visita a home + páginas relevantes (contato/sobre/equipe). Retorna {url: html}."""
    if not base_url:
        return {}
    if not _robots_allowed(base_url):
        logger.warning("robots.txt bloqueia {} — pulando", base_url)
        return {}

    pages: dict[str, str] = {}
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=_UA, locale="pt-BR")
        page = await context.new_page()
        try:
            await page.goto(base_url, timeout=20000, wait_until="domcontentloaded")
            home_html = await page.content()
            pages[base_url] = home_html
            _persist_html(base_url, home_html)

            for link in find_relevant_links(home_html, base_url):
                if len(pages) >= max_pages:
                    break
                if link in pages or not _robots_allowed(link):
                    continue
                try:
                    await page.goto(link, timeout=15000, wait_until="domcontentloaded")
                    html = await page.content()
                    pages[link] = html
                    _persist_html(link, html)
                    await asyncio.sleep(1)  # politeness
                except Exception as e:
                    logger.debug("Falha ao visitar {}: {}", link, e)
        except Exception as e:
            logger.warning("Falha ao acessar {}: {}", base_url, e)
        finally:
            await browser.close()

    logger.info("Crawl {} → {} páginas", base_url, len(pages))
    return pages
