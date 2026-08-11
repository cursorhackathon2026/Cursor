import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../lib/api'
import { getSession } from '../lib/store'
import type { Patient, Medication, LifestyleRec, Appointment, Doctor, Slot, Notif } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { ZoneBadge } from '../components/ZoneBadge'
import { useT } from '../lib/i18n'
import { timeAgo } from '../lib/format'

const DATES = Array.from({ length: 5 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10)
})
const KIND_ICON: Record<string, string> = { dori: '💊', ukol: '💉', osma: '💧', ingalyator: '🌬️' }

export default function PatientHome() {
  const session = getSession()
  const pid = session?.patientId
  const { t, td, lang } = useT()
  const [p, setP] = useState<Patient | null>(null)
  const [meds, setMeds] = useState<Medication[]>([])
  const [recs, setRecs] = useState<LifestyleRec[]>([])
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [appts, setAppts] = useState<Appointment[]>([])
  // qabul (slot)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [docSel, setDocSel] = useState('')
  const [apDate, setApDate] = useState(DATES[0])
  const [slots, setSlots] = useState<Slot[]>([])
  const [timeSel, setTimeSel] = useState('')
  const [apReason, setApReason] = useState('')
  const [reportNote, setReportNote] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])

  useEffect(() => {
    if (!pid) return
    api.patient(pid).then(setP)
    api.medications(pid).then(setMeds)
    api.appointments(pid).then(setAppts)
    api.lifestyle(pid, lang).then((d) => setRecs(d.recommendations)).catch(() => {})
    api.notifications(pid).then((d) => setNotifs(d.items)).catch(() => {})
    api.readNotifications(pid).catch(() => {})
  }, [pid, lang])

  useEffect(() => { api.doctors().then((d) => { setDoctors(d); if (d[0]) setDocSel(d[0].name) }) }, [])
  useEffect(() => {
    if (docSel && apDate) api.slots(docSel, apDate).then(setSlots).catch(() => setSlots([]))
    setTimeSel('')
  }, [docSel, apDate])

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
    if (!docSel || !apDate || !timeSel) return
    const ap = await api.createAppointment(pid, docSel, apDate, timeSel, apReason)
    setAppts((xs) => [ap, ...xs]); setApReason(''); setTimeSel('')
    api.slots(docSel, apDate).then(setSlots)
  }
  const sendReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportNote.trim()) return
    await api.createReport(pid, reportNote, [])
    setReportNote(''); setReportSent(true); setTimeout(() => setReportSent(false), 3000)
  }

  const takenCount = meds.filter((m) => m.taken_today).length
  const free = slots.filter((s) => !s.is_booked)

  return (
    <>
      <TopBar title={t('ph.title')} subtitle={session?.name} />
      <div className="mx-auto w-full max-w-2xl p-4 md:p-6 space-y-5">
        {/* Holat */}
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

        {/* Xabarlar (shifokordan) */}
        {notifs.length > 0 && (
          <div className="card p-5">
            <h3 className="mb-3 font-bold">🔔 {t('ph.messages')}</h3>
            <div className="space-y-2">
              {notifs.map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm">
                  <span>{n.text}</span>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kunlik eslatmalar / dorilar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">⏰ {t('pd.reminders')}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{takenCount}/{meds.length} {t('ph.taken')}</span>
          </div>
          <div className="space-y-2">
            {meds.map((m) => (
              <button key={m.id} onClick={() => toggleMed(m)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${m.taken_today ? 'border-zone-green bg-green-50 dark:bg-green-950/30' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${m.taken_today ? 'border-zone-green bg-zone-green text-white' : 'border-slate-300'}`}>{m.taken_today ? '✓' : ''}</span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{KIND_ICON[m.kind ?? 'dori']} {m.name} · {m.dose}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{m.schedule}</span>
                  {m.rationale && <span className="mt-1 block text-[11px] text-teal dark:text-teal-300">✦ {t('pd.whyThis')}: {m.rationale}</span>}
                </span>
              </button>
            ))}
            {meds.length === 0 && <p className="text-sm text-slate-400">{t('ph.noMeds')}</p>}
          </div>
        </div>

        {/* Raqamli egizak tavsiyalari */}
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

        {/* Qabulga yozilish — slot jadvali */}
        <div className="card p-5">
          <h3 className="font-bold mb-3">📅 {t('ph.book')}</h3>
          <form onSubmit={book} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('ph.doctor')}</label>
                <select className="input" value={docSel} onChange={(e) => setDocSel(e.target.value)}>
                  {doctors.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('ph.date')}</label>
                <select className="input" value={apDate} onChange={(e) => setApDate(e.target.value)}>
                  {DATES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">{t('ph.chooseSlot')}</label>
              {free.length === 0 ? (
                <p className="text-sm text-slate-400">{t('ph.noSlots')}</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {slots.map((s) => (
                    <button type="button" key={s.time} disabled={s.is_booked}
                      onClick={() => setTimeSel(s.time)}
                      className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                        s.is_booked ? 'cursor-not-allowed bg-slate-100 text-slate-300 line-through dark:bg-slate-800 dark:text-slate-600'
                        : timeSel === s.time ? 'bg-brand text-white'
                        : 'border border-slate-200 hover:bg-brand/10 hover:text-brand dark:border-slate-700'}`}>
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div><label className="label">{t('ph.reason')}</label><input className="input" value={apReason} onChange={(e) => setApReason(e.target.value)} /></div>
            <button type="submit" disabled={!timeSel} className="btn-primary w-full">{t('ph.bookBtn')}</button>
          </form>
          {appts.length > 0 && (
            <div className="mt-4 space-y-2">
              {appts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm">
                  <span>{a.date} {a.time} · {a.doctor}{a.reason ? ` · ${a.reason}` : ''}</span>
                  <span className="text-xs font-medium text-brand">{td(a.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ahvol xabari */}
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
