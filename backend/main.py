"""
Perinatal Monitoring — Backend API (FastAPI).

Ishga tushirish:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Hujjatlar:  http://localhost:8000/docs
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pathlib import Path
import os
import uuid


def _load_env():
    """.env faylini oddiy yuklash (dotenv dependency'siz)."""
    p = Path(__file__).parent / ".env"
    if p.exists():
        for line in p.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


_load_env()

import risk_engine
import synthetic
import llm

app = FastAPI(title="Perinatal Monitoring API")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# --- In-memory "DB" (demo) ---
PATIENTS = synthetic.seed()
ALERTS = []


def _make_alert(patient, assessment):
    return {
        "id": str(uuid.uuid4())[:8],
        "patient_id": patient["id"],
        "patient_name": patient["name"],
        "zone": assessment["zone"],
        "reason": assessment["factors"][0]["label"] if assessment["factors"] else "Xavf o'zgarishi",
        "recommendation": assessment["recommendation"],
        "created_at": datetime.now().isoformat(timespec="minutes"),
        "status": "ochiq",
        "urgent": assessment["urgent"],
    }


# Boshlang'ich alertlar (qizil bemorlar uchun)
for p in PATIENTS.values():
    last = p["encounters"][-1]["assessment"]
    if last["zone"] == "Qizil":
        ALERTS.append(_make_alert(p, last))


class Vitals(BaseModel):
    bp_sys: Optional[int] = None
    bp_dia: Optional[int] = None
    hemoglobin: Optional[int] = None
    glucose: Optional[float] = None
    weight: Optional[float] = None
    gestational_week: Optional[int] = None


class EncounterIn(BaseModel):
    patient_id: str
    vitals: Vitals
    symptoms: list[str] = []
    use_llm: bool = True   # LLM bilan tavsiyani boyitish (kalit bo'lsa)


@app.get("/api/stats")
def stats():
    zones = [p["current_zone"] for p in PATIENTS.values()]
    return {
        "total": len(PATIENTS),
        "qizil": zones.count("Qizil"),
        "sariq": zones.count("Sariq"),
        "yashil": zones.count("Yashil"),
        "open_alerts": sum(1 for a in ALERTS if a["status"] == "ochiq"),
        "region": "Navoiy viloyati",
    }


@app.get("/api/patients")
def list_patients(zone: Optional[str] = None):
    items = []
    for p in PATIENTS.values():
        if zone and p["current_zone"] != zone:
            continue
        items.append({
            "id": p["id"], "name": p["name"], "age": p["age"],
            "gestational_week": p["gestational_week"], "zone": p["current_zone"],
            "reason": p["encounters"][-1]["assessment"]["factors"][:1],
            "updated_at": p["updated_at"],
        })
    order = {"Qizil": 0, "Sariq": 1, "Yashil": 2}
    items.sort(key=lambda x: (order.get(x["zone"], 9), x["updated_at"]), reverse=False)
    return items


@app.get("/api/patients/{pid}")
def get_patient(pid: str):
    p = PATIENTS.get(pid)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    return p


@app.post("/api/encounters")
def add_encounter(e: EncounterIn):
    p = PATIENTS.get(e.patient_id)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")

    v = e.vitals.model_dump()
    a = risk_engine.assess(v, e.symptoms)
    a_dict = a.to_dict()

    # LLM bilan tavsiyani boyitish (kalit yo'q bo'lsa — o'zgarishsiz qoladi)
    if e.use_llm:
        a_dict["recommendation"] = llm.enrich_recommendation(
            a_dict["zone"], a_dict["factors"], a_dict["recommendation"])

    enc = {"ts": datetime.now().isoformat(timespec="minutes"),
           "vitals": v, "symptoms": e.symptoms, "assessment": a_dict}
    p["encounters"].append(enc)
    prev_zone = p["current_zone"]
    p["current_zone"] = a_dict["zone"]
    p["updated_at"] = enc["ts"]

    # Zona yomonlashsa yoki qizil bo'lsa — alert
    order = {"Yashil": 0, "Sariq": 1, "Qizil": 2}
    alert = None
    if a_dict["zone"] == "Qizil" or order[a_dict["zone"]] > order[prev_zone]:
        alert = _make_alert(p, a_dict)
        ALERTS.insert(0, alert)

    return {"assessment": a_dict, "previous_zone": prev_zone,
            "zone_changed": prev_zone != a_dict["zone"], "alert": alert}


@app.get("/api/alerts")
def list_alerts(status: Optional[str] = None):
    return [a for a in ALERTS if not status or a["status"] == status]


@app.post("/api/alerts/{aid}/ack")
def ack_alert(aid: str):
    for a in ALERTS:
        if a["id"] == aid:
            a["status"] = "ko'rildi"
            return a
    raise HTTPException(404, "Ogohlantirish topilmadi")
