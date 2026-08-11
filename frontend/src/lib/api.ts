import type {
  Stats, PatientListItem, Patient, Alert, Assessment, Vitals, Zone,
  Medication, LifestyleRec, TwinResult, Appointment, LoginResult, Doctor, Slot,
  Notif, ReportItem, Adherence,
} from './types'

const BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

async function j<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, opts)
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`)
  return r.json() as Promise<T>
}
function post<T>(path: string, body: any): Promise<T> {
  return j<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export interface EncounterResult {
  assessment: Assessment
  previous_zone: Zone
  zone_changed: boolean
  alert: Alert | null
}

export const api = {
  // auth
  login: (phone: string) => post<LoginResult>('/api/login', { phone }),
  demoAccounts: () => j<Record<string, string>>('/api/demo-accounts'),

  // monitoring (#9)
  stats: () => j<Stats>('/api/stats'),
  patients: (zone?: string) =>
    j<PatientListItem[]>('/api/patients' + (zone ? `?zone=${encodeURIComponent(zone)}` : '')),
  patient: (id: string) => j<Patient>(`/api/patients/${id}`),
  addEncounter: (body: { patient_id: string; vitals: Vitals; symptoms: string[]; use_llm?: boolean; lang?: string }) =>
    post<EncounterResult>('/api/encounters', body),
  alerts: (status?: string) =>
    j<Alert[]>('/api/alerts' + (status ? `?status=${encodeURIComponent(status)}` : '')),
  ackAlert: (id: string, note = '') => post<Alert>(`/api/alerts/${id}/ack`, { note }),
  discharge: (patient_id: string) => post<Alert>('/api/discharge', { patient_id }),

  // digital twin (#12)
  twinEvaluate: (patient_id: string, drug: string, dose: string, lang = 'uz') =>
    post<TwinResult>('/api/twin/evaluate', { patient_id, drug, dose, lang }),
  lifestyle: (patient_id: string, lang = 'uz') =>
    j<{ recommendations: LifestyleRec[] }>(`/api/twin/lifestyle?patient_id=${patient_id}&lang=${lang}`),
  lifestyleAccept: (patient_id: string, title: string) =>
    post<{ ok: boolean }>('/api/twin/lifestyle/accept', { patient_id, title }),

  // patient portal
  medications: (patient_id: string) =>
    j<Medication[]>(`/api/medications?patient_id=${patient_id}`),
  toggleMedication: (patient_id: string, med_id: string, taken: boolean) =>
    post<Medication>('/api/medications/toggle', { patient_id, med_id, taken }),
  appointments: (patient_id: string) =>
    j<Appointment[]>(`/api/appointments?patient_id=${patient_id}`),
  doctors: () => j<Doctor[]>('/api/doctors'),
  slots: (doctor: string, date: string) =>
    j<Slot[]>(`/api/slots?doctor=${encodeURIComponent(doctor)}&date=${date}`),
  createAppointment: (patient_id: string, doctor: string, date: string, time: string, reason: string) =>
    post<Appointment>('/api/appointments', { patient_id, doctor, date, time, reason }),
  doctorAppointments: (doctor: string) =>
    j<Appointment[]>(`/api/doctor/appointments?doctor=${encodeURIComponent(doctor)}`),
  setApptStatus: (id: string, status: string) =>
    post<Appointment>(`/api/appointments/${id}/status`, { status }),
  createReport: (patient_id: string, note: string, symptoms: string[]) =>
    post<any>('/api/reports', { patient_id, note, symptoms }),

  // FAZA 3: to'liq halqa
  notifications: (audience: string) =>
    j<{ items: Notif[]; unread: number }>(`/api/notifications?audience=${encodeURIComponent(audience)}`),
  readNotifications: (audience: string) =>
    post<{ ok: boolean }>('/api/notifications/read', { audience }),
  reports: () => j<ReportItem[]>('/api/reports'),
  replyReport: (id: string, reply: string) =>
    post<{ ok: boolean }>(`/api/reports/${id}/reply`, { reply }),
  adherence: () => j<Adherence[]>('/api/adherence'),

  // FAZA 4: #12 to'liq halqa
  prescribe: (patient_id: string, name: string, dose: string, schedule: string) =>
    post<Medication>('/api/prescriptions', { patient_id, name, dose, schedule }),
  trajectory: (patient_id: string) =>
    j<{ points: { label: string; value: number }[]; adherence: number }>(`/api/twin/trajectory?patient_id=${patient_id}`),
}
