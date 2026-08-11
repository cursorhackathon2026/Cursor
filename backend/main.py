"""
Perinatal Monitoring + Digital Twin — Backend API (FastAPI).

Ishga tushirish:
    ./.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Hujjatlar:  http://localhost:8000/docs
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pathlib import Path
import os
import re
import uuid


def _load_env():
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

app = FastAPI(title="Perinatal Monitoring + Digital Twin API")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# --- In-memory "DB" (demo) ---
PATIENTS = synthetic.seed()
ALERTS = []

# --- Xodimlar (telefon -> rol) ---
STAFF = {
    "901112233": {"role": "hamshira", "name": "Zulfiya Sobirova"},
    "902223344": {"role": "mutaxassis", "name": "Dr. Aziz Nazarov"},
    "903334455": {"role": "oilaviy", "name": "Dr. Nodira Tursunova"},
}


def _norm_phone(p: str) -> str:
    d = re.sub(r"\D", "", p or "")
    return d[-9:] if len(d) >= 9 else d


# Telefon -> patient_id indeksi
PHONE_TO_PID = {_norm_phone(p["phone"]): pid for pid, p in PATIENTS.items()}


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


for p in PATIENTS.values():
    if p["encounters"][-1]["assessment"]["zone"] == "Qizil":
        ALERTS.append(_make_alert(p, p["encounters"][-1]["assessment"]))


# ================= AUTH =================
class LoginIn(BaseModel):
    phone: str


@app.post("/api/login")
def login(body: LoginIn):
    ph = _norm_phone(body.phone)
    if ph in STAFF:
        s = STAFF[ph]
        return {"role": s["role"], "name": s["name"], "patient_id": None}
    if ph in PHONE_TO_PID:
        pid = PHONE_TO_PID[ph]
        return {"role": "bemor", "name": PATIENTS[pid]["name"], "patient_id": pid}
    raise HTTPException(404, "Bu raqam ro'yxatda yo'q")


@app.get("/api/demo-accounts")
def demo_accounts():
    """Demo uchun kirish raqamlari (login oynasida ko'rsatish uchun)."""
    return {
        "hamshira": "+998 90 111 22 33",
        "mutaxassis": "+998 90 222 33 44",
        "oilaviy": "+998 90 333 44 55",
        "bemor": PATIENTS["P001"]["phone"] + " (Nasiba Karimova)",
    }


# ================= DASHBOARD / MONITORING (#9) =================
@app.get("/api/stats")
def stats():
    zones = [p["current_zone"] for p in PATIENTS.values()]
    return {"total": len(PATIENTS), "qizil": zones.count("Qizil"),
            "sariq": zones.count("Sariq"), "yashil": zones.count("Yashil"),
            "open_alerts": sum(1 for a in ALERTS if a["status"] == "ochiq"),
            "region": "Navoiy viloyati"}


@app.get("/api/patients")
def list_patients(zone: Optional[str] = None):
    items = []
    for p in PATIENTS.values():
        if zone and p["current_zone"] != zone:
            continue
        items.append({"id": p["id"], "name": p["name"], "age": p["age"],
                      "gestational_week": p["gestational_week"], "zone": p["current_zone"],
                      "reason": p["encounters"][-1]["assessment"]["factors"][:1],
                      "updated_at": p["updated_at"]})
    order = {"Qizil": 0, "Sariq": 1, "Yashil": 2}
    items.sort(key=lambda x: (order.get(x["zone"], 9), x["updated_at"]))
    return items


@app.get("/api/patients/{pid}")
def get_patient(pid: str):
    p = PATIENTS.get(pid)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    return p


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
    use_llm: bool = True
    lang: str = "uz"


@app.post("/api/encounters")
def add_encounter(e: EncounterIn):
    p = PATIENTS.get(e.patient_id)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    v = e.vitals.model_dump()
    a = risk_engine.assess(v, e.symptoms).to_dict()
    if e.use_llm:
        a["recommendation"] = llm.enrich_recommendation(a["zone"], a["factors"], a["recommendation"], e.lang)
    enc = {"ts": datetime.now().isoformat(timespec="minutes"),
           "vitals": v, "symptoms": e.symptoms, "assessment": a}
    p["encounters"].append(enc)
    prev = p["current_zone"]
    p["current_zone"] = a["zone"]
    p["updated_at"] = enc["ts"]
    order = {"Yashil": 0, "Sariq": 1, "Qizil": 2}
    alert = None
    if a["zone"] == "Qizil" or order[a["zone"]] > order[prev]:
        alert = _make_alert(p, a)
        ALERTS.insert(0, alert)
    return {"assessment": a, "previous_zone": prev,
            "zone_changed": prev != a["zone"], "alert": alert}


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


# ================= DIGITAL TWIN (#12) =================
class TwinIn(BaseModel):
    patient_id: str
    drug: str
    dose: str = ""
    lang: str = "uz"


@app.post("/api/twin/evaluate")
def twin_evaluate(body: TwinIn):
    """Shifokor taklif qilgan dorini bemor egizagida baholash."""
    p = PATIENTS.get(body.patient_id)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    res = llm.twin_evaluate(p, body.drug, body.dose, body.lang)
    res["drug"] = body.drug
    res["dose"] = body.dose
    res["evaluated_at"] = datetime.now().isoformat(timespec="minutes")
    p.setdefault("twin_checks", []).insert(0, res)
    return res


@app.get("/api/twin/lifestyle")
def twin_lifestyle(patient_id: str, lang: str = "uz"):
    p = PATIENTS.get(patient_id)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    return {"recommendations": llm.lifestyle_recommend(p, lang)}


class LifestyleAccept(BaseModel):
    patient_id: str
    title: str


@app.post("/api/twin/lifestyle/accept")
def lifestyle_accept(body: LifestyleAccept):
    """Bemor "Sinab ko'raman" bosadi -> tarixga (va shifokorga) yoziladi."""
    p = PATIENTS.get(body.patient_id)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    entry = {"title": body.title, "ts": datetime.now().isoformat(timespec="minutes")}
    p["lifestyle_log"].insert(0, entry)
    return {"ok": True, "logged": entry}


# ================= BEMOR PORTALI =================
@app.get("/api/medications")
def get_medications(patient_id: str):
    p = PATIENTS.get(patient_id)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    return p["medications"]


class MedToggle(BaseModel):
    patient_id: str
    med_id: str
    taken: bool


@app.post("/api/medications/toggle")
def toggle_medication(body: MedToggle):
    p = PATIENTS.get(body.patient_id)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    for m in p["medications"]:
        if m["id"] == body.med_id:
            m["taken_today"] = body.taken
            return m
    raise HTTPException(404, "Dori topilmadi")


class AppointmentIn(BaseModel):
    patient_id: str
    date: str
    reason: str = ""


@app.get("/api/appointments")
def get_appointments(patient_id: str):
    p = PATIENTS.get(patient_id)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    return p["appointments"]


@app.post("/api/appointments")
def create_appointment(body: AppointmentIn):
    p = PATIENTS.get(body.patient_id)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    ap = {"id": str(uuid.uuid4())[:8], "date": body.date, "reason": body.reason,
          "status": "so'ralgan", "created_at": datetime.now().isoformat(timespec="minutes")}
    p["appointments"].insert(0, ap)
    return ap


class ReportIn(BaseModel):
    patient_id: str
    note: str
    symptoms: list[str] = []


@app.post("/api/reports")
def create_report(body: ReportIn):
    p = PATIENTS.get(body.patient_id)
    if not p:
        raise HTTPException(404, "Bemor topilmadi")
    rep = {"id": str(uuid.uuid4())[:8], "note": body.note, "symptoms": body.symptoms,
           "created_at": datetime.now().isoformat(timespec="minutes")}
    p["reports"].insert(0, rep)
    return rep
