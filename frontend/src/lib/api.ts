import type {
  Stats, PatientListItem, Patient, Alert, Assessment, Vitals, Zone,
  Medication, LifestyleRec, TwinResult, Appointment, LoginResult,
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
  addEncounter: (body: { patient_id: string; vitals: Vitals; symptoms: string[]; use_llm?: boolean }) =>
    post<EncounterResult>('/api/encounters', body),
  alerts: (status?: string) =>
    j<Alert[]>('/api/alerts' + (status ? `?status=${encodeURIComponent(status)}` : '')),
  ackAlert: (id: string) => post<Alert>(`/api/alerts/${id}/ack`, {}),

  // digital twin (#12)
  twinEvaluate: (patient_id: string, drug: string, dose: string) =>
    post<TwinResult>('/api/twin/evaluate', { patient_id, drug, dose }),
  lifestyle: (patient_id: string) =>
    j<{ recommendations: LifestyleRec[] }>(`/api/twin/lifestyle?patient_id=${patient_id}`),
  lifestyleAccept: (patient_id: string, title: string) =>
    post<{ ok: boolean }>('/api/twin/lifestyle/accept', { patient_id, title }),

  // patient portal
  medications: (patient_id: string) =>
    j<Medication[]>(`/api/medications?patient_id=${patient_id}`),
  toggleMedication: (patient_id: string, med_id: string, taken: boolean) =>
    post<Medication>('/api/medications/toggle', { patient_id, med_id, taken }),
  appointments: (patient_id: string) =>
    j<Appointment[]>(`/api/appointments?patient_id=${patient_id}`),
  createAppointment: (patient_id: string, date: string, reason: string) =>
    post<Appointment>('/api/appointments', { patient_id, date, reason }),
  createReport: (patient_id: string, note: string, symptoms: string[]) =>
    post<any>('/api/reports', { patient_id, note, symptoms }),
}
