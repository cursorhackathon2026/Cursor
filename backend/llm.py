"""
Provayder-agnostik LLM chaqiruvi (OpenAI-mos).
Kalit bo'lmasa — qoida asosidagi xavfsiz natija qaytadi (fallback).
Groq / Claude(OpenAI-mos) / OpenAI — .env orqali almashtiriladi.

S4: promptlar LLM ga dori BELGILAMASLIKNI, faqat shifokorning qaroriga
YORDAM berishni buyuradi. Yakuniy qaror shifokorda.
"""
import os
import json
import ssl
import urllib.request
import urllib.error

try:
    import certifi
    _SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _SSL_CTX = ssl.create_default_context()


_LANG = {
    "uz": "MUHIM: butun javobni FAQAT o'zbek tilida yoz.",
    "ru": "ВАЖНО: пиши весь ответ ТОЛЬКО на русском языке, кириллицей.",
    "en": "IMPORTANT: write the ENTIRE response ONLY in English.",
}


def _ld(lang):
    return _LANG.get(lang, _LANG["uz"])


def _call(messages, max_tokens=200, temperature=0.3):
    """LLM chaqiruvi. Matn yoki None (kalit yo'q / xato)."""
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        return None
    base = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")
    payload = {"model": model, "messages": messages,
               "temperature": temperature, "max_tokens": max_tokens}
    req = urllib.request.Request(
        f"{base}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                 "User-Agent": "perinatal-monitoring/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25, context=_SSL_CTX) as r:
            data = json.loads(r.read())
            return data["choices"][0]["message"]["content"].strip()
    except (urllib.error.URLError, KeyError, json.JSONDecodeError, TimeoutError, ValueError):
        return None


def _extract_json(text):
    """Matndan JSON ajratib olish (LLM ba'zan qo'shimcha matn qo'shadi)."""
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    for a, b in [("{", "}"), ("[", "]")]:
        i, j = text.find(a), text.rfind(b)
        if i != -1 and j != -1 and j > i:
            try:
                return json.loads(text[i:j + 1])
            except json.JSONDecodeError:
                continue
    return None


# ---------- #9: xavf tavsiyasini boyitish ----------
_SYSTEM_REC = (
    "Siz perinatal monitoring uchun shifokorga QAROR QO'LLAB-QUVVATLASH "
    "yordamchisisiz. 1-2 jumlada, faqat KUZATUV va TRIAJ tavsiyasini bering. "
    "HECH QACHON aniq dori nomi yoki dozasini aytmang. Yakuniy qaror shifokorda."
)


def enrich_recommendation(zone, factors, fallback, lang="uz"):
    factor_lines = "\n".join(f"- {f['label']}: {f['detail']}" for f in factors) or "- Omil yo'q"
    user = (f"Bemor xavf zonasi: {zone}.\nOmillar:\n{factor_lines}\n\n"
            "Shifokor uchun qisqa kuzatuv/triaj tavsiyasi (dori/doza yo'q).")
    out = _call([{"role": "system", "content": _ld(lang) + " " + _SYSTEM_REC},
                 {"role": "user", "content": user + "\n\n" + _ld(lang)}], max_tokens=180)
    return out or fallback


# ---------- #12: Digital Twin — dori xavfsizligini baholash (shifokor) ----------
_SYSTEM_TWIN = (
    "Siz bemorning RAQAMLI EGIZAGI — klinik qaror qo'llab-quvvatlash tizimisiz. "
    "Shifokor taklif qilgan dorini bemorning surunkali kasalliklari, allergiyalari, "
    "homiladorligi va joriy ko'rsatkichlariga qarab baholaysiz: samaradorlik, "
    "o'zaro ta'sir (interaksiya), kontrindikatsiya va hayot uchun xavf. "
    "Siz DORI BELGILAMAYSIZ — shifokor qaroriga yordam berasiz. "
    "Faqat JSON qaytaring: "
    '{"level":"Xavfsiz|Ehtiyot|Xavfli","warnings":["qisqa ogohlantirish"],"summary":"1-2 jumla xulosa"}. '
    "MUHIM: 'level' qiymati DOIM aynan Xavfsiz/Ehtiyot/Xavfli bo'lsin; warnings va summary matnlari so'ralgan tilда bo'lsin."
)


def twin_evaluate(patient, drug, dose, lang="uz"):
    """Qoida (allergiya) + LLM. Qaytadi: {level, warnings, summary}."""
    conditions = ", ".join(patient.get("conditions", [])) or "yo'q"
    allergies = patient.get("allergies", [])
    allergies_str = ", ".join(allergies) or "yo'q"
    last = patient["encounters"][-1]["vitals"] if patient["encounters"] else {}
    vit = f"BP {last.get('bp_sys')}/{last.get('bp_dia')}, Hb {last.get('hemoglobin')}, Glu {last.get('glucose')}, {last.get('gestational_week')}-hafta homilalik"

    _AW = {
        "uz": "Bemorда {a} allergiyasi bor — bu dori mos kelmasligi mumkin!",
        "ru": "У пациента аллергия на {a} — препарат может быть противопоказан!",
        "en": "Patient is allergic to {a} — this drug may be contraindicated!",
    }
    # Kafolatlangan qoida: allergiya mosligi -> Xavfli
    rule_warnings = []
    for a in allergies:
        if a and (a.lower() in drug.lower() or drug.lower() in a.lower()):
            rule_warnings.append(_AW.get(lang, _AW["uz"]).format(a=a))

    user = (f"Bemor: {patient['name']}, {patient['age']} yosh.\n"
            f"Surunkali kasalliklar: {conditions}\n"
            f"Allergiyalar: {allergies_str}\n"
            f"Joriy ko'rsatkichlar: {vit}\n"
            f"Shifokor taklif qilgan dori: {drug} {dose}\n\n"
            "Ushbu dorini baholang (JSON).")
    parsed = _extract_json(_call([{"role": "system", "content": _ld(lang) + " " + _SYSTEM_TWIN},
                                  {"role": "user", "content": user + "\n\n" + _ld(lang)}],
                                 max_tokens=320, temperature=0.2))

    if parsed and isinstance(parsed, dict):
        level = parsed.get("level", "Ehtiyot")
        warnings = parsed.get("warnings", []) or []
        summary = parsed.get("summary", "")
        if rule_warnings:
            level = "Xavfli"
            warnings = rule_warnings + [w for w in warnings if w not in rule_warnings]
        return {"level": level, "warnings": warnings, "summary": summary, "ai": True}

    # Fallback (LLM yo'q)
    if rule_warnings:
        return {"level": "Xavfli", "warnings": rule_warnings,
                "summary": "Allergiya mosligi aniqlandi — bu dorini bermang, muqobil tanlang.",
                "ai": False}
    return {"level": "Ehtiyot", "warnings": [],
            "summary": "Avtomatik baholash mavjud emas — bemor tarixi va ko'rsatkichlarini shifokor tekshirsin.",
            "ai": False}


# ---------- #12: Bemor uchun turmush-tarzi tavsiyalari ----------
_SYSTEM_LIFE = (
    "Siz bemor uchun sog'lom turmush-tarzi maslahatchisisiz. Bemorning ko'rsatkichlari "
    "va kasalliklariga qarab 3 ta AMALIY, XAVFSIZ tavsiya bering (stress, ovqatlanish, "
    "harakat, uyqu). Dori tavsiya QILMANG. Faqat JSON: "
    '[{"title":"qisqa sarlavha","detail":"1 jumla amaliy maslahat"}].'
)


def lifestyle_recommend(patient, lang="uz"):
    conditions = ", ".join(patient.get("conditions", [])) or "yo'q"
    last = patient["encounters"][-1]["vitals"] if patient["encounters"] else {}
    user = (f"Ko'rsatkichlar: BP {last.get('bp_sys')}/{last.get('bp_dia')}, "
            f"Hb {last.get('hemoglobin')}, Glu {last.get('glucose')}. "
            f"Kasalliklar: {conditions}. 3 ta turmush-tarzi tavsiyasi (JSON).")
    parsed = _extract_json(_call([{"role": "system", "content": _ld(lang) + " " + _SYSTEM_LIFE},
                                  {"role": "user", "content": user + "\n\n" + _ld(lang)}],
                                 max_tokens=320, temperature=0.5))
    if isinstance(parsed, list) and parsed:
        return [{"title": x.get("title", ""), "detail": x.get("detail", "")}
                for x in parsed if isinstance(x, dict)][:4]

    # Fallback
    recs = [{"title": "Kunlik yurish", "detail": "Har kuni 20-30 daqiqa yengil yurish qon bosimini barqarorlashtiradi."},
            {"title": "Tuzni kamaytiring", "detail": "Kunlik tuz miqdorini kamaytiring — bu bosimni pasaytiradi."},
            {"title": "Yetarli uyqu", "detail": "Kuniga 7-8 soat uyqu stressni kamaytiradi."}]
    return recs
