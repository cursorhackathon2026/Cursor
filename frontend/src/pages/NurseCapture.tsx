import { useEffect, useState } from 'react'
import { api, type EncounterResult } from '../lib/api'
import type { PatientListItem } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { ZoneBadge } from '../components/ZoneBadge'
import { FactorBars } from '../components/FactorBars'

const SYMPTOMS: { k: string; l: string }[] = [
  { k: 'bosh_ogrigi', l: "Bosh og'rig'i" },
  { k: 'koz_parcha', l: "Ko'z oldida parcha" },
  { k: 'kongil_aynishi', l: "Ko'ngil aynishi" },
  { k: 'shish', l: "Shish (qo'l/yuz)" },
  { k: 'qorin_ogrigi', l: "Qorin og'rig'i" },
  { k: 'harakat_kamaygan', l: 'Harakat kamaygan' },
]

const emptyForm = { bp_sys: '', bp_dia: '', weight: '', hemoglobin: '', glucose: '', gestational_week: '' }

export default function NurseCapture() {
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [pid, setPid] = useState('')
  const [form, setForm] = useState({ ...emptyForm })
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [result, setResult] = useState<EncounterResult | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.patients().then((p) => {
      setPatients(p)
      if (p[0]) setPid(p[0].id)
    })
  }, [])

  const num = (v: string) => (v === '' ? null : Number(v))
  const toggle = (k: string) =>
    setSymptoms((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))

  const submit = async () => {
    if (!pid) return
    setBusy(true)
    setResult(null)
    try {
      const res = await api.addEncounter({
        patient_id: pid,
        vitals: {
          bp_sys: num(form.bp_sys),
          bp_dia: num(form.bp_dia),
          weight: num(form.weight),
          hemoglobin: num(form.hemoglobin),
          glucose: num(form.glucose),
          gestational_week: num(form.gestational_week),
        },
        symptoms,
        use_llm: true,
      })
      setResult(res)
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setForm({ ...emptyForm })
    setSymptoms([])
    setResult(null)
  }

  return (
    <>
      <TopBar title="Ko‘rik qo‘shish" subtitle="Hamshira paneli" />
      <div className="mx-auto w-full max-w-xl p-4 md:p-6 space-y-4">
        {/* Sync banner */}
        <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/40 px-4 py-2.5 text-sm font-medium text-green-700 dark:text-green-300">
          <span className="h-2 w-2 rounded-full bg-zone-green" /> Sinxronlashtirildi · hozir
        </div>

        {/* Bemor */}
        <div className="card p-4">
          <label className="label">Bemorni tanlang</label>
          <select className="input" value={pid} onChange={(e) => setPid(e.target.value)}>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.gestational_week} hafta</option>
            ))}
          </select>
        </div>

        {/* Ko'rsatkichlar */}
        <div className="card p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Asosiy ko‘rsatkichlar</p>
          <div>
            <label className="label">Qon bosimi (mmHg)</label>
            <div className="flex items-center gap-2">
              <input className="input" inputMode="numeric" placeholder="Sistolik" value={form.bp_sys} onChange={(e) => setForm({ ...form, bp_sys: e.target.value })} />
              <span className="text-slate-400">/</span>
              <input className="input" inputMode="numeric" placeholder="Diastolik" value={form.bp_dia} onChange={(e) => setForm({ ...form, bp_dia: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Vazn (kg)</label><input className="input" inputMode="decimal" placeholder="68.5" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></div>
            <div><label className="label">Gemoglobin (g/L)</label><input className="input" inputMode="numeric" placeholder="120" value={form.hemoglobin} onChange={(e) => setForm({ ...form, hemoglobin: e.target.value })} /></div>
            <div><label className="label">Glyukoza (mmol/L)</label><input className="input" inputMode="decimal" placeholder="5.5" value={form.glucose} onChange={(e) => setForm({ ...form, glucose: e.target.value })} /></div>
            <div><label className="label">Homilalik haftasi</label><input className="input" inputMode="numeric" placeholder="32" value={form.gestational_week} onChange={(e) => setForm({ ...form, gestational_week: e.target.value })} /></div>
          </div>
        </div>

        {/* Belgilar */}
        <div className="card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Belgilar ({symptoms.length})</p>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOMS.map((s) => (
              <button
                key={s.k}
                onClick={() => toggle(s.k)}
                className={`rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
                  symptoms.includes(s.k)
                    ? 'border-brand bg-brand/5 text-brand font-medium'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>

        <button onClick={submit} disabled={busy || !pid} className="btn-primary w-full !py-3">
          {busy ? 'Tahlil qilinmoqda…' : 'Saqlash va tahlil qilish'}
        </button>

        {/* Natija */}
        {result && (
          <div className="card p-5 animate-pop border-2" style={{ borderColor: 'transparent' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">AI tahlil natijasi</h3>
              <ZoneBadge zone={result.assessment.zone} className="!text-sm !px-3 !py-1.5" />
            </div>
            {result.zone_changed && (
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                Zona o‘zgardi: {result.previous_zone} → <b>{result.assessment.zone}</b>
              </p>
            )}
            <div className="mt-4"><FactorBars factors={result.assessment.factors} /></div>
            <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-sm">
              <span className="font-semibold">Tavsiya: </span>{result.assessment.recommendation}
            </div>
            {result.alert && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm font-semibold text-red-700 dark:text-red-300">
                🔔 Mutaxassisga ogohlantirish yuborildi
              </div>
            )}
            <button onClick={reset} className="btn-ghost mt-4 w-full">Yangi ko‘rik</button>
          </div>
        )}
      </div>
    </>
  )
}
