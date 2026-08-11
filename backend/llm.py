"""
Provayder-agnostik LLM chaqiruvi (OpenAI-mos).
Kalit bo'lmasa — qoida asosidagi xavfsiz tavsiya qaytadi (fallback).
Groq / Claude(OpenAI-mos proxy) / OpenAI — .env orqali almashtiriladi.

S4: prompt LLM ga dori/doza AYTMASLIKNI qat'iy buyuradi.
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

_SYSTEM = (
    "Siz perinatal (ona-bola) monitoringi uchun SHIFOKORGA QARP QO'LLAB-QUVVATLASH "
    "yordamchisisiz. O'zbek tilida, 1-2 jumlada, faqat KUZATUV va TRIAJ tavsiyasini bering. "
    "HECH QACHON aniq dori nomi yoki dozasini aytmang. Yakuniy qaror shifokorda. "
    "Xotirjam, aniq va professional yozing."
)


def enrich_recommendation(zone: str, factors: list, fallback: str) -> str:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        return fallback
    base = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")

    factor_lines = "\n".join(f"- {f['label']}: {f['detail']}" for f in factors) or "- Belgilanган xavf omili yo'q"
    user = (
        f"Bemor xavf zonasi: {zone}.\nAniqlangan omillar:\n{factor_lines}\n\n"
        "Shifokor uchun qisqa kuzatuv/triaj tavsiyasini bering (dori/doza yo'q)."
    )
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": _SYSTEM},
                     {"role": "user", "content": user}],
        "temperature": 0.3,
        "max_tokens": 160,
    }
    req = urllib.request.Request(
        f"{base}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "perinatal-monitoring/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20, context=_SSL_CTX) as r:
            data = json.loads(r.read())
            text = data["choices"][0]["message"]["content"].strip()
            return text or fallback
    except (urllib.error.URLError, KeyError, json.JSONDecodeError, TimeoutError):
        return fallback
