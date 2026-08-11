"""SQLModel jadvallari — barcha rollar bitta baza ustida ishlaydi."""
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class Staff(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone: str = Field(index=True)   # normalizatsiya qilingan (oxirgi 9 raqam)
    role: str                        # hamshira | mutaxassis | oilaviy
    name: str


class Patient(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    age: int
    gestational_week: int
    phone: str = Field(index=True)   # normalizatsiya qilingan
    region: str = "Navoiy viloyati"
    conditions: list = Field(default_factory=list, sa_column=Column(JSON))
    allergies: list = Field(default_factory=list, sa_column=Column(JSON))
    history: list = Field(default_factory=list, sa_column=Column(JSON))
    current_zone: str = "Yashil"
    updated_at: str = ""


class Encounter(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    ts: str
    vitals: dict = Field(default_factory=dict, sa_column=Column(JSON))
    symptoms: list = Field(default_factory=list, sa_column=Column(JSON))
    assessment: dict = Field(default_factory=dict, sa_column=Column(JSON))


class Medication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    mid: str
    name: str
    dose: str
    schedule: str
    taken_today: bool = False


class Alert(SQLModel, table=True):
    id: str = Field(primary_key=True)
    patient_id: str
    patient_name: str
    zone: str
    reason: str
    recommendation: str
    created_at: str
    status: str = "ochiq"
    urgent: bool = False


class DoctorSlot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    doctor: str = Field(index=True)   # shifokor ismi
    date: str = Field(index=True)     # YYYY-MM-DD
    time: str                         # HH:MM
    is_booked: bool = False


class Appointment(SQLModel, table=True):
    id: str = Field(primary_key=True)
    patient_id: str = Field(index=True)
    patient_name: str = ""
    doctor: str = ""
    date: str
    time: str = ""
    reason: str = ""
    status: str = "so'ralgan"         # so'ralgan | tasdiqlangan | bajarilgan
    created_at: str = ""


class Report(SQLModel, table=True):
    id: str = Field(primary_key=True)
    patient_id: str = Field(index=True)
    patient_name: str = ""
    note: str = ""
    symptoms: list = Field(default_factory=list, sa_column=Column(JSON))
    created_at: str = ""
    status: str = "yangi"


class TwinCheck(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    drug: str
    dose: str = ""
    level: str = ""
    summary: str = ""
    warnings: list = Field(default_factory=list, sa_column=Column(JSON))
    created_at: str = ""


class LifestyleLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    title: str
    ts: str


class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    audience: str = Field(index=True)   # rol nomi yoki patient_id
    text: str = ""
    kind: str = ""                      # appointment | report | alert | prescription ...
    created_at: str = ""
    read: bool = False
