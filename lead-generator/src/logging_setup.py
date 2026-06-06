"""Logs estruturados com Loguru."""
from __future__ import annotations

import sys
from pathlib import Path

from loguru import logger

_CONFIGURED = False


def setup_logging(level: str = "INFO") -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return
    logger.remove()
    logger.add(
        sys.stderr,
        level=level,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    )
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    logger.add(
        log_dir / "leadgen_{time:YYYY-MM-DD}.log",
        level="DEBUG",
        rotation="10 MB",
        retention="14 days",
        serialize=True,  # JSON estruturado em arquivo
        enqueue=True,
    )
    _CONFIGURED = True
