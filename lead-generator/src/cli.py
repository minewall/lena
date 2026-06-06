"""CLI do Lead Generator (Typer).

Exemplos:
    python -m src.cli init-db
    python -m src.cli search --segment all
    python -m src.cli enrich --limit 50
    python -m src.cli export --min-score 40
    python -m src.cli report
    python -m src.cli optout adicionar contato@exemplo.com
"""
from __future__ import annotations

import asyncio

import typer
from loguru import logger

from src.logging_setup import setup_logging

app = typer.Typer(add_completion=False, help="Gerador de leads B2B (salões, clínicas, escolas — SP).")


@app.callback()
def _main() -> None:
    setup_logging()


@app.command("init-db")
def init_db_cmd() -> None:
    """Cria as tabelas no PostgreSQL."""
    from src.database.session import init_db

    init_db()
    typer.secho("✅ Banco inicializado.", fg=typer.colors.GREEN)


@app.command()
def search(segment: str = typer.Option("all", help="all | salao | clinica | escola")) -> None:
    """Fase 1 — busca empresas no Google Places e persiste (dedup)."""
    from src.services.ingest import run_search

    stats = asyncio.run(run_search(segment))
    typer.secho(f"✅ {stats}", fg=typer.colors.GREEN)


@app.command()
def enrich(limit: int = typer.Option(0, help="0 = todas as pendentes")) -> None:
    """Fases 2-6 — visita sites, extrai contatos/redes e recalcula score."""
    from src.services.enrich import run_enrich

    stats = asyncio.run(run_enrich(limit or None))
    typer.secho(f"✅ {stats}", fg=typer.colors.GREEN)


@app.command()
def export(
    path: str = typer.Option("exports/leads.csv"),
    min_score: int = typer.Option(0, "--min-score"),
) -> None:
    """Fase 9 — exporta CSV."""
    from src.exports.csv_export import export_csv

    n = export_csv(path, min_score)
    typer.secho(f"✅ {n} leads exportados para {path}", fg=typer.colors.GREEN)


@app.command()
def report(path: str = typer.Option("reports/report.html")) -> None:
    """Fase 10 — relatório HTML de qualidade."""
    from src.reports.report import generate_report

    out = generate_report(path)
    typer.secho(f"✅ Relatório em {out}", fg=typer.colors.GREEN)


@app.command()
def optout(
    action: str = typer.Argument(..., help="adicionar | remover"),
    identifier: str = typer.Argument(..., help="e-mail, telefone ou domínio"),
) -> None:
    """LGPD — gerencia a lista de não-contatar (opt-out)."""
    from src.database.models import DoNotContact
    from src.database.session import get_session

    with get_session() as s:
        if action == "adicionar":
            if not s.query(DoNotContact).filter_by(identifier=identifier).first():
                s.add(DoNotContact(identifier=identifier, reason="solicitação do titular"))
            typer.secho(f"✅ {identifier} adicionado ao opt-out.", fg=typer.colors.GREEN)
        elif action == "remover":
            s.query(DoNotContact).filter_by(identifier=identifier).delete()
            typer.secho(f"✅ {identifier} removido do opt-out.", fg=typer.colors.GREEN)
        else:
            typer.secho("Ação inválida (use: adicionar | remover)", fg=typer.colors.RED)


@app.command("import-prospects")
def import_prospects_cmd(
    path: str = typer.Argument("data/prospects_clinicas_sp.csv", help="CSV de prospecção manual"),
) -> None:
    """Importa uma lista de prospecção manual (CSV) para a base (dedup por nome)."""
    from src.services.import_prospects import import_csv

    stats = import_csv(path)
    typer.secho(f"✅ {stats}", fg=typer.colors.GREEN)


@app.command()
def pipeline(segment: str = typer.Option("all"), limit: int = typer.Option(0)) -> None:
    """Roda tudo em sequência: search → enrich → export → report."""
    from src.exports.csv_export import export_csv
    from src.reports.report import generate_report
    from src.services.enrich import run_enrich
    from src.services.ingest import run_search

    logger.info("== Pipeline completo ==")
    asyncio.run(run_search(segment))
    asyncio.run(run_enrich(limit or None))
    export_csv()
    generate_report()
    typer.secho("✅ Pipeline concluído.", fg=typer.colors.GREEN)


if __name__ == "__main__":
    app()
