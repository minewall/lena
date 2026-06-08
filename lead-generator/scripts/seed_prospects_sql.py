#!/usr/bin/env python3
"""Lê os CSVs do lead-generator e gera SQL de INSERT em public.prospects (Supabase).
Normaliza telefones para dígitos com prefixo 55 e quebra campos multivalor em arrays."""
import csv, re, sys, glob, os

SEG = {
    "CLINICA_ESTETICA": "Clínica Estética",
    "CLINICA_MEDICA":   "Clínica Médica",
    "ESCOLA":           "Escola",
    "ODONTOLOGIA":      "Odontologia",
    "PETSHOP":          "Petshop",
    "SALAO_BELEZA":     "Salão",
    "TERAPIAS":         "Terapias",
}

def norm_phone(s):
    d = re.sub(r"\D", "", s or "")
    if not d:
        return None
    if d.startswith("55") and len(d) in (12, 13):
        return d
    if len(d) in (10, 11):
        return "55" + d
    return d  # melhor esforço (fixos curtos / fora do padrão)

def split_multi(s):
    return [p.strip() for p in (s or "").split("|") if p.strip()]

def phones(s):
    out, seen = [], set()
    for p in split_multi(s):
        n = norm_phone(p)
        if n and n not in seen:
            seen.add(n); out.append(n)
    return out

def emails(s):
    out, seen = [], set()
    for part in re.split(r"[|,;\s]+", s or ""):
        e = part.strip().lower()
        if "@" in e and e not in seen:
            seen.add(e); out.append(e)
    return out

def q(v):
    if v is None or v == "":
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"

def arr(items):
    if not items:
        return "ARRAY[]::text[]"
    return "ARRAY[" + ",".join(q(x) for x in items) + "]::text[]"

cols = ("nome","segmento","bairros","telefones","whatsapps","emails","website",
        "instagram","facebook","linkedin","tiktok","fonte","coletado_em","observacao")
rows = []
data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
for f in sorted(glob.glob(os.path.join(data_dir, "prospects_*.csv"))):
    with open(f, newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            seg = SEG.get((r.get("segmento") or "").strip(), (r.get("segmento") or "").strip())
            vals = [
                q(r["nome"].strip()),
                q(seg),
                q((r.get("bairros") or "").strip() or None),
                arr(phones(r.get("telefones"))),
                arr(phones(r.get("whatsapps"))),
                arr(emails(r.get("emails"))),
                q((r.get("website") or "").strip() or None),
                q((r.get("instagram") or "").strip() or None),
                q((r.get("facebook") or "").strip() or None),
                q((r.get("linkedin") or "").strip() or None),
                q((r.get("tiktok") or "").strip() or None),
                q((r.get("fonte") or "").strip() or None),
                q((r.get("coletado_em") or "").strip() or None),
                q((r.get("observacao") or "").strip() or None),
            ]
            rows.append("(" + ",".join(vals) + ")")

sql = (f"insert into public.prospects ({','.join(cols)}) values\n"
       + ",\n".join(rows) + ";\n")
out = os.path.join(os.path.dirname(__file__), "..", "data", "_prospects_seed.sql")
with open(out, "w", encoding="utf-8") as fh:
    fh.write(sql)
print(f"rows={len(rows)} bytes={len(sql)} -> {out}")
