# Perinatal Monitoring System

Ona va chaqaloq salomatligini real-vaqt monitoring qiluvchi platforma — homilador
ayollarni **Qizil / Sariq / Yashil** zonalarga ajratib, xavf yomonlashganda OvaBMU
mutaxassisiga avtomatik ogohlantirish yuboradi.

**Hakaton:** Umummilliy AI Xakaton — Navoiy bosqichi · Tibbiyot treki (#9 + #10 + #11)

> **Pozitsiya:** biz yangi EHR qurmayapmiz. DMED (davlat tizimi) ustiga qo'yiladigan
> **bashorat + monitoring qatlami**miz. Hozir DMED tuzilishiga mos **sintetik data**
> ustida ishlaydi; integratsiya — e'lon qilinadigan reja.
>
> **S4 (yuridik):** tizim QAROR QO'LLAB-QUVVATLASH yordamchisi. Dori/doza belgilamaydi —
> faqat kuzatuv/triaj tavsiyasi beradi. Yakuniy qaror shifokorda.

## Arxitektura

```
#10 Hamshira kiritish  →  #9 AI xavf-dvigatel  →  #11 Follow-up (oilaviy shifokor)
(mobil, oflayn)           (qoida + ball + LLM)     (avto "aktiv chaqiruv")
        └──────────── umumiy data + umumiy AI miya ────────────┘
```

## Backend (tayyor, ishlaydi)

```
backend/
  risk_engine.py   # #9 yadrosi: qoida + og'irlikli ball + tushuntirish (S4-xavfsiz)
  synthetic.py     # DMED-yaqin sintetik bemorlar (demo data)
  llm.py           # provayder-agnostik LLM (Groq/Claude/OpenAI-mos), fallback bilan
  main.py          # FastAPI: patients / encounters / alerts / stats
```

### Ishga tushirish
```bash
cd backend
python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn main:app --reload --port 8000
# Hujjatlar: http://localhost:8000/docs
```

### LLM ulash (ixtiyoriy, tavsiyani boyitadi)
`.env.example` ni `.env` ga nusxalab, kalit qo'ying (Groq bepul yoki Claude).
Kalit bo'lmasa — qoida asosidagi xavfsiz tavsiya bilan ishlayveradi.

### Asosiy endpointlar
| Metod | Yo'l | Vazifa |
|---|---|---|
| GET | `/api/stats` | Dashboard KPI (jami, zonalar, alertlar) |
| GET | `/api/patients?zone=` | Bemorlar ro'yxati (zona bo'yicha) |
| GET | `/api/patients/{id}` | Bemor + ko'rik tarixi |
| POST | `/api/encounters` | Yangi ko'rik → AI baholash → alert |
| GET | `/api/alerts` | Ogohlantirishlar |
| POST | `/api/alerts/{id}/ack` | Ogohlantirishni ko'rildi qilish |

## Frontend
Dizayn Figma Make'da tayyor (3 rol: Hamshira / Mutaxassis / Oilaviy shifokor).
Next.js'ga ko'chirilib, yuqoridagi API'ga ulanadi → keyin Capacitor bilan APK/iOS.

## Jamoa vazifalari (CP1 gacha)
- [ ] LLM API kaliti (Groq bepul yoki Claude) → `backend/.env`
- [ ] Figma dizayn tuzatishlari: "Navoiy viloyati"; AI tavsiyasidan dori/doza olib tashlash
- [ ] Frontend'ni API'ga ulash
- [ ] GitHub repo (CP2 uchun majburiy)
- [ ] Biznes: moliyaviy model + pitch (biznes mentor uchun)
