"""Modelo de dados (SQLAlchemy 2.0). Inclui campos de compliance LGPD."""
from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Segment(str, enum.Enum):
    SALAO_BELEZA = "SALAO_BELEZA"
    CLINICA_ESTETICA = "CLINICA_ESTETICA"
    CLINICA_MEDICA = "CLINICA_MEDICA"
    ODONTOLOGIA = "ODONTOLOGIA"
    TERAPIAS = "TERAPIAS"
    IMOBILIARIA = "IMOBILIARIA"
    ESCOLA = "ESCOLA"
    PETSHOP = "PETSHOP"
    OUTROS = "OUTROS"


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # place_id do Google = chave natural para deduplicação
    place_id: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(512))
    category: Mapped[str | None] = mapped_column(String(255))  # tipo primário do Google
    segment: Mapped[Segment] = mapped_column(Enum(Segment), default=Segment.OUTROS, index=True)
    address: Mapped[str | None] = mapped_column(String(512))
    neighborhood: Mapped[str | None] = mapped_column(String(255), index=True)  # bairro
    phone: Mapped[str | None] = mapped_column(String(64))
    website: Mapped[str | None] = mapped_column(String(512))
    rating: Mapped[float | None] = mapped_column(Float)
    reviews_count: Mapped[int | None] = mapped_column(Integer)
    opening_hours: Mapped[str | None] = mapped_column(Text)

    lead_score: Mapped[int] = mapped_column(Integer, default=0, index=True)

    # --- LGPD / proveniência ---
    data_source: Mapped[str] = mapped_column(String(64), default="google_places")
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Status do enriquecimento (Fases 2-6): pending | done | failed
    enrich_status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    emails: Mapped[list["CompanyEmail"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    phones: Mapped[list["CompanyPhone"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    socials: Mapped[list["CompanySocial"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    contacts: Mapped[list["CompanyContact"]] = relationship(back_populates="company", cascade="all, delete-orphan")


class CompanyEmail(Base):
    __tablename__ = "company_emails"
    __table_args__ = (UniqueConstraint("company_id", "email", name="uq_company_email"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    email: Mapped[str] = mapped_column(String(320))
    source_page: Mapped[str | None] = mapped_column(String(512))

    company: Mapped[Company] = relationship(back_populates="emails")


class CompanyPhone(Base):
    __tablename__ = "company_phones"
    __table_args__ = (UniqueConstraint("company_id", "phone", name="uq_company_phone"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    phone: Mapped[str] = mapped_column(String(32))  # normalizado +5511999999999
    type: Mapped[str] = mapped_column(String(32), default="phone")  # whatsapp | mobile | landline

    company: Mapped[Company] = relationship(back_populates="phones")


class CompanySocial(Base):
    __tablename__ = "company_socials"
    __table_args__ = (UniqueConstraint("company_id", "url", name="uq_company_social"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    platform: Mapped[str] = mapped_column(String(32))  # instagram | facebook | linkedin | tiktok | youtube
    url: Mapped[str] = mapped_column(String(512))

    company: Mapped[Company] = relationship(back_populates="socials")


class CompanyContact(Base):
    """Decisores (dado pessoal). Coleta sob base legal registrada — LGPD."""

    __tablename__ = "company_contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str | None] = mapped_column(String(255))
    source_page: Mapped[str | None] = mapped_column(String(512))
    legal_basis: Mapped[str] = mapped_column(String(64), default="legitimo_interesse_art_7_IX")
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    company: Mapped[Company] = relationship(back_populates="contacts")


class DoNotContact(Base):
    """Lista de opt-out (art. 18 LGPD). Identificador = email, telefone ou domínio."""

    __tablename__ = "do_not_contact"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    identifier: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    reason: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
