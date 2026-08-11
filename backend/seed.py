"""Bazani sintetik ma'lumot bilan to'ldirish (faqat bo'sh bo'lsa)."""
import uuid
import random
from datetime import datetime, timedelta
from sqlmodel import select

import synthetic
from db import engine, init_db, norm_phone
from sqlmodel import Session
from models import (
    Staff, Patient, Encounter, Medication, Alert, DoctorSlot,
)

STAFF = [
    {"phone": "901112233", "role": "hamshira", "name": "Zulfiya Sobirova"},
    {"phone": "902223344", "role": "mutaxassis", "name": "Dr. Aziz Nazarov"},
    {"phone": "903334455", "role": "oilaviy", "name": "Dr. Nodira Tursunova"},
]
BOOKING_DOCTORS = ["Dr. Aziz Nazarov", "Dr. Nodira Tursunova"]


def _alert(p, a):
    return Alert(
        id=str(uuid.uuid4())[:8], patient_id=p.id, patient_name=p.name,
        zone=a["zone"],
        reason=a["factors"][0]["label"] if a["factors"] else "Xavf o'zgarishi",
        recommendation=a["recommendation"],
        created_at=datetime.now().isoformat(timespec="minutes"),
        status="ochiq", urgent=a["urgent"],
    )


def _seed_slots(s: Session):
    """Har shifokorga keyingi 5 kun uchun 09:00–16:30 (30 daq) slotlar."""
    random.seed(7)
    today = datetime.now().date()
    times = []
    h, m = 9, 0
    while h < 17:
        times.append(f"{h:02d}:{m:02d}")
        m += 30
        if m == 60:
            m = 0; h += 1
    for doc in BOOKING_DOCTORS:
        for d in range(5):
            date = (today + timedelta(days=d)).isoformat()
            for tm in times:
                s.add(DoctorSlot(doctor=doc, date=date, time=tm,
                                 is_booked=random.random() < 0.35))


def seed():
    init_db()
    with Session(engine) as s:
        if s.exec(select(Patient)).first():
            return  # allaqachon to'ldirilgan
        for st in STAFF:
            s.add(Staff(**st))
        data = synthetic.seed()
        for p in data.values():
            s.add(Patient(
                id=p["id"], name=p["name"], age=p["age"],
                gestational_week=p["gestational_week"], phone=p["phone"],
                region=p["region"], conditions=p["conditions"],
                allergies=p["allergies"], history=p["history"],
                current_zone=p["current_zone"], updated_at=p["updated_at"],
            ))
            for e in p["encounters"]:
                s.add(Encounter(patient_id=p["id"], ts=e["ts"], vitals=e["vitals"],
                                symptoms=e["symptoms"], assessment=e["assessment"]))
            for m in p["medications"]:
                s.add(Medication(patient_id=p["id"], mid=m["id"], name=m["name"],
                                 dose=m["dose"], schedule=m["schedule"],
                                 taken_today=m["taken_today"]))
            if p["current_zone"] == "Qizil":
                s.add(_alert(_P(p), p["encounters"][-1]["assessment"]))
        _seed_slots(s)
        s.commit()


class _P:
    """_alert uchun yengil obyekt (id, name)."""
    def __init__(self, d):
        self.id = d["id"]; self.name = d["name"]


if __name__ == "__main__":
    seed()
    from sqlmodel import Session as _S
    with _S(engine) as s:
        print("patients:", len(s.exec(select(Patient)).all()))
        print("staff:", len(s.exec(select(Staff)).all()))
        print("slots:", len(s.exec(select(DoctorSlot)).all()))
        print("alerts:", len(s.exec(select(Alert)).all()))
