"""
Perinatal Monitoring + Digital Twin — Backend API (FastAPI + SQLite).

Ishga tushirish:
    ./.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
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
    p = Path(__file__).parent / ".env"
    if p.exists():
        for line in p.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


_load_env()

from sqlmodel import select
import risk_engine
import llm
import seed as seed_mod
from db import get_session, norm_phone
from models import (
    Staff, Patient, Encounter, Medication, Alert, Appointment, Report,
    TwinCheck, LifestyleLog, Notification, DoctorSlot,
)

seed_mod.seed()  # bazani yaratish + to'ldirish (bo'sh bo'lsa)

app = FastAPI(title="Perinatal Monitoring + Digital Twin API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_ORDER = {"Yashil": 0, "Sariq": 1, "Qizil": 2}


# ---------- serializatsiya ----------
def patient_dict(s, p: Patient) -> dict:
    encs = s.exec(select(Encounter).where(Encounter.patient_id == p.id).order_by(Encounter.id)).all()
    meds = s.exec(select(Medication).where(Medication.patient_id == p.id).order_by(Medication.id)).all()
    appts = s.exec(select(Appointment).where(Appointment.patient_id == p.id)).all()
    life = s.exec(select(LifestyleLog).where(LifestyleLog.patient_id == p.id).order_by(LifestyleLog.id.desc())).all()
    return {
        "id": p.id, "name": p.name, "age": p.age, "gestational_week": p.gestational_week,
        "phone": p.phone, "region": p.region, "conditions": p.conditions,
        "allergies": p.allergies, "history": p.history, "current_zone": p.current_zone,
        "updated_at": p.updated_at,
        "encounters": [{"ts": e.ts, "vitals": e.vitals, "symptoms": e.symptoms, "assessment": e.assessment} for e in encs],
        "medications": [{"id": m.mid, "name": m.name, "dose": m.dose, "schedule": m.schedule, "taken_today": m.taken_today} for m in meds],
        "appointments": [{"id": a.id, "doctor": a.doctor, "date": a.date, "time": a.time, "reason": a.reason, "status": a.status, "created_at": a.created_at} for a in appts],
        "lifestyle_log": [{"title": l.title, "ts": l.ts} for l in life],
    }


def alert_dict(a: Alert) -> dict:
    return {"id": a.id, "patient_id": a.patient_id, "patient_name": a.patient_name,
            "zone": a.zone, "reason": a.reason, "recommendation": a.recommendation,
            "created_at": a.created_at, "status": a.status, "urgent": a.urgent}


def _make_alert(p: Patient, a: dict) -> Alert:
    return Alert(id=str(uuid.uuid4())[:8], patient_id=p.id, patient_name=p.name,
                 zone=a["zone"], reason=a["factors"][0]["label"] if a["factors"] else "Xavf o'zgarishi",
                 recommendation=a["recommendation"], created_at=datetime.now().isoformat(timespec="minutes"),
                 status="ochiq", urgent=a["urgent"])


def _notify(s, audience: str, text: str, kind: str):
    s.add(Notification(audience=audience, text=text, kind=kind,
                       created_at=datetime.now().isoformat(timespec="minutes")))


# ================= AUTH =================
class LoginIn(BaseModel):
    phone: str


@app.post("/api/login")
def login(body: LoginIn):
    ph = norm_phone(body.phone)
    with get_session() as s:
        st = s.exec(select(Staff).where(Staff.phone == ph)).first()
        if st:
            return {"role": st.role, "name": st.name, "patient_id": None}
        for p in s.exec(select(Patient)).all():
            if norm_phone(p.phone) == ph:
                return {"role": "bemor", "name": p.name, "patient_id": p.id}
    raise HTTPException(404, "Bu raqam ro'yxatda yo'q")


@app.get("/api/demo-accounts")
def demo_accounts():
    with get_session() as s:
        p1 = s.get(Patient, "P001")
        return {"hamshira": "+998 90 111 22 33", "mutaxassis": "+998 90 222 33 44",
                "oilaviy": "+998 90 333 44 55",
                "bemor": (p1.phone if p1 else "") + " (Nasiba Karimova)"}


# ================= MONITORING (#9) =================
@app.get("/api/stats")
def stats():
    with get_session() as s:
        pats = s.exec(select(Patient)).all()
        zones = [p.current_zone for p in pats]
        return {"total": len(pats), "qizil": zones.count("Qizil"),
                "sariq": zones.count("Sariq"), "yashil": zones.count("Yashil"),
                "open_alerts": len(s.exec(select(Alert).where(Alert.status == "ochiq")).all()),
                "region": "Navoiy viloyati"}


@app.get("/api/patients")
def list_patients(zone: Optional[str] = None):
    with get_session() as s:
        pats = s.exec(select(Patient)).all()
        items = []
        for p in pats:
            if zone and p.current_zone != zone:
                continue
            last = s.exec(select(Encounter).where(Encounter.patient_id == p.id).order_by(Encounter.id.desc())).first()
            reason = last.assessment.get("factors", [])[:1] if last else []
            items.append({"id": p.id, "name": p.name, "age": p.age,
                          "gestational_week": p.gestational_week, "zone": p.current_zone,
                          "reason": reason, "updated_at": p.updated_at})
        items.sort(key=lambda x: (_ORDER.get(x["zone"], 9), x["updated_at"]), reverse=True)
        return items


@app.get("/api/patients/{pid}")
def get_patient(pid: str):
    with get_session() as s:
        p = s.get(Patient, pid)
        if not p:
            raise HTTPException(404, "Bemor topilmadi")
        return patient_dict(s, p)


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
    with get_session() as s:
        p = s.get(Patient, e.patient_id)
        if not p:
            raise HTTPException(404, "Bemor topilmadi")
        v = e.vitals.model_dump()
        a = risk_engine.assess(v, e.symptoms).to_dict()
        if e.use_llm:
            a["recommendation"] = llm.enrich_recommendation(a["zone"], a["factors"], a["recommendation"], e.lang)
        now = datetime.now().isoformat(timespec="minutes")
        s.add(Encounter(patient_id=p.id, ts=now, vitals=v, symptoms=e.symptoms, assessment=a))
        prev = p.current_zone
        p.current_zone = a["zone"]
        p.updated_at = now
        s.add(p)
        alert = None
        if a["zone"] == "Qizil" or _ORDER[a["zone"]] > _ORDER[prev]:
            al = _make_alert(p, a)
            s.add(al)
            _notify(s, "mutaxassis", f"{p.name}: {al.reason} ({a['zone']})", "alert")
            alert = alert_dict(al)
        s.commit()
        return {"assessment": a, "previous_zone": prev,
                "zone_changed": prev != a["zone"], "alert": alert}


@app.get("/api/alerts")
def list_alerts(status: Optional[str] = None):
    with get_session() as s:
        q = select(Alert).order_by(Alert.created_at.desc())
        alerts = s.exec(q).all()
        return [alert_dict(a) for a in alerts if not status or a.status == status]


@app.post("/api/alerts/{aid}/ack")
def ack_alert(aid: str):
    with get_session() as s:
        a = s.get(Alert, aid)
        if not a:
            raise HTTPException(404, "Ogohlantirish topilmadi")
        a.status = "ko'rildi"
        s.add(a)
        s.commit()
        return alert_dict(a)


# ================= DIGITAL TWIN (#12) =================
class TwinIn(BaseModel):
    patient_id: str
    drug: str
    dose: str = ""
    lang: str = "uz"


@app.post("/api/twin/evaluate")
def twin_evaluate(body: TwinIn):
    with get_session() as s:
        p = s.get(Patient, body.patient_id)
        if not p:
            raise HTTPException(404, "Bemor topilmadi")
        res = llm.twin_evaluate(patient_dict(s, p), body.drug, body.dose, body.lang)
        res["drug"], res["dose"] = body.drug, body.dose
        now = datetime.now().isoformat(timespec="minutes")
        res["evaluated_at"] = now
        s.add(TwinCheck(patient_id=p.id, drug=body.drug, dose=body.dose,
                        level=res["level"], summary=res["summary"],
                        warnings=res["warnings"], created_at=now))
        s.commit()
        return res


@app.get("/api/twin/lifestyle")
def twin_lifestyle(patient_id: str, lang: str = "uz"):
    with get_session() as s:
        p = s.get(Patient, patient_id)
        if not p:
            raise HTTPException(404, "Bemor topilmadi")
        return {"recommendations": llm.lifestyle_recommend(patient_dict(s, p), lang)}


class LifestyleAccept(BaseModel):
    patient_id: str
    title: str


@app.post("/api/twin/lifestyle/accept")
def lifestyle_accept(body: LifestyleAccept):
    with get_session() as s:
        p = s.get(Patient, body.patient_id)
        if not p:
            raise HTTPException(404, "Bemor topilmadi")
        now = datetime.now().isoformat(timespec="minutes")
        s.add(LifestyleLog(patient_id=p.id, title=body.title, ts=now))
        _notify(s, "mutaxassis", f"{p.name}: '{body.title}' tavsiyasini bajarmoqchi", "lifestyle")
        s.commit()
        return {"ok": True, "logged": {"title": body.title, "ts": now}}


# ================= BEMOR PORTALI =================
@app.get("/api/medications")
def get_medications(patient_id: str):
    with get_session() as s:
        meds = s.exec(select(Medication).where(Medication.patient_id == patient_id).order_by(Medication.id)).all()
        return [{"id": m.mid, "name": m.name, "dose": m.dose, "schedule": m.schedule, "taken_today": m.taken_today} for m in meds]


class MedToggle(BaseModel):
    patient_id: str
    med_id: str
    taken: bool


@app.post("/api/medications/toggle")
def toggle_medication(body: MedToggle):
    with get_session() as s:
        m = s.exec(select(Medication).where(Medication.patient_id == body.patient_id, Medication.mid == body.med_id)).first()
        if not m:
            raise HTTPException(404, "Dori topilmadi")
        m.taken_today = body.taken
        s.add(m)
        s.commit()
        return {"id": m.mid, "name": m.name, "dose": m.dose, "schedule": m.schedule, "taken_today": m.taken_today}


def _appt_dict(a: Appointment) -> dict:
    return {"id": a.id, "patient_id": a.patient_id, "patient_name": a.patient_name,
            "doctor": a.doctor, "date": a.date, "time": a.time, "reason": a.reason,
            "status": a.status, "created_at": a.created_at}


@app.get("/api/doctors")
def list_doctors():
    with get_session() as s:
        docs = s.exec(select(Staff).where(Staff.role.in_(["mutaxassis", "oilaviy"]))).all()
        return [{"name": d.name, "role": d.role} for d in docs]


@app.get("/api/slots")
def get_slots(doctor: str, date: str):
    with get_session() as s:
        slots = s.exec(select(DoctorSlot).where(DoctorSlot.doctor == doctor, DoctorSlot.date == date).order_by(DoctorSlot.time)).all()
        return [{"time": sl.time, "is_booked": sl.is_booked} for sl in slots]


@app.get("/api/appointments")
def get_appointments(patient_id: str):
    with get_session() as s:
        appts = s.exec(select(Appointment).where(Appointment.patient_id == patient_id).order_by(Appointment.created_at.desc())).all()
        return [_appt_dict(a) for a in appts]


@app.get("/api/doctor/appointments")
def doctor_appointments(doctor: str, date: Optional[str] = None):
    with get_session() as s:
        q = select(Appointment).where(Appointment.doctor == doctor)
        appts = s.exec(q).all()
        if date:
            appts = [a for a in appts if a.date == date]
        appts.sort(key=lambda a: (a.date, a.time))
        return [_appt_dict(a) for a in appts]


class AppointmentIn(BaseModel):
    patient_id: str
    doctor: str
    date: str
    time: str = ""
    reason: str = ""


@app.post("/api/appointments")
def create_appointment(body: AppointmentIn):
    with get_session() as s:
        p = s.get(Patient, body.patient_id)
        if not p:
            raise HTTPException(404, "Bemor topilmadi")
        # slotni band qilish
        if body.time:
            slot = s.exec(select(DoctorSlot).where(
                DoctorSlot.doctor == body.doctor, DoctorSlot.date == body.date,
                DoctorSlot.time == body.time)).first()
            if not slot or slot.is_booked:
                raise HTTPException(409, "Bu vaqt allaqachon band")
            slot.is_booked = True
            s.add(slot)
        ap = Appointment(id=str(uuid.uuid4())[:8], patient_id=p.id, patient_name=p.name,
                         doctor=body.doctor, date=body.date, time=body.time, reason=body.reason,
                         status="so'ralgan", created_at=datetime.now().isoformat(timespec="minutes"))
        s.add(ap)
        _notify(s, "mutaxassis", f"{p.name}: {body.doctor} qabuliga yozildi ({body.date} {body.time})", "appointment")
        s.commit()
        return _appt_dict(ap)


class ApptStatus(BaseModel):
    status: str


@app.post("/api/appointments/{aid}/status")
def set_appointment_status(aid: str, body: ApptStatus):
    with get_session() as s:
        a = s.get(Appointment, aid)
        if not a:
            raise HTTPException(404, "Qabul topilmadi")
        a.status = body.status
        s.add(a)
        _notify(s, a.patient_id, f"Qabulingiz holati: {body.status} ({a.date} {a.time})", "appointment")
        s.commit()
        return _appt_dict(a)


class ReportIn(BaseModel):
    patient_id: str
    note: str
    symptoms: list[str] = []


@app.post("/api/reports")
def create_report(body: ReportIn):
    with get_session() as s:
        p = s.get(Patient, body.patient_id)
        if not p:
            raise HTTPException(404, "Bemor topilmadi")
        rep = Report(id=str(uuid.uuid4())[:8], patient_id=p.id, patient_name=p.name,
                     note=body.note, symptoms=body.symptoms, status="yangi",
                     created_at=datetime.now().isoformat(timespec="minutes"))
        s.add(rep)
        _notify(s, "mutaxassis", f"{p.name}: ahvol haqida xabar", "report")
        s.commit()
        return {"id": rep.id, "note": rep.note, "symptoms": rep.symptoms, "created_at": rep.created_at}
