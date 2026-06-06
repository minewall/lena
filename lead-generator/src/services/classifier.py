"""Fase 7 — classificação de segmento a partir de tipos do Google + conteúdo."""
from __future__ import annotations

from src.database.models import Segment

_SALAO_KW = ("salão", "salao", "beauty", "cabelo", "barbearia", "barber", "manicure", "hair")
_CLINICA_KW = ("estética", "estetica", "clínica", "clinica", "botox", "dermato",
               "harmonização", "harmonizacao", "spa", "skin")
_ESCOLA_KW = ("escola", "colégio", "colegio", "ensino", "educação", "educacao",
              "school", "curso", "creche", "berçário", "bercario")
_PETSHOP_KW = ("petshop", "pet shop", "pet center", "agropet", "banho e tosa", "tosa",
               "veterinár", "veterinari", "clínica vet", "clinica vet", "pet care")
_MEDICA_KW = ("clínica médica", "clinica medica", "médica", "consultório médico",
              "medicina do trabalho", "cardiolog", "ortoped", "pediatr", "ginecolog",
              "otorrino", "neurolog", "endocrinolog", "cirurgia", "cirurgião")
_ODONTO_KW = ("odonto", "dentista", "dental", "ortodont", "implantodont", "endodont",
              "consultório odonto")
_TERAPIAS_KW = ("terapia", "terapeuta", "psicolog", "psicoterap", "psicanál", "fisioterap",
                "nutricion", "acupuntura", "massoterap", "pilates", "fonoaudiolog",
                "reabilita")
_IMOB_KW = ("imobiliár", "imobiliaria", "imóveis", "imoveis", "corretor de imó", "creci",
            "real estate")

_GOOGLE_TYPE_MAP = {
    "beauty_salon": Segment.SALAO_BELEZA,
    "hair_salon": Segment.SALAO_BELEZA,
    "hair_care": Segment.SALAO_BELEZA,
    "spa": Segment.CLINICA_ESTETICA,
    "school": Segment.ESCOLA,
    "primary_school": Segment.ESCOLA,
    "secondary_school": Segment.ESCOLA,
    "preschool": Segment.ESCOLA,
    "pet_store": Segment.PETSHOP,
    "veterinary_care": Segment.PETSHOP,
    "doctor": Segment.CLINICA_MEDICA,
    "hospital": Segment.CLINICA_MEDICA,
    "medical_clinic": Segment.CLINICA_MEDICA,
    "dentist": Segment.ODONTOLOGIA,
    "dental_clinic": Segment.ODONTOLOGIA,
    "real_estate_agency": Segment.IMOBILIARIA,
    "physiotherapist": Segment.TERAPIAS,
    "psychologist": Segment.TERAPIAS,
}


def _match(text: str, keywords: tuple[str, ...]) -> bool:
    return any(k in text for k in keywords)


def classify_segment(name: str, category: str | None, types: list[str], site_text: str = "") -> Segment:
    # 1) tipos estruturados do Google têm prioridade
    for t in types:
        if t in _GOOGLE_TYPE_MAP:
            return _GOOGLE_TYPE_MAP[t]

    # 2) palavras-chave em nome + categoria + texto do site
    blob = " ".join([name or "", category or "", site_text or ""]).lower()
    # Verticais específicos antes de estética: "clínica veterinária/médica/odontológica"
    # contêm "clínica" mas não são estética. Ordem importa.
    if _match(blob, _PETSHOP_KW):
        return Segment.PETSHOP
    if _match(blob, _ODONTO_KW):
        return Segment.ODONTOLOGIA
    if _match(blob, _TERAPIAS_KW):
        return Segment.TERAPIAS
    if _match(blob, _IMOB_KW):
        return Segment.IMOBILIARIA
    if _match(blob, _MEDICA_KW):
        return Segment.CLINICA_MEDICA
    if _match(blob, _CLINICA_KW):
        return Segment.CLINICA_ESTETICA
    if _match(blob, _SALAO_KW):
        return Segment.SALAO_BELEZA
    if _match(blob, _ESCOLA_KW):
        return Segment.ESCOLA
    return Segment.OUTROS
