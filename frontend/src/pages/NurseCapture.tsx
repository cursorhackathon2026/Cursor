import { useEffect, useState } from 'react'
import { api, type EncounterResult } from '../lib/api'
import type { PatientListItem } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { ZoneBadge } from '../components/ZoneBadge'
import { FactorBars } from '../components/FactorBars'
import { useT } from '../lib/i18n'

const SYMPTOM_KEYS = ['bosh_ogrigi', 'koz_parcha', 'kongil_aynishi', 'shish', 'qorin_ogrigi', 'harakat_kamaygan']
const emptyForm = { bp_sys: '', bp_dia: '', weight: '', hemoglobin: '', glucose: '', gestational_week: '' }

export default function NurseCapture() {
  const { t, td, sym, lang } = useT()
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [pid, setPid] = useState('')
  const [form, setForm] = useState({ ...emptyForm })
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [result, setResult] = useState<EncounterResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [queued, setQueued] = useState(0)
  const [offlineMsg, setOfflineMsg] = useState(false)

  const getQueue = () => JSON.parse(localStorage.getItem('nc_queue') || '[]')
  const setQueue = (q: any[]) => { localStorage.setItem('nc_queue', JSON.stringify(q)); setQueued(q.length) }

  const sync = async () => {
    const q = getQueue()
    const rest: any[] = []
    for (const item of q) { try { await api.addEncounter(item) } catch { rest.push(item) } }
    setQueue(rest)
  }

  useEffect(() => {
    api.patients().then((p) => { setPatients(p); if (p[0]) setPid(p[0].id) })
    setQueued(getQueue().length)
    const h = () => sync()
    window.addEventListener('online', h)
    return () => window.removeEventListener('online', h)
  }, [])

  const num = (v: string) => (v === '' ? null : Number(v))
  const toggle = (k: string) => setSymptoms((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))

  const submit = async () => {
    if (!pid) return
    setBusy(true); setResult(null); setOfflineMsg(false)
    const payload = {
      patient_id: pid,
      vitals: {
        bp_sys: num(form.bp_sys), bp_dia: num(form.bp_dia), weight: num(form.weight),
        hemoglobin: num(form.hemoglobin), glucose: num(form.glucose), gestational_week: num(form.gestational_week),
      },
      symptoms, use_llm: true, lang,
    }
    try {
      setResult(await api.addEncounter(payload))
    } catch {
      const q = getQueue(); q.push(payload); setQueue(q); setOfflineMsg(true)
    } finally { setBusy(false) }
  }

  const reset = () => { setForm({ ...emptyForm }); setSymptoms([]); setResult(null) }

  return (
    <>
      <TopBar title={t('nc.title')} subtitle={t('nc.subtitle')} />
      <div className="mx-auto w-full max-w-xl p-4 md:p-6 space-y-4">
        {queued > 0 ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-300">
            <span>📴 {queued} {t('nc.queued')}</span>
            <button onClick={sync} className="btn-primary !py-1.5 text-xs">{t('nc.sync')}</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/40 px-4 py-2.5 text-sm font-medium text-green-700 dark:text-green-300">
            <span className="h-2 w-2 rounded-full bg-zone-green" /> {t('nc.synced')}
          </div>
        )}

        <div className="card p-4">
          <label className="label">{t('nc.selectPatient')}</label>
          <select className="input" value={pid} onChange={(e) => setPid(e.target.value)}>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.gestational_week}</option>)}
          </select>
        </div>

        <div className="card p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('nc.vitals')}</p>
          <div>
            <label className="label">{t('nc.bp')}</label>
            <div className="flex items-center gap-2">
              <input className="input" inputMode="numeric" placeholder={t('nc.sys')} value={form.bp_sys} onChange={(e) => setForm({ ...form, bp_sys: e.target.value })} />
              <span className="text-slate-400">/</span>
              <input className="input" inputMode="numeric" placeholder={t('nc.dia')} value={form.bp_dia} onChange={(e) => setForm({ ...form, bp_dia: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('nc.weight')}</label><input className="input" inputMode="decimal" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></div>
            <div><label className="label">{t('nc.hb')}</label><input className="input" inputMode="numeric" value={form.hemoglobin} onChange={(e) => setForm({ ...form, hemoglobin: e.target.value })} /></div>
            <div><label className="label">{t('nc.glu')}</label><input className="input" inputMode="decimal" value={form.glucose} onChange={(e) => setForm({ ...form, glucose: e.target.value })} /></div>
            <div><label className="label">{t('nc.week')}</label><input className="input" inputMode="numeric" value={form.gestational_week} onChange={(e) => setForm({ ...form, gestational_week: e.target.value })} /></div>
          </div>
        </div>

        <div className="card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('nc.symptoms')} ({symptoms.length})</p>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOM_KEYS.map((k) => (
              <button key={k} onClick={() => toggle(k)}
                className={`rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${symptoms.includes(k) ? 'border-brand bg-brand/5 text-brand font-medium' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                {sym(k)}
              </button>
            ))}
          </div>
        </div>

        <button onClick={submit} disabled={busy || !pid} className="btn-primary w-full !py-3">
          {busy ? t('nc.analyzing') : t('nc.submit')}
        </button>
        {offlineMsg && <p className="text-sm font-medium text-amber-600">📴 {t('nc.offlineSaved')}</p>}

        {result && (
          <div className="card p-5 animate-pop">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{t('nc.result')}</h3>
              <ZoneBadge zone={result.assessment.zone} className="!text-sm !px-3 !py-1.5" />
            </div>
            {result.zone_changed && (
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{t('nc.zoneChanged')}: {result.previous_zone} → <b>{result.assessment.zone}</b></p>
            )}
            <div className="mt-4"><FactorBars factors={result.assessment.factors} /></div>
            <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-sm">
              <span className="font-semibold">{t('nc.rec')}: </span>{td(result.assessment.recommendation)}
            </div>
            {result.alert && <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm font-semibold text-red-700 dark:text-red-300">🔔 {t('nc.alertSent')}</div>}
            <button onClick={reset} className="btn-ghost mt-4 w-full">{t('nc.newVisit')}</button>
          </div>
        )}
      </div>
    </>
  )
}
