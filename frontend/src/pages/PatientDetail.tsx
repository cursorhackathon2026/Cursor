import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Patient, TwinResult } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { ZoneBadge } from '../components/ZoneBadge'
import { FactorBars } from '../components/FactorBars'
import { TrendChart } from '../components/TrendChart'
import { fmtDateTime } from '../lib/format'
import { useT } from '../lib/i18n'

const short = (iso: string) => { const d = new Date(iso); return `${d.getDate()}.${d.getMonth() + 1}` }

const TWIN_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  Xavfsiz: { bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-700 dark:text-green-300', icon: '✓' },
  Ehtiyot: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', icon: '◆' },
  Xavfli: { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', icon: '⚠' },
}

function TwinSection({ patientId }: { patientId: string }) {
  const { t, twinLevel, lang } = useT()
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  const [res, setRes] = useState<TwinResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [sched, setSched] = useState('')
  const [prescribed, setPrescribed] = useState(false)

  const run = async () => {
    if (!drug.trim()) return
    setBusy(true); setRes(null); setPrescribed(false)
    try { setRes(await api.twinEvaluate(patientId, drug, dose, lang)) } finally { setBusy(false) }
  }

  const prescribe = async () => {
    await api.prescribe(patientId, drug, dose, sched || '1 marta/kun')
    setPrescribed(true)
  }

  const st = res ? TWIN_STYLE[res.level] ?? TWIN_STYLE.Ehtiyot : null
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-brand">✦</span>
        <h3 className="font-bold">{t('twin.title')}</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('twin.desc')}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input className="input" placeholder={t('twin.drug')} value={drug} onChange={(e) => setDrug(e.target.value)} />
        <input className="input sm:max-w-40" placeholder={t('twin.dose')} value={dose} onChange={(e) => setDose(e.target.value)} />
        <button onClick={run} disabled={busy || !drug.trim()} className="btn-primary whitespace-nowrap">
          {busy ? t('twin.running') : t('twin.run')}
        </button>
      </div>
      {res && st && (
        <div className={`mt-4 rounded-xl p-4 animate-pop ${st.bg}`}>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${st.text}`}>{st.icon}</span>
            <span className={`font-bold ${st.text}`}>{twinLevel(res.level)}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">— {res.drug} {res.dose}</span>
          </div>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{res.summary}</p>
          {res.warnings.length > 0 && (
            <ul className="mt-2 space-y-1">{res.warnings.map((w, i) => <li key={i} className={`text-sm ${st.text}`}>• {w}</li>)}</ul>
          )}
          <p className="mt-3 text-[11px] text-slate-400">
            {res.ai ? '✦ ' + t('twin.aiBadge') : t('twin.ruleBadge')} · {t('pd.dss').replace('* ', '')}
          </p>
          {/* Retsept berish — #12 to'liq halqa */}
          <div className="mt-3 flex flex-col gap-2 border-t border-black/5 pt-3 dark:border-white/10 sm:flex-row">
            <input className="input" placeholder={t('twin.schedule')} value={sched} onChange={(e) => setSched(e.target.value)} />
            <button onClick={prescribe} disabled={prescribed} className="btn-primary whitespace-nowrap">
              {prescribed ? '✓ ' + t('twin.prescribed') : t('twin.prescribe')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PatientDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t, zone: zoneT, td } = useT()
  const [p, setP] = useState<Patient | null>(null)
  const [traj, setTraj] = useState<{ points: { label: string; value: number }[]; adherence: number } | null>(null)

  useEffect(() => {
    if (id) {
      api.patient(id).then(setP).catch(() => setP(null))
      api.trajectory(id).then(setTraj).catch(() => {})
    }
  }, [id])

  if (!p) return (<><TopBar title={t('role.bemor')} /><div className="p-6 text-slate-400">{t('c.loading')}</div></>)

  const a = p.encounters[p.encounters.length - 1].assessment
  const series = (key: 'bp_sys' | 'hemoglobin' | 'glucose') =>
    p.encounters.filter((e) => e.vitals[key] != null).map((e) => ({ label: short(e.ts), value: Number(e.vitals[key]) }))

  return (
    <>
      <TopBar title={p.name} subtitle={`${td(p.region)} · ${p.phone}`} />
      <div className="p-4 md:p-6 space-y-6">
        <button onClick={() => nav(-1)} className="btn-ghost !py-1.5 text-sm">← {t('c.back')}</button>

        <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-lg font-bold">
              {p.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{p.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 nums">{p.age} {t('pd.years')} · {p.gestational_week} {t('pd.weekHomilalik')}</p>
            </div>
          </div>
          <div className="text-right">
            <ZoneBadge zone={p.current_zone} className="!text-sm !px-3 !py-1.5" />
            <p className="mt-1 text-xs text-slate-400 nums">{t('pd.score')}: {a.score}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-bold mb-4">{t('pd.factorsTitle')} «{zoneT(p.current_zone)}»</h3>
            <FactorBars factors={a.factors} />
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-brand">✦</span>
              <h3 className="font-bold">{t('pd.aiTitle')}</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{td(a.recommendation)}</p>
            {a.urgent && <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300">⚠ {t('pd.urgent')}</div>}
            <p className="mt-4 text-[11px] text-slate-400">{t('pd.dss')}</p>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-3">{t('pd.historyTitle')}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {p.conditions.map((c) => <span key={c} className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium">{td(c)}</span>)}
            {p.allergies.map((al) => <span key={al} className="rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-2.5 py-1 text-xs font-medium">{t('pd.allergy')}: {td(al)}</span>)}
            {p.conditions.length === 0 && p.allergies.length === 0 && <span className="text-sm text-slate-400">{t('pd.noHistory')}</span>}
          </div>
          <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-2 space-y-3">
            {p.history.map((h, i) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-brand" />
                <p className="text-sm"><b className="nums">{h.year}</b> — {td(h.event)}</p>
              </li>
            ))}
          </ol>
        </div>

        <TwinSection patientId={p.id} />

        {traj && (
          <TrendChart title={`${t('pd.trajectory')} · ${t('pd.adhLabel')} ${traj.adherence}%`} unit="%" points={traj.points} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TrendChart title={t('nc.bp')} unit="mmHg" points={series('bp_sys')} threshold={140} thresholdLabel="140" />
          <TrendChart title={t('nc.hb')} unit="g/L" points={series('hemoglobin')} threshold={110} thresholdLabel="110" />
          <TrendChart title={t('nc.glu')} unit="mmol/L" points={series('glucose')} threshold={5.1} thresholdLabel="5.1" />
        </div>

        <div className="card">
          <h3 className="font-bold p-4 border-b border-slate-200 dark:border-slate-800">{t('pd.visitsTitle')}</h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...p.encounters].reverse().map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium">{fmtDateTime(e.ts)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 nums">BP {e.vitals.bp_sys}/{e.vitals.bp_dia} · Hb {e.vitals.hemoglobin} · Glu {e.vitals.glucose}</p>
                </div>
                <ZoneBadge zone={e.assessment.zone} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
