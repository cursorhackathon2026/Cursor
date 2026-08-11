import type { Stats, PatientListItem, Patient, Alert, Assessment, Vitals } from './types'

const BASE =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

async function j<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, opts)
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`)
  return r.json() as Promise<T>
}

export interface EncounterResult {
  assessment: Assessment
  previous_zone: Zone_
  zone_changed: boolean
  alert: Alert | null
}
type Zone_ = 'Qizil' | 'Sariq' | 'Yashil'

export const api = {
  stats: () => j<Stats>('/api/stats'),
  patients: (zone?: string) =>
    j<PatientListItem[]>('/api/patients' + (zone ? `?zone=${encodeURIComponent(zone)}` : '')),
  patient: (id: string) => j<Patient>(`/api/patients/${id}`),
  addEncounter: (body: { patient_id: string; vitals: Vitals; symptoms: string[]; use_llm?: boolean }) =>
    j<EncounterResult>('/api/encounters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  alerts: (status?: string) =>
    j<Alert[]>('/api/alerts' + (status ? `?status=${encodeURIComponent(status)}` : '')),
  ackAlert: (id: string) => j<Alert>(`/api/alerts/${id}/ack`, { method: 'POST' }),
}
