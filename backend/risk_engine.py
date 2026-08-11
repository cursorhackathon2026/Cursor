"""
Perinatal xavf-dvigateli (#9 ning yuragi).

Gibrid yondashuv:
  1) Qoida dvigateli — akusherlikdagi isbotlangan "red-flag"lar (tushuntiriladigan, xavfsiz).
  2) Og'irlikli ball — har omil ballga qo'shiladi, umumiy ball zonaga aylanadi.
  3) Har javob TUSHUNTIRILADI (nega bu zona) — shifokor ko'radi.

MUHIM (S4): bu tizim QAROR QO'LLAB-QUVVATLASH yordamchisi. Dori/doza belgilamaydi —
faqat kuzatuv/triaj tavsiyasini beradi. Yakuniy qaror shifokorda qoladi.
"""
from dataclasses import dataclass, field, asdict
from typing import Optional

# Bemor belgilarining kalitlari (dizayndagi chiplarga mos)
SYMPTOMS = {
    "bosh_ogrigi": "Bosh og'rig'i",
    "koz_parcha": "Ko'z oldida parcha",
    "kongil_aynishi": "Ko'ngil aynishi",
    "shish": "Shish (qo'l/yuz)",
    "qorin_ogrigi": "Qorin og'rig'i",
    "harakat_kamaygan": "Homila harakati kamaygan",
}

# Preeklampsiyaga xos belgilar to'plami
_PREECLAMPSIA_SYMPTOMS = {"bosh_ogrigi", "koz_parcha", "qorin_ogrigi", "shish"}


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
    factors: list = field(default_factory=list)   # Factor lar, ball bo'yicha kamayuvchi
    recommendation: str = ""

    def to_dict(self):
        d = asdict(self)
        d["factors"] = [asdict(f) if not isinstance(f, dict) else f for f in self.factors]
        return d


def assess(vitals: dict, symptoms: Optional[list] = None) -> Assessment:
    """
    vitals: {bp_sys, bp_dia, hemoglobin, glucose, weight, gestational_week}  (har biri None bo'lishi mumkin)
    symptoms: SYMPTOMS kalitlari ro'yxati
    """
    symptoms = set(symptoms or [])
    factors: list[Factor] = []

    bp_sys = vitals.get("bp_sys")
    bp_dia = vitals.get("bp_dia")
    hb = vitals.get("hemoglobin")
    glu = vitals.get("glucose")

    # --- Qon bosimi ---
    hypertensive = False
    if bp_sys is not None and bp_dia is not None:
        if bp_sys >= 160 or bp_dia >= 110:
            factors.append(Factor("Og'ir gipertenziya", 60, "red",
                                  f"BP {bp_sys}/{bp_dia} mmHg (≥160/110)"))
            hypertensive = True
        elif bp_sys >= 140 or bp_dia >= 90:
            factors.append(Factor("Gipertenziya", 30, "yellow",
                                  f"BP {bp_sys}/{bp_dia} mmHg (≥140/90)"))
            hypertensive = True

    # --- Gemoglobin (anemiya) ---
    if hb is not None:
        if hb < 70:
            factors.append(Factor("Og'ir anemiya", 55, "red", f"Hb {hb} g/L (<70)"))
        elif hb < 100:
            factors.append(Factor("O'rtacha anemiya", 25, "yellow", f"Hb {hb} g/L (70–99)"))
        elif hb < 110:
            factors.append(Factor("Yengil anemiya", 10, "yellow", f"Hb {hb} g/L (100–109)"))

    # --- Glyukoza (gestatsion diabet) ---
    if glu is not None:
        if glu >= 7.0:
            factors.append(Factor("Yuqori glyukoza", 40, "red",
                                  f"Glyukoza {glu} mmol/L (≥7.0)"))
        elif glu >= 5.1:
            factors.append(Factor("Gestatsion diabet belgisi", 20, "yellow",
                                  f"Glyukoza {glu} mmol/L (≥5.1)"))

    # --- Belgilar ---
    # Homila harakati kamayishi — mustaqil shoshilinch red-flag
    if "harakat_kamaygan" in symptoms:
        factors.append(Factor("Homila harakati kamaygan", 55, "red",
                              "Shoshilinch akusher ko'rigi talab etiladi"))

    # Ko'rish buzilishi — kuchli xavf belgisi
    if "koz_parcha" in symptoms:
        factors.append(Factor("Ko'rish buzilishi", 30, "yellow", "Ko'z oldida parcha"))

    # Gipertenziya + preeklampsiya belgisi = preeklampsiya xavfi (Qizil)
    pe = symptoms & _PREECLAMPSIA_SYMPTOMS
    if hypertensive and pe:
        labels = ", ".join(SYMPTOMS[s] for s in sorted(pe))
        factors.append(Factor("Preeklampsiya belgilari", 50, "red",
                              f"Gipertenziya + {labels}"))

    # Qolgan yengil belgilar
    for s in symptoms - _PREECLAMPSIA_SYMPTOMS - {"harakat_kamaygan", "koz_parcha"}:
        factors.append(Factor(SYMPTOMS[s], 5, "yellow", "Bemor shikoyati"))

    # --- Zona hisoblash ---
    factors.sort(key=lambda f: f.points, reverse=True)
    score = sum(f.points for f in factors)
    has_red = any(f.severity == "red" for f in factors)
    urgent = any(f.label in ("Og'ir gipertenziya", "Homila harakati kamaygan",
                             "Preeklampsiya belgilari", "Og'ir anemiya") for f in factors)

    if has_red or score >= 55:
        zone = "Qizil"
    elif score >= 25:
        zone = "Sariq"
    else:
        zone = "Yashil"

    return Assessment(zone=zone, score=score, urgent=urgent,
                      factors=factors,
                      recommendation=_safe_recommendation(zone, factors, urgent))


def _safe_recommendation(zone: str, factors: list, urgent: bool) -> str:
    """S4-xavfsiz: kuzatuv/triaj tili, dori/doza YO'Q."""
    if zone == "Qizil":
        base = "Zudlik bilan OvaBMU mutaxassisiga yo'naltiring; bemorni kuzatuvsiz qoldirmang."
        if any(f.label == "Homila harakati kamaygan" for f in factors):
            base += " Homila harakati va yurak urishini shoshilinch tekshiring."
        elif any("gipertenziya" in f.label.lower() or "preeklampsiya" in f.label.lower()
                 for f in factors):
            base += " Qon bosimini takroran o'lchang."
        return base
    if zone == "Sariq":
        return "24 soat ichida shifokor ko'rigidan o'tkazing va ko'rsatkichlarni qayta tekshiring."
    return "Rejali kuzatuvni davom ettiring; keyingi rejali ko'rik belgilangan muddatda."


if __name__ == "__main__":
    # Smoke-test / demo
    cases = [
        ("Og'ir preeklampsiya", {"bp_sys": 165, "bp_dia": 112, "hemoglobin": 118, "glucose": 4.8},
         ["bosh_ogrigi", "koz_parcha"]),
        ("O'rtacha xavf", {"bp_sys": 138, "bp_dia": 88, "hemoglobin": 95, "glucose": 5.4}, []),
        ("Homila harakati", {"bp_sys": 120, "bp_dia": 75, "hemoglobin": 120, "glucose": 4.5},
         ["harakat_kamaygan"]),
        ("Past xavf", {"bp_sys": 118, "bp_dia": 74, "hemoglobin": 125, "glucose": 4.6}, []),
    ]
    for name, v, s in cases:
        a = assess(v, s)
        print(f"\n=== {name} → {a.zone} (ball {a.score}, urgent={a.urgent}) ===")
        for f in a.factors:
            print(f"  • {f.label} (+{f.points}) — {f.detail}")
        print(f"  Tavsiya: {a.recommendation}")
