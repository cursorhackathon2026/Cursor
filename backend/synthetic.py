"""
Sintetik bemor ma'lumotlari (DMED tuzilishiga yaqinlashtirilgan).
Demo/MVP uchun — real ma'lumot emas. Pitchda buni ochiq aytamiz.

#12 (Digital Twin) uchun har bemorда: surunkali kasalliklar, allergiya,
5 yillik tarix, joriy dorilar (adherence) mavjud.
"""
import random
from datetime import datetime, timedelta
import risk_engine

random.seed(42)

_NAMES = [
    "Nasiba Karimova", "Malika Yusupova", "Gulnora Tosheva", "Dilnoza Rahimova",
    "Feruza Nazarova", "Barno Xolmatova", "Oydin Rashidova", "Zulfiya Sobirova",
    "Sevara Ismoilova", "Kamola Ergasheva", "Nigora Aliyeva", "Shahnoza Qodirova",
    "Munira Toirova", "Dildora Usmonova", "Ra'no Yo'ldosheva", "Zarina Halilova",
]
_REGION = "Navoiy viloyati"

_CONDITIONS = [
    [], [], ["Surunkali gipertenziya"], ["Qandli diabet (2-tip)"],
    ["Temir tanqisligi anemiyasi"], ["Surunkali gipertenziya", "Qandli diabet (2-tip)"],
    ["Qalqonsimon bez faoliyati pasayishi"],
]
_ALLERGIES = [[], [], [], ["Penitsillin"], ["Aspirin"], ["Sulfanilamidlar"]]

# Demo uchun aniq (fixed) telefon raqamlar — login predskazuemый bo'lsin
_FIXED_PATIENT_PHONES = {
    "P001": "+998 90 555 66 77",   # Nasiba — homilador + surunkali gipertenziya
    "P002": "+998 90 666 77 88",   # Malika — homilador + qandli diabet
}


def _vitals_for(target_zone):
    v = {"bp_sys": random.randint(108, 126), "bp_dia": random.randint(68, 80),
         "hemoglobin": random.randint(115, 130), "glucose": round(random.uniform(4.0, 4.9), 1)}
    if target_zone == "Yashil":
        return v
    if target_zone == "Sariq":
        pick = random.choice(["bp", "hb", "glu"])
        if pick == "bp":
            v["bp_sys"] = random.randint(140, 148); v["bp_dia"] = random.randint(90, 95)
        elif pick == "hb":
            v["hemoglobin"] = random.randint(85, 99)
        else:
            v["glucose"] = round(random.uniform(5.5, 6.4), 1)
            v["hemoglobin"] = random.randint(100, 108)
        return v
    if random.random() < 0.5:
        v["bp_sys"] = random.randint(160, 178); v["bp_dia"] = random.randint(110, 118)
    else:
        v["hemoglobin"] = random.randint(58, 68)
    return v


def _symptoms_for(target_zone):
    if target_zone == "Qizil":
        return random.choice([["bosh_ogrigi", "koz_parcha"], ["harakat_kamaygan"], []])
    if target_zone == "Sariq":
        return random.choice([[], ["kongil_aynishi"]])
    return []


def _history(conditions, now):
    """5 yillik kasallik tarixi (soddalashtirilган)."""
    h = []
    y = now.year
    if "Surunkali gipertenziya" in conditions:
        h.append({"year": y - 4, "event": "Gipertenziya tashxisi qo'yildi (I bosqich)"})
        h.append({"year": y - 2, "event": "Qon bosimi ko'tarilishi, dori dozasi oshirildi"})
    if "Qandli diabet (2-tip)" in conditions:
        h.append({"year": y - 3, "event": "2-tip qandli diabet aniqlandi (HbA1c 7.8%)"})
    if "Temir tanqisligi anemiyasi" in conditions:
        h.append({"year": y - 1, "event": "Anemiya, temir preparatlari tayinlandi"})
    h.append({"year": y - 1, "event": "Homiladorlik hisobga olindi (antenatal kuzatuv)"})
    h.append({"year": y, "event": "Joriy homiladorlik — muntazam ko'rik"})
    return sorted(h, key=lambda x: x["year"])


def _medications(conditions):
    meds = []
    if "Surunkali gipertenziya" in conditions:
        meds.append({"name": "Metildopa", "dose": "250 mg", "schedule": "2 marta/kun"})
    if "Qandli diabet (2-tip)" in conditions:
        meds.append({"name": "Insulin (bazal)", "dose": "10 birlik", "schedule": "kechqurun"})
    if "Temir tanqisligi anemiyasi" in conditions:
        meds.append({"name": "Temir (III) preparati", "dose": "100 mg", "schedule": "1 marta/kun"})
    meds.append({"name": "Foliy kislotasi", "dose": "400 mkg", "schedule": "1 marta/kun"})
    out = []
    for i, m in enumerate(meds):
        out.append({**m, "id": f"m{i+1}", "taken_today": random.random() < 0.6})
    return out


def seed(n=16):
    patients = {}
    now = datetime.now()
    zones = (["Qizil"] * 4) + (["Sariq"] * 6) + (["Yashil"] * 6)
    random.shuffle(zones)
    for i, name in enumerate(_NAMES[:n]):
        pid = f"P{i+1:03d}"
        target = zones[i % len(zones)]
        gest = random.randint(20, 39)
        conditions = _FIXED_PATIENT_PHONES and (
            ["Surunkali gipertenziya"] if pid == "P001"
            else ["Qandli diabet (2-tip)"] if pid == "P002"
            else random.choice(_CONDITIONS)
        )
        allergies = (["Penitsillin"] if pid == "P001" else random.choice(_ALLERGIES))
        encounters = []
        k = random.randint(2, 3)
        for j in range(k):
            is_last = (j == k - 1)
            zt = target if is_last else random.choice(["Yashil", "Sariq"])
            v = _vitals_for(zt)
            v["gestational_week"] = gest - (k - 1 - j)
            s = _symptoms_for(zt) if is_last else []
            a = risk_engine.assess(v, s)
            ts = now - timedelta(days=(k - 1 - j) * 5, minutes=random.randint(1, 600))
            encounters.append({
                "ts": ts.isoformat(timespec="minutes"),
                "vitals": v, "symptoms": s, "assessment": a.to_dict(),
            })
        phone = _FIXED_PATIENT_PHONES.get(
            pid, f"+998 9{random.randint(0,9)} {random.randint(100,999)}-{random.randint(10,99)}-{random.randint(10,99)}")
        patients[pid] = {
            "id": pid, "name": name, "age": random.randint(19, 41),
            "gestational_week": gest, "phone": phone, "region": _REGION,
            "conditions": conditions, "allergies": allergies,
            "history": _history(conditions, now),
            "medications": _medications(conditions),
            "encounters": encounters,
            "current_zone": encounters[-1]["assessment"]["zone"],
            "updated_at": encounters[-1]["ts"],
            "appointments": [],
            "reports": [],
            "lifestyle_log": [],
        }
    return patients


if __name__ == "__main__":
    p = seed()
    from collections import Counter
    print("Bemorlar:", len(p))
    print("Zona:", Counter(x["current_zone"] for x in p.values()))
    print("P001 tel:", p["P001"]["phone"], "| kasalliklar:", p["P001"]["conditions"],
          "| allergiya:", p["P001"]["allergies"])
    print("P001 dorilar:", [m["name"] for m in p["P001"]["medications"]])
