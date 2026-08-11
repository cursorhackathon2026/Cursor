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
import clinical

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


_NONE = "yo'q"


def _join(xs):
    return ", ".join(xs) if xs else _NONE


def _vitals_line(patient):
    last = patient["encounters"][-1]["vitals"] if patient.get("encounters") else {}
    parts = []
    if last.get("bp_sys"): parts.append(f"BP {last.get('bp_sys')}/{last.get('bp_dia')}")
    if last.get("pulse"): parts.append(f"puls {last.get('pulse')}")
    if last.get("spo2"): parts.append(f"SpO₂ {last.get('spo2')}%")
    if last.get("temperature"): parts.append(f"harorat {last.get('temperature')}°C")
    if last.get("glucose"): parts.append(f"qand {last.get('glucose')}")
    if last.get("hemoglobin"): parts.append(f"Hb {last.get('hemoglobin')}")
    if last.get("gestational_week"): parts.append(f"{last.get('gestational_week')}-hafta homilalik")
    return ", ".join(parts) or "ko'rsatkichlar yo'q"


# ---------- #12+: 5 yillik prognoz ----------
_SYSTEM_PROG = (
    "Siz klinik BASHORAT (prognoz) yordamchisisiz. Bemorning surunkali kasalliklari, "
    "yoshi va ko'rsatkichlariga qarab KELGUSI 5 YILDA rivojlanishi mumkin bo'lgan "
    "asoratlarni baholaysiz. Faqat JSON qaytaring: "
    '{"summary":"1-2 jumla umumiy xulosa","items":[{"cond":"asorat nomi",'
    '"when":"1-3 yil|3-5 yil","risk":"past|o\'rta|yuqori","why":"qisqa sabab",'
    '"prevent":"qanday oldini olish"}]}. 3-4 ta eng muhim asoratni bering. '
    "Bu QAROR QO'LLAB-QUVVATLASH — yakuniy qaror shifokorda."
)


def prognose(patient, lang="uz"):
    """5 yillik ehtimoliy asoratlar. LLM + clinical fallback."""
    conds = patient.get("conditions", [])
    base = clinical.prognosis(conds, patient.get("age", 0))
    user = (f"Bemor: {patient.get('age')} yosh, jins {patient.get('gender', 'F')}.\n"
            f"Surunkali kasalliklar: {_join(conds)}\n"
            f"Joriy ko'rsatkichlar: {_vitals_line(patient)}\n\n"
            "5 yillik prognoz (JSON).")
    parsed = _extract_json(_call([{"role": "system", "content": _ld(lang) + " " + _SYSTEM_PROG},
                                  {"role": "user", "content": user + "\n\n" + _ld(lang)}],
                                 max_tokens=520, temperature=0.3))
    if isinstance(parsed, dict) and isinstance(parsed.get("items"), list) and parsed["items"]:
        items = [{"cond": x.get("cond", ""), "when": x.get("when", ""),
                  "risk": x.get("risk", "o'rta"), "why": x.get("why", ""),
                  "prevent": x.get("prevent", "")} for x in parsed["items"] if isinstance(x, dict)]
        return {"summary": parsed.get("summary", ""), "items": items[:5], "ai": True}
    # Fallback — bilim bazasi
    summ = ("Surunkali kasalliklar nazoratsiz qolsa quyidagi asoratlar ehtimoli oshadi. "
            "Muntazam kuzatuv va dori rejimiga rioya bu xavflarni sezilarli kamaytiradi.")
    return {"summary": summ if base else "Hozircha jiddiy uzoq muddatli xavf aniqlanmadi.",
            "items": base[:5], "ai": False}


# ---------- #12+: Optimal назначение (davolash rejasi) ----------
_SYSTEM_PLAN = (
    "Siz shifokor uchun DAVOLASH REJASI yordamchisisiz. Bemor tashxisi, surunkali "
    "kasalliklari, allergiyalari va ko'rsatkichlariga qarab ENG OPTIMAL, standart "
    "(darslik/klinik yo'riqnoma darajasidagi) davolashni taklif qilasiz. Har band uchun "
    "NEGA aynan shu tanlanganini qisqa izohlang. Allergiya va kontrindikatsiyalarni hisobga oling. "
    "Faqat JSON: {\"summary\":\"1 jumla umumiy yondashuv\",\"items\":[{\"kind\":\"dori|ukol|osma|ingalyator\","
    "\"name\":\"nomi\",\"dose\":\"doza\",\"schedule\":\"qabul tartibi\",\"rationale\":\"nega shu dori/usul\"}]}. "
    "3-5 ta band bering. Bu TAKLIF — shifokor ko'rib, tahrirlab, TASDIQLAYDI. Yakuniy qaror shifokorda."
)


def generate_treatment_plan(patient, diagnosis, lang="uz"):
    """Diagnoz + bemor holatiga qarab optimal davolash rejasi. LLM + clinical fallback."""
    conds = patient.get("conditions", [])
    allergies = patient.get("allergies", [])
    combined = conds + ([diagnosis] if diagnosis else [])
    user = (f"Bemor: {patient.get('name')}, {patient.get('age')} yosh, jins {patient.get('gender', 'F')}.\n"
            f"Surunkali kasalliklar: {_join(conds)}\n"
            f"Allergiyalar: {_join(allergies)}\n"
            f"Ko'rsatkichlar: {_vitals_line(patient)}\n"
            f"BUGUNGI TASHXIS: {diagnosis or '(kiritilmagan — surunkali kasallik nazorati)'}\n\n"
            "Shu bemor uchun optimal davolash rejasini bering (JSON).")
    parsed = _extract_json(_call([{"role": "system", "content": _ld(lang) + " " + _SYSTEM_PLAN},
                                  {"role": "user", "content": user + "\n\n" + _ld(lang)}],
                                 max_tokens=700, temperature=0.3))
    items = None
    ai = False
    if isinstance(parsed, dict) and isinstance(parsed.get("items"), list) and parsed["items"]:
        items = [{"kind": x.get("kind", "dori"), "name": x.get("name", ""),
                  "dose": x.get("dose", ""), "schedule": x.get("schedule", ""),
                  "rationale": x.get("rationale", "")} for x in parsed["items"]
                 if isinstance(x, dict) and x.get("name")]
        summary = parsed.get("summary", "")
        ai = True
    if not items:
        items = clinical.suggest_treatment(combined, allergies)
        summary = "Bemorning surunkali kasalliklariga mos standart davolash rejasi."
    # Har band uchun allergiya ogohlantirishi (kafolatlangan qoida)
    for it in items:
        hits = clinical.allergy_conflicts(it["name"], allergies)
        it["warn"] = (f"Diqqat: bemorда {', '.join(hits)} allergiyasi bor!" if hits else "")
    return {"summary": summary, "items": items, "ai": ai}


# ---------- #12+: Shifokor o'zgartirganда oqibat ----------
_SYSTEM_CONS = (
    "Siz klinik xavfsizlik yordamchisisiz. Shifokor davolash bandini o'zgartirdi. "
    "Bu o'zgarish QANDAY OQIBATLARGA olib kelishi mumkinligini 1-2 jumlaда, aniq va "
    "xolisona tushuntiring (samaradorlik, xavf, monitoring zarurati). Dori tavsiya "
    "qilmang — faqat oqibatni bayon eting. Faqat oddiy matn qaytaring."
)


def edit_consequence(patient, original, changed, lang="uz"):
    """Shifokor o'zgartirgan bandning oqibati (1-2 jumla)."""
    allergies = patient.get("allergies", [])
    hits = clinical.allergy_conflicts(changed.get("name", ""), allergies)
    user = (f"Bemor: {patient.get('age')} yosh, kasalliklar: {_join(patient.get('conditions', []))}, "
            f"allergiyalar: {_join(allergies)}.\n"
            f"Asl band: {original.get('name')} {original.get('dose')} — {original.get('schedule')}\n"
            f"Yangi (o'zgartirilgan) band: {changed.get('name')} {changed.get('dose')} — {changed.get('schedule')}\n\n"
            "Bu o'zgarish oqibatini tushuntiring.")
    out = _call([{"role": "system", "content": _ld(lang) + " " + _SYSTEM_CONS},
                 {"role": "user", "content": user + "\n\n" + _ld(lang)}], max_tokens=180, temperature=0.3)
    if out:
        if hits and not any(a.lower() in out.lower() for a in hits):
            out = f"⚠ Bemorда {', '.join(hits)} allergiyasi bor — bu dori mos kelmasligi mumkin. " + out
        return out
    # Fallback
    if hits:
        return f"⚠ Diqqat: bemorда {', '.join(hits)} allergiyasi bor — o'zgartirilgan dori mos kelmasligi mumkin, muqobil tanlang."
    if original.get("name", "").lower() != changed.get("name", "").lower():
        return "Dori almashtirildi — yangi dori samaradorligi va nojo'ya ta'sirlarini kuzatib boring; bemor tarixiga mosligini tekshiring."
    return "Doza/tartib o'zgartirildi — bu davolash samaradorligi va xavfsizligiga ta'sir qilishi mumkin; ko'rsatkichlarni qayta baholang."
