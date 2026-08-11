"""
Sintetik bemor ma'lumotlari — DEMO/MVP uchun (real ma'lumot emas, pitchda ochiq aytamiz).

Bemorlar QO'LDA tuzilgan va TURLI-TUMAN: erkak/ayol, yosh/qari, yurak, o'pka,
buyrak, diabet, anemiya, irsiy, podagra, artroz, homilador, polifarmatsiya —
har xil allergiyalar bilan. Har bemorда 5 yillik tarix, joriy dorilar (adherence)
va #12 (Digital Twin) uchun surunkali kasalliklar mavjud.
"""
import random
from datetime import datetime, timedelta
import risk_engine
import clinical

random.seed(42)

_REGION = "Navoiy viloyati"

# Normal ko'rsatkichlar — arxetip faqat o'zgargan qiymatlarni beradi
_NORMALS = {"bp_sys": 118, "bp_dia": 76, "pulse": 74, "spo2": 98,
            "temperature": 36.7, "glucose": 5.0, "hemoglobin": 128}

# Har bemor: (id, ism, jins, yosh, homila_haftasi, kasalliklar, allergiyalar, zona, joriy_vitallar, belgilar)
_PATIENTS = [
    ("P001", "Nasiba Karimova", "F", 33, 33, ["Surunkali gipertenziya"], ["Penitsillin"],
     "Qizil", {"bp_sys": 162, "bp_dia": 106}, ["bosh_ogrigi", "koz_parcha"]),
    ("P002", "Akmal Yo'ldoshev", "M", 58, 0, ["Qandli diabet (2-tip)", "Giperlipidemiya"], [],
     "Sariq", {"glucose": 9.2, "bp_sys": 138, "bp_dia": 86}, []),
    ("P003", "Rustam Qodirov", "M", 67, 0, ["Yurak ishemik kasalligi", "Surunkali gipertenziya"], ["Aspirin"],
     "Qizil", {"bp_sys": 150, "bp_dia": 92, "pulse": 96}, ["kokrak_ogrigi"]),
    ("P004", "Gulnora Tosheva", "F", 45, 0, ["Bronxial astma"], [],
     "Sariq", {"spo2": 93, "pulse": 101}, ["holsizlik"]),
    ("P005", "Dilnoza Rahimova", "F", 24, 0, ["Temir tanqisligi anemiyasi"], [],
     "Sariq", {"hemoglobin": 88}, ["holsizlik"]),
    ("P006", "Bahodir Ergashev", "M", 72, 0,
     ["Surunkali yurak yetishmovchiligi", "Surunkali gipertenziya", "Qandli diabet (2-tip)"], ["Sulfanilamidlar"],
     "Qizil", {"bp_sys": 155, "bp_dia": 96, "glucose": 9.0, "spo2": 93}, ["nafas_qisilishi", "shish"]),
    ("P007", "Feruza Nazarova", "F", 52, 0, ["Qalqonsimon bez faoliyati pasayishi (gipotireoz)"], [],
     "Yashil", {"bp_sys": 124, "bp_dia": 80, "glucose": 5.1}, []),
    ("P008", "Sardor Aliyev", "M", 40, 0, ["Oilaviy giperxolesterinemiya"], [],
     "Sariq", {"bp_sys": 141, "bp_dia": 90}, []),
    ("P009", "Oydin Rashidova", "F", 61, 0, ["Surunkali buyrak kasalligi", "Surunkali gipertenziya"], ["NPVP"],
     "Sariq", {"bp_sys": 146, "bp_dia": 92, "hemoglobin": 105}, []),
    ("P010", "Jasur Karimov", "M", 55, 0, ["Podagra", "Giperlipidemiya"], [],
     "Yashil", {"bp_sys": 132, "bp_dia": 84}, []),
    ("P011", "Nigora Aliyeva", "F", 31, 30, ["Surunkali gipertenziya"], [],
     "Qizil", {"bp_sys": 158, "bp_dia": 102}, ["bosh_ogrigi", "koz_parcha"]),
    ("P012", "Shahnoza Qodirova", "F", 68, 0, ["Osteoartroz", "Surunkali gipertenziya"], [],
     "Yashil", {"bp_sys": 134, "bp_dia": 84}, []),
    ("P013", "Bekzod Tursunov", "M", 34, 0, ["Bronxial astma"], ["Penitsillin"],
     "Yashil", {"spo2": 97}, []),
    ("P014", "Dildora Usmonova", "F", 47, 0, ["Qandli diabet (2-tip)", "Surunkali gipertenziya"], [],
     "Qizil", {"bp_sys": 184, "bp_dia": 118, "glucose": 10.5}, ["bosh_ogrigi"]),
    ("P015", "Ravshan Halilov", "M", 63, 0, ["Yurak ishemik kasalligi", "Giperlipidemiya"], [],
     "Sariq", {"bp_sys": 142, "bp_dia": 88, "pulse": 104}, []),
    ("P016", "Zarina Yo'ldosheva", "F", 27, 0, ["Gastroezofageal reflyuks (GERD)", "Migren"], [],
     "Yashil", {"glucose": 4.8}, []),
]

# Demo login uchun aniq telefon raqamlar
_FIXED_PHONES = {
    "P001": "+998 90 555 66 77",   # Nasiba — homilador + gipertenziya (Qizil)
    "P002": "+998 90 666 77 88",   # Akmal — diabet + giperlipidemiya (Sariq)
}


def _history(conditions, age, pregnant, now):
    y = now.year
    h = []
    if any("gipertenziya" in c.lower() for c in conditions):
        h.append({"year": y - 5, "event": "Gipertenziya tashxisi qo'yildi (I bosqich)"})
        h.append({"year": y - 2, "event": "Qon bosimi ko'tarilishi qayd etildi"})
    if any("diabet" in c.lower() for c in conditions):
        h.append({"year": y - 4, "event": "2-tip qandli diabet aniqlandi (HbA1c 7.8%)"})
    if any("yurak ishemik" in c.lower() for c in conditions):
        h.append({"year": y - 3, "event": "Stenokardiya xurujlari, koronarografiya o'tkazildi"})
    if any("yurak yetishmovchiligi" in c.lower() for c in conditions):
        h.append({"year": y - 2, "event": "Surunkali yurak yetishmovchiligi (FK II) aniqlandi"})
    if any("astma" in c.lower() for c in conditions):
        h.append({"year": y - 6, "event": "Bronxial astma tashxisi, ingalyator tayinlandi"})
    if any("buyrak" in c.lower() for c in conditions):
        h.append({"year": y - 3, "event": "Surunkali buyrak kasalligi (2-bosqich) aniqlandi"})
    if any("anemiya" in c.lower() for c in conditions):
        h.append({"year": y - 1, "event": "Temir tanqisligi anemiyasi, preparatlar tayinlandi"})
    if any("giperxolester" in c.lower() for c in conditions):
        h.append({"year": y - 4, "event": "Oilaviy giperxolesterinemiya (otasida erta infarkt)"})
    if any("gipotireoz" in c.lower() for c in conditions):
        h.append({"year": y - 5, "event": "Gipotireoz aniqlandi, TSH yuqori"})
    if any("podagra" in c.lower() for c in conditions):
        h.append({"year": y - 2, "event": "Podagra xuruji (oyoq bosh barmog'i)"})
    if pregnant:
        h.append({"year": y, "event": "Joriy homiladorlik — antenatal kuzatuv"})
    if age >= 65:
        h.append({"year": y - 1, "event": "Yoshga bog'liq umumiy ko'rik o'tkazildi"})
    h.append({"year": y, "event": "Oxirgi ko'rik — monitoring tizimiga ulandi"})
    return sorted(h, key=lambda x: x["year"])


def _medications(conditions, allergies):
    meds = clinical.suggest_treatment(conditions, allergies)
    out = []
    for i, m in enumerate(meds):
        out.append({"id": f"m{i+1}", "name": m["name"], "dose": m["dose"],
                    "schedule": m["schedule"], "kind": m.get("kind", "dori"),
                    "rationale": m.get("rationale", ""),
                    "taken_today": random.random() < 0.6})
    return out


def _encounter_vitals(overrides, pregnant, factor):
    """factor=1.0 -> to'liq arxetip; <1 -> normalga yaqinroq (o'tmish)."""
    v = dict(_NORMALS)
    for k, val in overrides.items():
        base = _NORMALS.get(k, val)
        v[k] = round(base + (val - base) * factor, 1) if isinstance(val, float) else int(base + (val - base) * factor)
    if pregnant:
        v["gestational_week"] = pregnant
    return v


def seed(n=16):
    patients = {}
    now = datetime.now()
    for idx, (pid, name, gender, age, gest, conds, allergies, zone, vit, sym) in enumerate(_PATIENTS[:n]):
        encounters = []
        # 3 ta ko'rik: o'tmishdagilar yengilroq, oxirgisi to'liq arxetip
        steps = [(0.35, False), (0.7, False), (1.0, True)]
        for j, (factor, is_last) in enumerate(steps):
            gw = (gest - (len(steps) - 1 - j)) if gest else 0
            v = _encounter_vitals(vit, gw, factor)
            s = sym if is_last else []
            a = risk_engine.assess(v, s, conds)
            ts = now - timedelta(days=(len(steps) - 1 - j) * 6, minutes=random.randint(1, 500))
            encounters.append({"ts": ts.isoformat(timespec="minutes"), "vitals": v,
                               "symptoms": s, "assessment": a.to_dict()})
        phone = _FIXED_PHONES.get(
            pid, f"+998 9{random.randint(0,9)} {random.randint(100,999)}-{random.randint(10,99)}-{random.randint(10,99)}")
        patients[pid] = {
            "id": pid, "name": name, "gender": gender, "age": age,
            "gestational_week": gest, "phone": phone, "region": _REGION,
            "conditions": conds, "allergies": allergies,
            "history": _history(conds, age, gest, now),
            "medications": _medications(conds, allergies),
            "encounters": encounters,
            "current_zone": encounters[-1]["assessment"]["zone"],
            "updated_at": encounters[-1]["ts"],
        }
    return patients


if __name__ == "__main__":
    p = seed()
    from collections import Counter
    print("Bemorlar:", len(p))
    print("Zona:", Counter(x["current_zone"] for x in p.values()))
    for pid, d in p.items():
        print(f"{pid} {d['name'][:18]:18} {d['gender']} {d['age']:>2}y "
              f"{d['current_zone']:6} | {', '.join(d['conditions'])[:44]:44} "
              f"| dori: {len(d['medications'])}")
