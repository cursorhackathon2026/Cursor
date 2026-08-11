import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Patient } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { ZoneBadge } from '../components/ZoneBadge'
import { FactorBars } from '../components/FactorBars'
import { TrendChart } from '../components/TrendChart'
import { fmtDateTime } from '../lib/format'

const short = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()}.${d.getMonth() + 1}`
}

export default function PatientDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [p, setP] = useState<Patient | null>(null)

  useEffect(() => {
    if (id) api.patient(id).then(setP).catch(() => setP(null))
  }, [id])

  if (!p)
    return (
      <>
        <TopBar title="Bemor" />
        <div className="p-6 text-slate-400">Yuklanmoqda…</div>
      </>
    )

  const last = p.encounters[p.encounters.length - 1]
  const a = last.assessment

  const series = (key: 'bp_sys' | 'hemoglobin' | 'glucose') =>
    p.encounters
      .filter((e) => e.vitals[key] != null)
      .map((e) => ({ label: short(e.ts), value: Number(e.vitals[key]) }))

  return (
    <>
      <TopBar title={p.name} subtitle={`${p.region} · ${p.phone}`} />
      <div className="p-4 md:p-6 space-y-6">
        <button onClick={() => nav(-1)} className="btn-ghost !py-1.5 text-sm">← Orqaga</button>

        {/* Header */}
        <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-lg font-bold">
              {p.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{p.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 nums">
                {p.age} yosh · {p.gestational_week} hafta homilalik
              </p>
            </div>
          </div>
          <div className="text-right">
            <ZoneBadge zone={p.current_zone} className="!text-sm !px-3 !py-1.5" />
            <p className="mt-1 text-xs text-slate-400 nums">Ball: {a.score}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nega bu zona */}
          <div className="card p-5">
            <h3 className="font-bold mb-4">Xavf omillari — nega «{p.current_zone}»</h3>
            <FactorBars factors={a.factors} />
          </div>

          {/* AI tavsiya */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-brand">✦</span>
              <h3 className="font-bold">AI xavf xulosasi va tavsiya</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{a.recommendation}</p>
            {a.urgent && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300">
                ⚠ Shoshilinch — kechiktirmang
              </div>
            )}
            <p className="mt-4 text-[11px] text-slate-400">
              * Qaror qo‘llab-quvvatlash. Yakuniy qaror shifokorda.
            </p>
          </div>
        </div>

        {/* Trend grafiklar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TrendChart title="Qon bosimi (sistolik)" unit="mmHg" points={series('bp_sys')} threshold={140} thresholdLabel="140" />
          <TrendChart title="Gemoglobin" unit="g/L" points={series('hemoglobin')} threshold={110} thresholdLabel="110" />
          <TrendChart title="Glyukoza" unit="mmol/L" points={series('glucose')} threshold={5.1} thresholdLabel="5.1" />
        </div>

        {/* Ko'riklar tarixi */}
        <div className="card">
          <h3 className="font-bold p-4 border-b border-slate-200 dark:border-slate-800">Ko‘riklar tarixi</h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...p.encounters].reverse().map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium">{fmtDateTime(e.ts)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 nums">
                    BP {e.vitals.bp_sys}/{e.vitals.bp_dia} · Hb {e.vitals.hemoglobin} · Glu {e.vitals.glucose}
                    {e.symptoms.length ? ` · ${e.symptoms.length} belgi` : ''}
                  </p>
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
