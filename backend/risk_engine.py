"""
Klinik xavf-dvigateli (#9 ning yuragi) — UMUMIY holat uchun.

Gibrid, tushuntiriladigan yondashuv:
  1) Qoida dvigateli — isbotlangan "red-flag"lar (BP, SpO₂, puls, isitma, qand, Hb).
  2) Og'irlikli ball — har omil ballga qo'shiladi, umumiy ball zonaga aylanadi.
  3) KASALLIKKA MOSLASHGAN — masalan diabetik bemorда qand chegaralari boshqacha,
     homiladorда gipertenziya + belgilar = preeklampsiya xavfi.
  4) Har javob TUSHUNTIRILADI (nega bu zona) — shifokor ko'radi.

MUHIM (S4): bu QAROR QO'LLAB-QUVVATLASH yordamchisi. Yakuniy qaror shifokorda.
"""
from dataclasses import dataclass, field, asdict
from typing import Optional

# Bemor belgilarining kalitlari (ASCII — i18n bilan mos)
SYMPTOMS = {
    "kokrak_ogrigi": "Ko'krak qafasi og'rig'i",
    "nafas_qisilishi": "Nafas qisilishi",
    "bosh_ogrigi": "Bosh og'rig'i",
    "bosh_aylanishi": "Bosh aylanishi",
    "koz_parcha": "Ko'z oldida parcha",
    "kongil_aynishi": "Ko'ngil aynishi",
    "qorin_ogrigi": "Qorin og'rig'i",
    "shish": "Shish (oyoq/yuz)",
    "holsizlik": "Umumiy holsizlik",
    "harakat_kamaygan": "Homila harakati kamaygan",
}

# Preeklampsiyaga xos belgilar (faqat homiladorда qo'llanadi)
_PREECLAMPSIA_SYMPTOMS = {"bosh_ogrigi", "koz_parcha", "qorin_ogrigi", "shish"}


def _has(conds, *kw):
    low = [c.lower() for c in (conds or [])]
    return any(any(k in c for c in low) for k in kw)


@dataclass
class Factor:
    label: str          # "Og'ir gipertenziya"
    points: int         # ballga qo'shilishi
    severity: str       # "red" | "yellow"
    detail: str         # "BP 165/112 mmHg"


@dataclass
class Assessment:
    zone: str                          # "Qizil" | "Sariq" | "Yashil"
    score: int
    urgent: bool
    factors: list = field(default_factory=list)   # ball bo'yicha kamayuvchi
    recommendation: str = ""

    def to_dict(self):
        d = asdict(self)
        d["factors"] = [asdict(f) if not isinstance(f, dict) else f for f in self.factors]
        return d


def assess(vitals: dict, symptoms: Optional[list] = None, conditions: Optional[list] = None) -> Assessment:
    """
    vitals: {bp_sys, bp_dia, pulse, spo2, temperature, glucose, hemoglobin,
             weight, gestational_week}  (har biri None bo'lishi mumkin)
    symptoms: SYMPTOMS kalitlari
    conditions: bemorning surunkali kasalliklari (chegaralarni moslashtirish uchun)
    """
    symptoms = set(symptoms or [])
    conds = conditions or []
    factors: list[Factor] = []

    bp_sys = vitals.get("bp_sys")
    bp_dia = vitals.get("bp_dia")
    pulse = vitals.get("pulse")
    spo2 = vitals.get("spo2")
    temp = vitals.get("temperature")
    glu = vitals.get("glucose")
    hb = vitals.get("hemoglobin")
    pregnant = bool(vitals.get("gestational_week"))
    diabetic = _has(conds, "diabet")

    # --- Qon bosimi ---
    hypertensive = False
    if bp_sys is not None and bp_dia is not None:
        if bp_sys >= 180 or bp_dia >= 120:
            factors.append(Factor("Gipertonik kriz", 65, "red", f"BP {bp_sys}/{bp_dia} mmHg (≥180/120)"))
            hypertensive = True
        elif bp_sys >= 160 or bp_dia >= 100:
            factors.append(Factor("Og'ir gipertenziya", 55, "red", f"BP {bp_sys}/{bp_dia} mmHg (≥160/100)"))
            hypertensive = True
        elif bp_sys >= 140 or bp_dia >= 90:
            factors.append(Factor("Gipertenziya", 30, "yellow", f"BP {bp_sys}/{bp_dia} mmHg (≥140/90)"))
            hypertensive = True
        elif bp_sys < 90:
            factors.append(Factor("Past qon bosimi (gipotoniya)", 30, "yellow", f"BP {bp_sys}/{bp_dia} mmHg (<90)"))

    # --- Kislorod (SpO₂) ---
    if spo2 is not None:
        if spo2 < 90:
            factors.append(Factor("Kislorod tanqisligi", 60, "red", f"SpO₂ {spo2}% (<90)"))
        elif spo2 < 94:
            factors.append(Factor("Kislorod pasaygan", 25, "yellow", f"SpO₂ {spo2}% (94% dan past)"))

    # --- Puls ---
    if pulse is not None:
        if pulse > 120:
            factors.append(Factor("Yuqori puls (taxikardiya)", 30, "red", f"Puls {pulse}/daq (>120)"))
        elif pulse > 100:
            factors.append(Factor("Taxikardiya", 15, "yellow", f"Puls {pulse}/daq (>100)"))
        elif pulse < 50:
            factors.append(Factor("Past puls (bradikardiya)", 20, "yellow", f"Puls {pulse}/daq (<50)"))

    # --- Harorat ---
    if temp is not None:
        if temp >= 39.0:
            factors.append(Factor("Yuqori isitma", 30, "red", f"Harorat {temp}°C (≥39)"))
        elif temp >= 38.0:
            factors.append(Factor("Isitma", 15, "yellow", f"Harorat {temp}°C (≥38)"))

    # --- Qand (diabetga moslashgan) ---
    if glu is not None:
        red_hi, yel_hi = (13.0, 8.5) if diabetic else (11.0, 7.0)
        if glu < 3.5:
            factors.append(Factor("Gipoglikemiya (past qand)", 45, "red", f"Glyukoza {glu} mmol/L (<3.5)"))
        elif glu >= red_hi:
            factors.append(Factor("Juda yuqori qand", 45, "red", f"Glyukoza {glu} mmol/L (≥{red_hi})"))
        elif glu >= yel_hi:
            lbl = "Yuqori qand (diabet nazoratsiz)" if diabetic else "Yuqori qand"
            factors.append(Factor(lbl, 22, "yellow", f"Glyukoza {glu} mmol/L (≥{yel_hi})"))

    # --- Gemoglobin (anemiya) ---
    if hb is not None:
        if hb < 70:
            factors.append(Factor("Og'ir anemiya", 50, "red", f"Hb {hb} g/L (<70)"))
        elif hb < 100:
            factors.append(Factor("O'rtacha anemiya", 22, "yellow", f"Hb {hb} g/L (70–99)"))
        elif hb < 110:
            factors.append(Factor("Yengil anemiya", 10, "yellow", f"Hb {hb} g/L (110 dan past)"))

    # --- Belgilar ---
    if "kokrak_ogrigi" in symptoms:
        factors.append(Factor("Ko'krak og'rig'i (yurak xavfi)", 50, "red",
                              "Yurak ishemiyasi ehtimoli — shoshilinch baholash"))
    if "nafas_qisilishi" in symptoms:
        sev, pts = ("red", 35) if (spo2 is not None and spo2 < 94) else ("yellow", 15)
        factors.append(Factor("Nafas qisilishi", pts, sev, "Nafas olish qiyinlashgan"))
    if "harakat_kamaygan" in symptoms and pregnant:
        factors.append(Factor("Homila harakati kamaygan", 55, "red", "Shoshilinch akusher ko'rigi talab etiladi"))
    if "koz_parcha" in symptoms:
        factors.append(Factor("Ko'rish buzilishi", 25, "yellow", "Ko'z oldida parcha"))

    # Homilador + gipertenziya + preeklampsiya belgisi = preeklampsiya xavfi
    if pregnant and hypertensive:
        pe = symptoms & _PREECLAMPSIA_SYMPTOMS
        if pe:
            labels = ", ".join(SYMPTOMS[x] for x in sorted(pe))
            factors.append(Factor("Preeklampsiya belgilari", 50, "red", f"Gipertenziya + {labels}"))

    # Qolgan yengil belgilar
    seen = {"kokrak_ogrigi", "nafas_qisilishi", "harakat_kamaygan", "koz_parcha"}
    for x in symptoms - seen:
        factors.append(Factor(SYMPTOMS.get(x, x), 6, "yellow", "Bemor shikoyati"))

    # --- Zona hisoblash ---
    factors.sort(key=lambda f: f.points, reverse=True)
    score = sum(f.points for f in factors)
    has_red = any(f.severity == "red" for f in factors)
    _URGENT = {"Gipertonik kriz", "Og'ir gipertenziya", "Kislorod tanqisligi",
               "Ko'krak og'rig'i (yurak xavfi)", "Homila harakati kamaygan",
               "Preeklampsiya belgilari", "Og'ir anemiya", "Gipoglikemiya (past qand)",
               "Juda yuqori qand", "Yuqori isitma"}
    urgent = any(f.label in _URGENT for f in factors)

    if has_red or score >= 55:
        zone = "Qizil"
    elif score >= 22:
        zone = "Sariq"
    else:
        zone = "Yashil"

    return Assessment(zone=zone, score=score, urgent=urgent, factors=factors,
                      recommendation=_safe_recommendation(zone, factors))


def _safe_recommendation(zone: str, factors: list) -> str:
    """S4-xavfsiz: kuzatuv/triaj tili, dori/doza YO'Q."""
    labels = {f.label for f in factors}
    if zone == "Qizil":
        base = "Zudlik bilan shifokor/mutaxassisga yo'naltiring; bemorni kuzatuvsiz qoldirmang."
        if "Ko'krak og'rig'i (yurak xavfi)" in labels:
            base += " EKG va yurak markerlarini shoshilinch tekshiring."
        elif "Kislorod tanqisligi" in labels:
            base += " Kislorod saturatsiyasini uzluksiz kuzating."
        elif "Homila harakati kamaygan" in labels:
            base += " Homila harakati va yurak urishini shoshilinch tekshiring."
        elif any("gipertenziya" in x.lower() or "kriz" in x.lower() or "preeklampsiya" in x.lower() for x in labels):
            base += " Qon bosimini takroran o'lchang."
        return base
    if zone == "Sariq":
        return "24 soat ichida shifokor ko'rigidan o'tkazing va ko'rsatkichlarni qayta tekshiring."
    return "Rejali kuzatuvni davom ettiring; keyingi rejali ko'rik belgilangan muddatda."


if __name__ == "__main__":
    cases = [
        ("Yurak xavfi", {"bp_sys": 150, "bp_dia": 95, "pulse": 112, "spo2": 95}, ["kokrak_ogrigi"], ["Yurak ishemik kasalligi"]),
        ("Gipertonik kriz", {"bp_sys": 185, "bp_dia": 122, "pulse": 88}, ["bosh_ogrigi"], ["Surunkali gipertenziya"]),
        ("Diabet nazoratsiz", {"glucose": 14.2, "bp_sys": 138, "bp_dia": 86}, [], ["Qandli diabet (2-tip)"]),
        ("O'pka (past SpO₂)", {"spo2": 88, "pulse": 105, "temperature": 37.6}, ["nafas_qisilishi"], ["Bronxial astma"]),
        ("Past xavf", {"bp_sys": 122, "bp_dia": 78, "pulse": 72, "spo2": 98, "glucose": 5.0}, [], []),
    ]
    for name, v, s, c in cases:
        a = assess(v, s, c)
        print(f"\n=== {name} → {a.zone} (ball {a.score}, urgent={a.urgent}) ===")
        for f in a.factors:
            print(f"  • {f.label} (+{f.points}) — {f.detail}")
        print(f"  Tavsiya: {a.recommendation}")
