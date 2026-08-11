import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../lib/api'
import { getSession } from '../lib/store'
import type { Patient, Medication, LifestyleRec, Appointment } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { ZoneBadge } from '../components/ZoneBadge'
import { useT } from '../lib/i18n'

export default function PatientHome() {
  const session = getSession()
  const pid = session?.patientId
  const { t, td, lang } = useT()
  const [p, setP] = useState<Patient | null>(null)
  const [meds, setMeds] = useState<Medication[]>([])
  const [recs, setRecs] = useState<LifestyleRec[]>([])
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [appts, setAppts] = useState<Appointment[]>([])
  const [apDate, setApDate] = useState('')
  const [apReason, setApReason] = useState('')
  const [reportNote, setReportNote] = useState('')
  const [reportSent, setReportSent] = useState(false)

  useEffect(() => {
    if (!pid) return
    api.patient(pid).then(setP)
    api.medications(pid).then(setMeds)
    api.appointments(pid).then(setAppts)
    api.lifestyle(pid, lang).then((d) => setRecs(d.recommendations)).catch(() => {})
  }, [pid, lang])

  if (!pid) return <Navigate to="/" replace />

  const toggleMed = async (m: Medication) => {
    const upd = await api.toggleMedication(pid, m.id, !m.taken_today)
    setMeds((xs) => xs.map((x) => (x.id === m.id ? upd : x)))
  }
  const accept = async (title: string) => {
    await api.lifestyleAccept(pid, title)
    setAccepted((s) => new Set(s).add(title))
  }
  const book = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apDate) return
    const ap = await api.createAppointment(pid, apDate, apReason)
    setAppts((xs) => [ap, ...xs]); setApDate(''); setApReason('')
  }
  const sendReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportNote.trim()) return
    await api.createReport(pid, reportNote, [])
    setReportNote(''); setReportSent(true); setTimeout(() => setReportSent(false), 3000)
  }

  const takenCount = meds.filter((m) => m.taken_today).length

  return (
    <>
      <TopBar title={t('ph.title')} subtitle={session?.name} />
      <div className="mx-auto w-full max-w-2xl p-4 md:p-6 space-y-5">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('ph.hello')}</p>
              <h2 className="text-xl font-bold">{p?.name ?? session?.name}</h2>
            </div>
            {p && <ZoneBadge zone={p.current_zone} className="!text-sm !px-3 !py-1.5" />}
          </div>
          {p && (p.conditions.length > 0 || p.allergies.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.conditions.map((c) => <span key={c} className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs">{td(c)}</span>)}
              {p.allergies.map((a) => <span key={a} className="rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-2.5 py-1 text-xs">{t('pd.allergy')}: {td(a)}</span>)}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">💊 {t('ph.meds')}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{takenCount}/{meds.length} {t('ph.taken')}</span>
          </div>
          <div className="space-y-2">
            {meds.map((m) => (
              <button key={m.id} onClick={() => toggleMed(m)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${m.taken_today ? 'border-zone-green bg-green-50 dark:bg-green-950/30' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${m.taken_today ? 'border-zone-green bg-zone-green text-white' : 'border-slate-300'}`}>{m.taken_today ? '✓' : ''}</span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{m.name} · {m.dose}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{m.schedule}</span>
                </span>
              </button>
            ))}
            {meds.length === 0 && <p className="text-sm text-slate-400">{t('ph.noMeds')}</p>}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-brand">✦</span>
            <h3 className="font-bold">{t('ph.twinTitle')}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('ph.twinDesc')}</p>
          <div className="space-y-2">
            {recs.map((r) => {
              const on = accepted.has(r.title)
              return (
                <div key={r.title} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.detail}</p>
                  <button onClick={() => accept(r.title)} disabled={on}
                    className={`mt-2 text-xs font-semibold rounded-full px-3 py-1.5 ${on ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300' : 'bg-brand text-white hover:bg-brand-hover'}`}>
                    {on ? '✓ ' + t('ph.accepted') : t('ph.try')}
                  </button>
                </div>
              )
            })}
            {recs.length === 0 && <p className="text-sm text-slate-400">{t('ph.recsLoading')}</p>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-3">📅 {t('ph.book')}</h3>
          <form onSubmit={book} className="space-y-3">
            <div><label className="label">{t('ph.date')}</label><input type="date" className="input" value={apDate} onChange={(e) => setApDate(e.target.value)} /></div>
            <div><label className="label">{t('ph.reason')}</label><input className="input" value={apReason} onChange={(e) => setApReason(e.target.value)} /></div>
            <button type="submit" className="btn-primary w-full">{t('ph.bookBtn')}</button>
          </form>
          {appts.length > 0 && (
            <div className="mt-4 space-y-2">
              {appts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm">
                  <span>{a.date}{a.reason ? ` · ${a.reason}` : ''}</span>
                  <span className="text-xs text-brand font-medium">{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-3">📝 {t('ph.report')}</h3>
          <form onSubmit={sendReport} className="space-y-3">
            <textarea className="input min-h-24" placeholder={t('ph.reportPh')} value={reportNote} onChange={(e) => setReportNote(e.target.value)} />
            <button type="submit" className="btn-primary w-full">{t('c.send')}</button>
          </form>
          {reportSent && <p className="mt-2 text-sm font-medium text-zone-green">✓ {t('ph.reportSent')}</p>}
        </div>
      </div>
    </>
  )
}
