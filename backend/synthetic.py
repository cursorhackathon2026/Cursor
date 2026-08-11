"""
Sintetik bemor ma'lumotlari (DMED tuzilishiga yaqinlashtirilgan).
Demo/MVP uchun — real ma'lumot emas. Pitchda buni ochiq aytamiz.
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

# Zonaga qarab vitallar generatsiyasi (demo hikoyasi ishonarli bo'lsin).
# Muhim: Sariq uchun FAQAT bitta o'rtacha og'ish beriladi, aks holda ballar
# to'planib Qizilga o'tib ketadi.
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
        else:  # glu(+20) + yengil anemiya(+10) = 30 -> Sariq
            v["glucose"] = round(random.uniform(5.5, 6.4), 1)
            v["hemoglobin"] = random.randint(100, 108)
        return v
    # Qizil: bitta og'ir omil
    if random.random() < 0.5:
        v["bp_sys"] = random.randint(160, 178); v["bp_dia"] = random.randint(110, 118)
    else:
        v["hemoglobin"] = random.randint(58, 68)
    return v


def _symptoms_for(target_zone):
    if target_zone == "Qizil":
        return random.choice([["bosh_ogrigi", "koz_parcha"], ["harakat_kamaygan"], []])
    if target_zone == "Sariq":
        return random.choice([[], ["kongil_aynishi"]])   # preeklampsiya belgilarisiz
    return []


def seed(n=16):
    patients = {}
    now = datetime.now()
    # Zona taqsimoti: ~14 qizil emas — realroq aralashma
    zones = (["Qizil"] * 4) + (["Sariq"] * 6) + (["Yashil"] * 6)
    random.shuffle(zones)
    for i, name in enumerate(_NAMES[:n]):
        pid = f"P{i+1:03d}"
        target = zones[i % len(zones)]
        gest = random.randint(20, 39)
        encounters = []
        # 2–3 ta ko'rik (vaqt bo'yicha), oxirgisi target zonaga mos
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
        patients[pid] = {
            "id": pid, "name": name, "age": random.randint(19, 41),
            "gestational_week": gest, "phone": f"+998 9{random.randint(0,9)} {random.randint(100,999)}-{random.randint(10,99)}-{random.randint(10,99)}",
            "region": _REGION,
            "encounters": encounters,
            "current_zone": encounters[-1]["assessment"]["zone"],
            "updated_at": encounters[-1]["ts"],
        }
    return patients


if __name__ == "__main__":
    p = seed()
    from collections import Counter
    print("Bemorlar:", len(p))
    print("Zona taqsimoti:", Counter(x["current_zone"] for x in p.values()))
