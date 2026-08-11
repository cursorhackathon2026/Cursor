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
  pulse?: number | null
  spo2?: number | null
  temperature?: number | null
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
  gender?: string
  gestational_week: number
  zone: Zone
  conditions?: string[]
  reason: Factor[]
  updated_at: string
}

export type MedKind = 'dori' | 'ukol' | 'osma' | 'ingalyator'

export interface Medication {
  id: string
  name: string
  dose: string
  schedule: string
  kind?: MedKind
  rationale?: string
  taken_today: boolean
}

export interface PlanItem {
  kind: MedKind
  name: string
  dose: string
  schedule: string
  rationale: string
  warn?: string
}

export interface TreatmentPlan {
  summary: string
  items: PlanItem[]
  ai: boolean
}

export interface PrognosisItem {
  cond: string
  when: string
  risk: string   // past | o'rta | yuqori
  why: string
  prevent: string
}

export interface Prognosis {
  summary: string
  items: PrognosisItem[]
  ai: boolean
}

export interface HistoryItem {
  year: number
  event: string
}

export interface Appointment {
  id: string
  patient_id?: string
  patient_name?: string
  doctor?: string
  date: string
  time?: string
  reason: string
  status: string
  created_at: string
}

export interface Doctor {
  name: string
  role: string
}

export interface Notif {
  id: number
  text: string
  kind: string
  created_at: string
  read: boolean
}

export interface ReportItem {
  id: string
  patient_id: string
  patient_name: string
  note: string
  symptoms: string[]
  created_at: string
  status: string
}

export interface Adherence {
  id: string
  name: string
  zone: Zone
  taken: number
  total: number
}

export interface Slot {
  time: string
  is_booked: boolean
}

export interface Patient {
  id: string
  name: string
  age: number
  gender?: string
  gestational_week: number
  phone: string
  region: string
  conditions: string[]
  allergies: string[]
  history: HistoryItem[]
  medications: Medication[]
  encounters: Encounter[]
  current_zone: Zone
  updated_at: string
  appointments: Appointment[]
  lifestyle_log: { title: string; ts: string }[]
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

export interface LifestyleRec {
  title: string
  detail: string
}

export interface TwinResult {
  level: 'Xavfsiz' | 'Ehtiyot' | 'Xavfli'
  warnings: string[]
  summary: string
  ai: boolean
  drug?: string
  dose?: string
}

export interface LoginResult {
  role: 'hamshira' | 'mutaxassis' | 'oilaviy' | 'bemor'
  name: string
  patient_id: string | null
}
