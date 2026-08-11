"""
Klinik bilim bazasi (demo/MVP) — kasallik → standart davolash va 5 yillik prognoz.

Bu MODUL DARSLIK darajasidagi umumiy sxemalar; real retsept EMAS. Har doim
shifokor tasdiqlaydi (S4: inson-halqada). LLM shu bazani boyitadi, LLM bo'lmasa
ayni shu baza fallback bo'lib ishlaydi — shuning uchun ilova AIsiz ham to'liq.

Har davolash bandi: {kind, name, dose, schedule, rationale}
  kind: dori (ichimlik) | ukol (in'yeksiya) | osma (venaga) | ingalyator
"""

# kasallik (kalit so'z) -> davolash bandlari
TREATMENTS = {
    "gipertenziya": [
        {"kind": "dori", "name": "Amlodipin", "dose": "5 mg", "schedule": "1 marta/kun (ertalab)",
         "rationale": "Kalsiy kanali blokatori — tomirlarni kengaytirib qon bosimini bosqichma-bosqich pasaytiradi."},
        {"kind": "dori", "name": "Lizinopril", "dose": "10 mg", "schedule": "1 marta/kun",
         "rationale": "APF ingibitori — bosimni pasaytiradi va yurak/buyrakni uzoq muddat himoya qiladi."},
    ],
    "diabet": [
        {"kind": "dori", "name": "Metformin", "dose": "500 mg", "schedule": "2 marta/kun (ovqatdan keyin)",
         "rationale": "2-tip diabetда birinchi qatordagi dori — jigarda qand ishlab chiqarishini kamaytiradi, gipoglikemiya xavfi past."},
    ],
    "yurak ishemik": [
        {"kind": "dori", "name": "Atorvastatin", "dose": "20 mg", "schedule": "1 marta/kun (kechqurun)",
         "rationale": "Xolesterinni pasaytirib, tomirlardagi yog' pilakchalarini barqarorlashtiradi — infarkt xavfini kamaytiradi."},
        {"kind": "dori", "name": "Aspirin (kardio)", "dose": "75 mg", "schedule": "1 marta/kun (ovqatdan keyin)",
         "rationale": "Qon ivishini kamaytirib, koronar tomir bloklanishining oldini oladi."},
        {"kind": "dori", "name": "Bisoprolol", "dose": "5 mg", "schedule": "1 marta/kun (ertalab)",
         "rationale": "Beta-blokator — yurak urish tezligi va yukini kamaytiradi, angina xurujini siyraklashtiradi."},
    ],
    "yurak yetishmovchiligi": [
        {"kind": "dori", "name": "Furosemid", "dose": "40 mg", "schedule": "1 marta/kun (ertalab)",
         "rationale": "Diuretik — ortiqcha suyuqlikni chiqarib shish va nafas qisilishini kamaytiradi."},
        {"kind": "dori", "name": "Lizinopril", "dose": "5 mg", "schedule": "1 marta/kun",
         "rationale": "Yurak yukini kamaytirib, yetishmovchilik zo'rayishini sekinlashtiradi."},
    ],
    "astma": [
        {"kind": "ingalyator", "name": "Budesonid (ingalyator)", "dose": "200 mkg", "schedule": "2 marta/kun",
         "rationale": "Ingalyatsion glyukokortikoid — bronxlardagi yallig'lanishni bosib, hurujlar oldini oladi (profilaktika)."},
        {"kind": "ingalyator", "name": "Salbutamol (ingalyator)", "dose": "2 puf", "schedule": "zarurat bo'lganda",
         "rationale": "Tez ta'sirli bronxkengaytiruvchi — huruj boshlanganda nafasni yengillashtiradi."},
    ],
    "opka": [
        {"kind": "ingalyator", "name": "Tiotropiy (ingalyator)", "dose": "18 mkg", "schedule": "1 marta/kun",
         "rationale": "Uzoq ta'sirli bronxkengaytiruvchi — SOPKда nafas yo'llarini ochiq tutadi."},
    ],
    "buyrak": [
        {"kind": "dori", "name": "Lizinopril", "dose": "5 mg", "schedule": "1 marta/kun",
         "rationale": "Buyrak filtratsiyasini himoya qiladi, oqsil yo'qotilishini kamaytiradi. NPVP dorilardan saqlaning."},
    ],
    "anemiya": [
        {"kind": "dori", "name": "Temir (III) preparati", "dose": "100 mg", "schedule": "1 marta/kun (och qoringa)",
         "rationale": "Temir zaxirasini to'ldirib gemoglobinni tiklaydi; C vitamini bilan yaxshi so'riladi."},
    ],
    "gipotireoz": [
        {"kind": "dori", "name": "Levotiroksin", "dose": "50 mkg", "schedule": "1 marta/kun (ertalab och qoringa)",
         "rationale": "Qalqonsimon bez gormoni o'rnini bosadi — modda almashinuvini normallashtiradi."},
    ],
    "giperxolester": [
        {"kind": "dori", "name": "Rozuvastatin", "dose": "20 mg", "schedule": "1 marta/kun (kechqurun)",
         "rationale": "Statin — LDL xolesterinni kuchli pasaytiradi; irsiy giperxolesterinemiyaда erta boshlanadi."},
    ],
    "giperlipidemiya": [
        {"kind": "dori", "name": "Atorvastatin", "dose": "10 mg", "schedule": "1 marta/kun (kechqurun)",
         "rationale": "Xolesterinni pasaytirib ateroskleroz rivojlanishini sekinlashtiradi."},
    ],
    "podagra": [
        {"kind": "dori", "name": "Allopurinol", "dose": "100 mg", "schedule": "1 marta/kun (ovqatdan keyin)",
         "rationale": "Siydik kislotasi ishlab chiqarilishini kamaytirib, podagra xurujlari oldini oladi."},
    ],
    "osteoartroz": [
        {"kind": "dori", "name": "Paratsetamol", "dose": "500 mg", "schedule": "kuniga 3 martagacha (zarurat)",
         "rationale": "Bo'g'im og'rig'ini kamaytiradi; oshqozon uchun NPVPga qaraganda xavfsizroq."},
    ],
    "gerd": [
        {"kind": "dori", "name": "Omeprazol", "dose": "20 mg", "schedule": "1 marta/kun (ertalab och qoringa)",
         "rationale": "Proton nasosi ingibitori — oshqozon kislotasini kamaytirib jizzillashni bartaraf etadi."},
    ],
    "homilador": [
        {"kind": "dori", "name": "Metildopa", "dose": "250 mg", "schedule": "2 marta/kun",
         "rationale": "Homiladorlikда qon bosimini pasaytirish uchun xavfsiz deb tan olingan preparat."},
        {"kind": "dori", "name": "Foliy kislotasi", "dose": "400 mkg", "schedule": "1 marta/kun",
         "rationale": "Homila nerv nayi nuqsonlari xavfini kamaytiradi."},
    ],
}

# davolashда qo'shimcha (og'ir holatда) venaga/in'yeksiya
ESCALATION = {
    "anemiya": {"kind": "osma", "name": "Temir (venaga)", "dose": "200 mg", "schedule": "shifoxonada, 1 marta",
                "rationale": "Hb juda past yoki ichimlik temir yetarli bo'lmasa — venaga temir tez tiklaydi."},
    "diabet": {"kind": "ukol", "name": "Insulin (bazal)", "dose": "10 birlik", "schedule": "kechqurun",
               "rationale": "Qand tabletkalar bilan nazoratsiz bo'lsa — bazal insulin bilan barqarorlashtiriladi."},
}

# allergiya -> mos kelmaydigan dori kalit so'zlari
ALLERGY_CONFLICTS = {
    "penitsillin": ["penitsillin", "amoksitsillin", "ampitsillin", "augmentin"],
    "aspirin": ["aspirin"],
    "sulfanilamid": ["sulfanilamid", "ko-trimoksazol", "biseptol"],
    "npvp": ["ibuprofen", "diklofenak", "naproksen", "aspirin"],
    "yod": ["yod", "kontrast"],
}

# 5 yillik prognoz maslahatlari: kasallik -> ehtimoliy kelajak asoratlari
PROGNOSIS = {
    "gipertenziya": [
        {"cond": "Yurak ishemik kasalligi", "when": "3–5 yil", "risk": "yuqori",
         "why": "Uzoq davom etgan yuqori bosim koronar tomirlarni zararlaydi.",
         "prevent": "Bosimni <140/90 tutish, tuzni cheklash, statin (ko'rsatilsa)."},
        {"cond": "Insult (miya qon aylanishi buzilishi)", "when": "3–5 yil", "risk": "o'rta",
         "why": "Nazoratsiz bosim miya tomirlari yorilishi/tiqilishi xavfini oshiradi.",
         "prevent": "Muntazam bosim nazorati va dori rejimiga rioya."},
        {"cond": "Surunkali buyrak kasalligi", "when": "5 yil", "risk": "o'rta",
         "why": "Yuqori bosim buyrak filtrlarini asta-sekin shikastlaydi.",
         "prevent": "Yillik kreatinin/siydik oqsili tekshiruvi."},
    ],
    "diabet": [
        {"cond": "Diabetik nefropatiya (buyrak)", "when": "3–5 yil", "risk": "yuqori",
         "why": "Yuqori qand buyrak kapillarlarini zararlaydi.",
         "prevent": "HbA1c <7%, yillik mikroalbumin testi."},
        {"cond": "Diabetik retinopatiya (ko'z)", "when": "3–5 yil", "risk": "o'rta",
         "why": "Qand ko'z to'r pardasi tomirlarini shikastlaydi.",
         "prevent": "Yillik ko'z ko'rigi, qand nazorati."},
        {"cond": "Yurak-tomir kasalligi", "when": "5 yil", "risk": "yuqori",
         "why": "Diabet ateroskleroz jarayonini tezlashtiradi.",
         "prevent": "Xolesterin va bosim nazorati, chekmaslik."},
    ],
    "giperlipidemiya": [
        {"cond": "Ateroskleroz / IHD", "when": "3–5 yil", "risk": "o'rta",
         "why": "Yuqori LDL tomir devorlarida yog' to'planishiga olib keladi.",
         "prevent": "Statin, kam yog'li parhez, harakat."},
    ],
    "giperxolester": [
        {"cond": "Erta yurak ishemik kasalligi", "when": "1–3 yil", "risk": "yuqori",
         "why": "Irsiy yuqori xolesterin tomirlarni erta zararlaydi.",
         "prevent": "Erta va doimiy statin, oila a'zolarini skrining."},
    ],
    "buyrak": [
        {"cond": "Buyrak yetishmovchiligi zo'rayishi", "when": "3–5 yil", "risk": "o'rta",
         "why": "Filtratsiya bosqichma-bosqich pasayishi mumkin.",
         "prevent": "Bosim nazorati, NPVP va nefrotoksik dorilardan saqlanish."},
        {"cond": "Anemiya", "when": "1–3 yil", "risk": "o'rta",
         "why": "Buyrak eritropoetin ishlab chiqarishini kamaytiradi.",
         "prevent": "Muntazam Hb nazorati."},
    ],
    "yurak ishemik": [
        {"cond": "Miokard infarkti", "when": "1–5 yil", "risk": "yuqori",
         "why": "Koronar tomir pilakchasi yorilishi mumkin.",
         "prevent": "Antiagregant, statin, bosim va qand nazorati."},
        {"cond": "Yurak yetishmovchiligi", "when": "3–5 yil", "risk": "o'rta",
         "why": "Yurak mushagi ishemiyadan zaiflashadi.",
         "prevent": "Dori rejimiga rioya, vazn nazorati."},
    ],
    "astma": [
        {"cond": "Surunkali obstruktiv o'pka kasalligi belgilari", "when": "5 yil", "risk": "past",
         "why": "Nazoratsiz yallig'lanish nafas yo'llarini doimiy toraytirishi mumkin.",
         "prevent": "Profilaktik ingalyatorga rioya, chekmaslik."},
    ],
    "anemiya": [
        {"cond": "Yurakka ortiqcha yuk", "when": "1–3 yil", "risk": "past",
         "why": "Uzoq anemiya yurakni ko'proq ishlashga majbur qiladi.",
         "prevent": "Temir zaxirasini tiklash, sababni aniqlash."},
    ],
    "gipotireoz": [
        {"cond": "Giperlipidemiya", "when": "1–3 yil", "risk": "o'rta",
         "why": "Yetarli davolanmagan gipotireoz xolesterinni oshiradi.",
         "prevent": "TSH nazorati, doza to'g'rilash."},
    ],
    "podagra": [
        {"cond": "Buyrak toshlari", "when": "3–5 yil", "risk": "o'rta",
         "why": "Yuqori siydik kislotasi buyrakda kristallanadi.",
         "prevent": "Ko'p suyuqlik, allopurinol, purinli ovqatni cheklash."},
    ],
}

# umumiy yosh omili (65+)
AGE_PROGNOSIS = {"cond": "Yiqilish va suyak sinishi xavfi", "when": "1–3 yil", "risk": "o'rta",
                 "why": "Yosh ortishi bilan muvozanat va suyak zichligi pasayadi.",
                 "prevent": "D vitamini, kaltsiy, uy xavfsizligi, harakat."}


def _keys(conditions):
    """Bemor kasalliklarini bilim-bazasi kalitlariга moslashtirish."""
    low = " ".join(conditions).lower()
    hit = []
    for k in TREATMENTS:
        if k in low:
            hit.append(k)
    return hit


def suggest_treatment(conditions, allergies=None):
    """Kasalliklarга qarab standart davolash rejasi (fallback / seed uchun)."""
    allergies = [a.lower() for a in (allergies or [])]
    items = []
    seen = set()
    for k in _keys(conditions):
        for it in TREATMENTS.get(k, []):
            key = it["name"].lower()
            if key in seen:
                continue
            # allergiya konflikti — bandni tashlab yuboramiz
            if _conflicts(it["name"], allergies):
                continue
            seen.add(key)
            items.append(dict(it))
    return items


def _conflicts(drug, allergies):
    d = drug.lower()
    for a in allergies:
        for group, names in ALLERGY_CONFLICTS.items():
            if group in a or a in group:
                if any(n in d for n in names):
                    return True
        if a and (a in d or d in a):
            return True
    return False


def allergy_conflicts(drug, allergies):
    """Dori berilgan allergiyalarga zid keladimi — ro'yxat qaytaradi."""
    hits = []
    for a in (allergies or []):
        if _conflicts(drug, [a.lower()]):
            hits.append(a)
    return hits


def prognosis(conditions, age=0):
    """5 yillik ehtimoliy asoratlar ro'yxati."""
    out = []
    seen = set()
    for k in _keys(conditions):
        for pr in PROGNOSIS.get(k, []):
            if pr["cond"] in seen:
                continue
            seen.add(pr["cond"])
            out.append(dict(pr))
    if age >= 65:
        out.append(dict(AGE_PROGNOSIS))
    # xavf bo'yicha tartiblash
    order = {"yuqori": 0, "o'rta": 1, "past": 2}
    out.sort(key=lambda x: order.get(x["risk"], 3))
    return out
