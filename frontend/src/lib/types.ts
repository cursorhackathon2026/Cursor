export type Zone = 'Qizil' | 'Sariq' | 'Yashil'

export interface Factor {
  label: string
  points: number
  severity: 'red' | 'yellow'
  detail: string
}

export interface Assessment {
  zone: Zone
  score: number
  urgent: boolean
  factors: Factor[]
  recommendation: string
}

export interface Vitals {
  bp_sys?: number | null
  bp_dia?: number | null
  hemoglobin?: number | null
  glucose?: number | null
  weight?: number | null
  gestational_week?: number | null
}

export interface Encounter {
  ts: string
  vitals: Vitals
  symptoms: string[]
  assessment: Assessment
}

export interface PatientListItem {
  id: string
  name: string
  age: number
  gestational_week: number
  zone: Zone
  reason: Factor[]
  updated_at: string
}

export interface Patient {
  id: string
  name: string
  age: number
  gestational_week: number
  phone: string
  region: string
  encounters: Encounter[]
  current_zone: Zone
  updated_at: string
}

export interface Alert {
  id: string
  patient_id: string
  patient_name: string
  zone: Zone
  reason: string
  recommendation: string
  created_at: string
  status: string
  urgent: boolean
}

export interface Stats {
  total: number
  qizil: number
  sariq: number
  yashil: number
  open_alerts: number
  region: string
}
