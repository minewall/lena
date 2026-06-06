from src.extractors.contacts import (
    extract_emails,
    extract_phones,
    extract_socials,
    has_whatsapp,
    normalize_phone_br,
)


def test_extract_emails_dedup_and_blocklist():
    html = """
        <a href="mailto:Contato@Clinica.com.br">e-mail</a>
        comercial@clinica.com.br também contato@clinica.com.br
        <img src="logo@2x.png"> sprite@example.com
    """
    emails = extract_emails(html)
    assert "contato@clinica.com.br" in emails
    assert "comercial@clinica.com.br" in emails
    assert "logo@2x.png" not in emails
    assert "sprite@example.com" not in emails
    assert emails == sorted(set(emails))  # sem duplicados, ordenado


def test_normalize_phone_br():
    assert normalize_phone_br("(11) 99999-9999") == "+5511999999999"
    assert normalize_phone_br("+55 11 3333-4444") == "+551133334444"
    assert normalize_phone_br("11 3333 4444") == "+551133334444"
    assert normalize_phone_br("123") is None
    assert normalize_phone_br("0800 123 4567") is None or normalize_phone_br("0800 123 4567").startswith("+55")


def test_extract_phones():
    html = "Ligue (11) 98888-7777 ou 11 3030-4040"
    phones = extract_phones(html)
    assert "+5511988887777" in phones
    assert "+551130304040" in phones


def test_extract_socials():
    html = """
        <a href="https://instagram.com/clinicavida/">insta</a>
        <a href="https://www.linkedin.com/company/clinica-vida">in</a>
        <a href="https://facebook.com/clinicavida">fb</a>
    """
    socials = extract_socials(html)
    assert socials["instagram"] == "https://instagram.com/clinicavida"
    assert "linkedin" in socials
    assert "facebook" in socials


def test_has_whatsapp():
    assert has_whatsapp('fale no <a href="https://wa.me/5511999999999">zap</a>', [])
    assert has_whatsapp("Atendimento via WhatsApp", ["+5511999999999"]) == "+5511999999999"
    assert has_whatsapp("sem nada aqui", []) is None
