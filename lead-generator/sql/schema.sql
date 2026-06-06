-- Lead Generator — schema PostgreSQL (referência).
-- Em produção as tabelas são criadas pelo SQLAlchemy: `python -m src.cli init-db`.
-- Este arquivo serve para revisão/criação manual.

CREATE TYPE segment AS ENUM ('SALAO_BELEZA', 'CLINICA_ESTETICA', 'CLINICA_MEDICA', 'ODONTOLOGIA', 'TERAPIAS', 'IMOBILIARIA', 'ESCOLA', 'PETSHOP', 'OUTROS');

CREATE TABLE IF NOT EXISTS companies (
    id              SERIAL PRIMARY KEY,
    place_id        VARCHAR(255) UNIQUE,
    name            VARCHAR(512) NOT NULL,
    category        VARCHAR(255),
    segment         segment NOT NULL DEFAULT 'OUTROS',
    address         VARCHAR(512),
    neighborhood    VARCHAR(255),
    phone           VARCHAR(64),
    website         VARCHAR(512),
    rating          DOUBLE PRECISION,
    reviews_count   INTEGER,
    opening_hours   TEXT,
    lead_score      INTEGER NOT NULL DEFAULT 0,
    data_source     VARCHAR(64) NOT NULL DEFAULT 'google_places',
    collected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    enrich_status   VARCHAR(16) NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_companies_segment ON companies (segment);
CREATE INDEX IF NOT EXISTS ix_companies_neighborhood ON companies (neighborhood);
CREATE INDEX IF NOT EXISTS ix_companies_lead_score ON companies (lead_score);
CREATE INDEX IF NOT EXISTS ix_companies_enrich_status ON companies (enrich_status);

CREATE TABLE IF NOT EXISTS company_emails (
    id          SERIAL PRIMARY KEY,
    company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email       VARCHAR(320) NOT NULL,
    source_page VARCHAR(512),
    CONSTRAINT uq_company_email UNIQUE (company_id, email)
);

CREATE TABLE IF NOT EXISTS company_phones (
    id          SERIAL PRIMARY KEY,
    company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    phone       VARCHAR(32) NOT NULL,
    type        VARCHAR(32) NOT NULL DEFAULT 'phone',
    CONSTRAINT uq_company_phone UNIQUE (company_id, phone)
);

CREATE TABLE IF NOT EXISTS company_socials (
    id          SERIAL PRIMARY KEY,
    company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    platform    VARCHAR(32) NOT NULL,
    url         VARCHAR(512) NOT NULL,
    CONSTRAINT uq_company_social UNIQUE (company_id, url)
);

-- Decisores (dado pessoal) — coletado sob base legal registrada (LGPD)
CREATE TABLE IF NOT EXISTS company_contacts (
    id           SERIAL PRIMARY KEY,
    company_id   INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    role         VARCHAR(255),
    source_page  VARCHAR(512),
    legal_basis  VARCHAR(64) NOT NULL DEFAULT 'legitimo_interesse_art_7_IX',
    collected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Opt-out (LGPD art. 18) — identifier = e-mail, telefone ou domínio
CREATE TABLE IF NOT EXISTS do_not_contact (
    id          SERIAL PRIMARY KEY,
    identifier  VARCHAR(320) UNIQUE NOT NULL,
    reason      VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
