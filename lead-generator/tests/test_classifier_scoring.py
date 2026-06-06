from types import SimpleNamespace

from src.database.models import Segment
from src.services.classifier import classify_segment
from src.services.scoring import compute_score


def test_classify_by_google_type():
    assert classify_segment("X", None, ["beauty_salon"]) == Segment.SALAO_BELEZA
    assert classify_segment("X", None, ["primary_school"]) == Segment.ESCOLA


def test_classify_by_keywords():
    assert classify_segment("Clínica Estética Bella", "spa", []) == Segment.CLINICA_ESTETICA
    assert classify_segment("Salão da Maria", "cabeleireiro", []) == Segment.SALAO_BELEZA
    assert classify_segment("Colégio Vértice", "escola", []) == Segment.ESCOLA
    assert classify_segment("Padaria do João", "padaria", []) == Segment.OUTROS


def test_classify_novos_segmentos():
    assert classify_segment("Consultório Odontológico Sorria", "dentista", []) == Segment.ODONTOLOGIA
    assert classify_segment("Clínica Odontológica Dental Care", "", []) == Segment.ODONTOLOGIA
    assert classify_segment("Espaço Terapias Integrativas", "psicologia", []) == Segment.TERAPIAS
    assert classify_segment("Imobiliária Lar Feliz", "imóveis", []) == Segment.IMOBILIARIA
    # odontológica não deve cair em estética mesmo contendo "clínica"
    assert classify_segment("Clínica Odonto Bella", "", []) != Segment.CLINICA_ESTETICA


def test_classify_petshop():
    assert classify_segment("Pet Center Amigo", "petshop", []) == Segment.PETSHOP
    assert classify_segment("Mundo Animal Banho e Tosa", "", []) == Segment.PETSHOP
    # "clínica veterinária" tem "clínica" mas deve cair em PETSHOP, não CLINICA_ESTETICA
    assert classify_segment("Clínica Veterinária Bichos", "veterinária", []) == Segment.PETSHOP
    assert classify_segment("Rede Pet", None, ["veterinary_care"]) == Segment.PETSHOP


def _company(**kw):
    base = dict(website=None, emails=[], phones=[], socials=[], contacts=[])
    base.update(kw)
    return SimpleNamespace(**base)


def test_score_full():
    c = _company(
        website="http://x.com",
        emails=[SimpleNamespace(email="a@x.com")],
        phones=[SimpleNamespace(type="whatsapp", phone="+5511999999999")],
        socials=[SimpleNamespace(platform="instagram", url="i"), SimpleNamespace(platform="linkedin", url="l")],
        contacts=[SimpleNamespace(name="Ana", role="Sócia")],
    )
    assert compute_score(c) == 100


def test_score_partial():
    c = _company(website="http://x.com", emails=[SimpleNamespace(email="a@x.com")])
    assert compute_score(c) == 40  # 20 + 20
