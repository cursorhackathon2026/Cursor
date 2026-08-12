"""
O'zbekiston dori reyestri bo'yicha mavjudlik tekshiruvi (offline).
Manba: uzpharm-control.uz rasmiy reyestri (Excel) -> pharma_registry.json.

check_availability(name, dose) qaytaradi:
  found, name_uz, count, availability (keng|cheklangan|kamyob|yo'q), doses,
  dose_match, rx, local, alternatives[].
"""
import json
import os
import re
import difflib

_PATH = os.path.join(os.path.dirname(__file__), "pharma_registry.json")
try:
    _DB = json.load(open(_PATH, encoding="utf-8"))
except Exception:
    _DB = {"inns": {}, "trades": {}, "atc": {}}

_INNS = _DB["inns"]
_TRADES = _DB["trades"]
_ATC = _DB["atc"]
_KEYS = list(_INNS.keys())

_CYR = {'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu',
        'я': 'ya', 'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h'}


def _translit(s):
    return ''.join(_CYR.get(ch, ch) for ch in str(s or '').lower())


def _norm(s):
    return re.sub(r'[^a-z0-9]', '', _translit(s))


# Lotin dori nomi -> reyestrdagi INN ichida uchraydigan bo'lak (chekka holatlar)
_ALIAS = {
    'aspirin': 'atsetilsalitsil', 'aspirinkardio': 'atsetilsalitsil',
    'temir': 'zheleza', 'ferrosulfat': 'zheleza', 'ferrum': 'zheleza',
    'foliy': 'folievaya', 'foliykislotasi': 'folievaya', 'folievaya': 'folievaya',
    'vitaminb12': 'tsianokobalamin', 'b12': 'tsianokobalamin',
    'vitaminc': 'askorbin', 'askorbinkislotasi': 'askorbin',
    'natriyxlorid': 'natriyaxlorid', 'osma': 'natriyaxlorid',
}


def _clean(name):
    # "Aspirin (kardio)" -> "aspirin", "Temir (III) preparati" -> "temir..."
    base = re.split(r'[(,]', name)[0]
    return _norm(base)


def _find(name):
    k = _clean(name)
    if not k:
        return None
    if k in _INNS:
        return k
    if k in _ALIAS:            # chekka holatlar trade'dan oldin
        return _best(_ALIAS[k]) or None
    if k in _TRADES:
        return _TRADES[k]
    m = difflib.get_close_matches(k, _KEYS, n=1, cutoff=0.84)
    if m:
        return m[0]
    if len(k) > 5:            # prefiks / bo'lak (eng mos: boshlanadi > qisqa)
        return _best(k)
    return None


def _best(sub):
    """sub bo'lakni o'z ichiga olgan kalitlardan eng mosini: aynan > boshlanadi >
    ko'proq tarqalgan > qisqa."""
    cands = [kk for kk in _KEYS if sub in kk]
    if not cands:
        return None
    cands.sort(key=lambda kk: (kk != sub, not kk.startswith(sub),
                               -_INNS[kk]["count"], len(kk)))
    return cands[0]


_DOSE = re.compile(r'(\d+[.,]?\d*)\s*(mg/ml|mkg|mcg|mg|g|ml|iu|birlik|ме|ед|%)', re.I)
_U = {'mg': 'mg', 'mkg': 'mcg', 'mcg': 'mcg', 'g': 'g', 'ml': 'ml', 'iu': 'iu',
      'birlik': 'iu', 'ме': 'iu', 'ед': 'iu', '%': '%', 'mg/ml': 'mg/ml'}


def _dose_token(dose):
    m = _DOSE.search(str(dose or ''))
    if not m:
        return None
    num, unit = m.group(1), m.group(2).lower()
    num = num.replace(',', '.').rstrip('0').rstrip('.') if '.' in num else num
    return f"{num}{_U.get(unit, unit)}"


def _display(cyr):
    return _translit(cyr).title().strip()


def _availability(count):
    if count >= 6:
        return "keng"        # keng tarqalgan
    if count >= 3:
        return "cheklangan"  # cheklangan
    return "kamyob"          # kamyob


def alternatives(key, limit=3):
    """Xuddi shu ATX kichik guruhidagi boshqa (ko'proq tarqalgan) dorilar."""
    e = _INNS.get(key)
    if not e:
        return []
    a5 = (e.get("atc") or "")[:5]
    out = []
    for k in _ATC.get(a5, []):
        if k == key or k not in _INNS:
            continue
        alt = _INNS[k]
        # kombinatsiya (+) va noaniq nomlarni tashlaymiz — toza bitta modda
        if '+' in alt["cyr"] or 'отсутств' in alt["cyr"].lower() or alt["count"] < 2:
            continue
        out.append({"name": _display(alt["cyr"]), "count": alt["count"]})
        if len(out) >= limit:
            break
    return out


def check_availability(name, dose=""):
    key = _find(name)
    if not key:
        return {"found": False, "query": name, "availability": "yo'q",
                "count": 0, "doses": [], "dose_match": None, "alternatives": []}
    e = _INNS[key]
    doses = e.get("strengths", [])
    dt = _dose_token(dose)
    dose_match = (dt in doses) if dt else None
    avail = _availability(e["count"])
    alts = alternatives(key) if avail != "keng" else []
    return {
        "found": True,
        "query": name,
        "name_uz": _display(e["cyr"]),
        "atc": e.get("atc", ""),
        "count": e["count"],
        "availability": avail,          # keng | cheklangan | kamyob
        "doses": doses[:8],
        "dose_match": dose_match,       # True/False/None
        "rx": e.get("rx", ""),
        "local": e.get("local", False),
        "trades": e.get("trades", [])[:3],
        "alternatives": alts,
    }


if __name__ == "__main__":
    for q, d in [("Metformin", "500 mg"), ("Metoprolol", "50 mg"), ("Aspirin", "75 mg"),
                 ("Enalapril", "40 mg"), ("Allopurinol", "100 mg"), ("Ketotifen XYZ", ""),
                 ("Temir (III) preparati", "100 mg"), ("Foliy kislotasi", "400 mkg")]:
        r = check_availability(q, d)
        if r["found"]:
            print(f"{q:24} -> {r['name_uz'][:18]:18} | {r['availability']:10} ({r['count']} ta) | "
                  f"doza {d} mos={r['dose_match']} | muqobil: {', '.join(a['name'] for a in r['alternatives'])}")
        else:
            print(f"{q:24} -> TOPILMADI | muqobil: {', '.join(a['name'] for a in r['alternatives'])}")
