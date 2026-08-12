import { useState } from 'react'
import { api } from '../lib/api'
import type { PlanItem, MedKind, PharmaInfo } from '../lib/types'
import { useT } from '../lib/i18n'

const KIND_ICON: Record<MedKind, string> = { dori: '💊', ukol: '💉', osma: '💧', ingalyator: '🌬️' }
const KINDS: MedKind[] = ['dori', 'ukol', 'osma', 'ingalyator']

interface EditItem extends PlanItem {
  orig: PlanItem
  consequence?: string
  checking?: boolean
  pharmaChecking?: boolean
}

const PH_STYLE: Record<string, string> = {
  keng: 'bg-green-50 text-green-700 border-green-400 dark:bg-green-950/40 dark:text-green-300',
  cheklangan: 'bg-amber-50 text-amber-700 border-amber-400 dark:bg-amber-950/40 dark:text-amber-300',
  kamyob: 'bg-orange-50 text-orange-700 border-orange-400 dark:bg-orange-950/40 dark:text-orange-300',
  "yo'q": 'bg-red-50 text-red-700 border-red-400 dark:bg-red-950/40 dark:text-red-300',
}
const PH_ICON: Record<string, string> = { keng: '✓', cheklangan: '◐', kamyob: '⚠', "yo'q": '✗' }

function PharmaBadge({ p, checking, name }: { p?: PharmaInfo; checking?: boolean; name: string }) {
  const { t } = useT()
  if (checking) return <p className="mt-2 text-xs text-slate-400">💊 {t('pharma.checking')}</p>
  if (!p) return null
  const cls = PH_STYLE[p.availability] ?? PH_STYLE["yo'q"]
  const diff = p.found && p.name_uz && p.name_uz.toLowerCase() !== name.trim().toLowerCase()
  return (
    <div className={`mt-2 rounded-lg border-l-2 px-3 py-2 text-xs ${cls}`} title={t('pharma.source')}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold">💊 {PH_ICON[p.availability]} {t(`pharma.${p.availability}`)}</span>
        {p.found && <span>· {p.count} {t('pharma.count')}</span>}
        {diff && <span className="opacity-80">· {p.name_uz}</span>}
        {p.found && p.rx && <span className="rounded-full bg-black/5 px-1.5 dark:bg-white/10">{p.rx === 'retsept' ? t('pharma.rx') : t('pharma.otc')}</span>}
        {p.found && p.local && <span className="rounded-full bg-black/5 px-1.5 dark:bg-white/10">🇺🇿 {t('pharma.local')}</span>}
      </div>
      {p.found && p.dose_match === false && !!p.doses?.length && (
        <p className="mt-1">{t('pharma.doseNo')}: {p.doses.join(', ')}</p>
      )}
      {p.alternatives.length > 0 && (
        <p className="mt-1"><b>{t('pharma.alt')}:</b> {p.alternatives.map((a) => `${a.name} (${a.count})`).join(' · ')}</p>
      )}
    </div>
  )
}

function snap(it: PlanItem): PlanItem {
  return { kind: it.kind, name: it.name, dose: it.dose, schedule: it.schedule, rationale: it.rationale, warn: it.warn }
}
function changed(a: PlanItem, b: PlanItem) {
  return a.name !== b.name || a.dose !== b.dose || a.schedule !== b.schedule || a.kind !== b.kind
}

export function TreatmentPlanner({ patientId, onConfirmed }: { patientId: string; onConfirmed?: () => void }) {
  const { t, lang } = useT()
  const [diagnosis, setDiagnosis] = useState('')
  const [items, setItems] = useState<EditItem[]>([])
  const [summary, setSummary] = useState('')
  const [ai, setAi] = useState(false)
  const [gen, setGen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [touched, setTouched] = useState(false)

  const generate = async () => {
    setGen(true); setConfirmed(false)
    try {
      const plan = await api.generateTreatment(patientId, diagnosis, lang)
      setItems(plan.items.map((it) => ({ ...it, orig: snap(it) })))
      setSummary(plan.summary); setAi(plan.ai); setTouched(true)
    } finally { setGen(false) }
  }

  const patch = (i: number, key: keyof PlanItem, val: string) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)))
  }

  const checkConsequence = async (i: number) => {
    const it = items[i]
    if (!it || !it.name.trim() || !changed(it, it.orig)) return
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, checking: true } : x)))
    try {
      const r = await api.treatmentConsequence(patientId, it.orig, snap(it), lang)
      setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, consequence: r.consequence, checking: false } : x)))
    } catch { setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, checking: false } : x))) }
  }

  const refreshPharma = async (i: number) => {
    const it = items[i]
    if (!it || !it.name.trim()) return
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, pharmaChecking: true } : x)))
    try {
      const p = await api.pharmaCheck(it.name, it.dose)
      setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, pharma: p, pharmaChecking: false } : x)))
    } catch { setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, pharmaChecking: false } : x))) }
  }

  const onNameDoseBlur = (i: number) => { checkConsequence(i); refreshPharma(i) }

  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const add = () => setItems((prev) => [...prev, { kind: 'dori', name: '', dose: '', schedule: '', rationale: '', orig: { kind: 'dori', name: '', dose: '', schedule: '', rationale: '' } }])

  const confirm = async () => {
    const clean = items.filter((it) => it.name.trim()).map(snap)
    if (!clean.length) return
    setConfirming(true)
    try {
      await api.confirmTreatment(patientId, diagnosis, clean)
      setConfirmed(true); onConfirmed?.()
    } finally { setConfirming(false) }
  }

  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-brand">✚</span>
        <h3 className="font-bold">{t('tp.title')}</h3>
      </div>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t('tp.desc')}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input className="input" placeholder={t('tp.diagnosis')} value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)} />
        <button onClick={generate} disabled={gen} className="btn-primary whitespace-nowrap">
          {gen ? t('tp.generating') : (touched ? t('tp.regenerate') : t('tp.generate'))}
        </button>
      </div>

      {gen && <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />}

      {!gen && touched && items.length === 0 && (
        <p className="mt-4 text-sm text-slate-400">{t('tp.empty')}</p>
      )}

      {!gen && items.length > 0 && (
        <div className="mt-4 space-y-3 animate-fadeup">
          {summary && (
            <div className="rounded-xl bg-brand/5 px-4 py-3 text-sm text-plum dark:bg-brand/10 dark:text-slate-200">
              <span className="font-semibold">{t('tp.summary')}: </span>{summary}
            </div>
          )}
          <p className="text-[11px] text-slate-400">{t('tp.editHint')}</p>

          {items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 p-3.5 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <select value={it.kind} onChange={(e) => patch(i, 'kind', e.target.value)}
                  className="input !w-auto !py-1.5 text-sm">
                  {KINDS.map((k) => <option key={k} value={k}>{KIND_ICON[k]} {t(`kind.${k}`)}</option>)}
                </select>
                <input className="input flex-1 !py-1.5 min-w-32 font-semibold" placeholder={t('tp.name')}
                  value={it.name} onChange={(e) => patch(i, 'name', e.target.value)} onBlur={() => onNameDoseBlur(i)} />
                <button onClick={() => remove(i)} className="btn-ghost !py-1 text-xs text-red-500">✕ {t('tp.remove')}</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <input className="input !py-1.5 sm:max-w-40 text-sm" placeholder={t('tp.dose')}
                  value={it.dose} onChange={(e) => patch(i, 'dose', e.target.value)} onBlur={() => onNameDoseBlur(i)} />
                <input className="input !py-1.5 flex-1 min-w-40 text-sm" placeholder={t('tp.schedule')}
                  value={it.schedule} onChange={(e) => patch(i, 'schedule', e.target.value)} onBlur={() => checkConsequence(i)} />
              </div>
              {it.rationale && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-brand">✦ {t('tp.rationale')}: </span>{it.rationale}
                </p>
              )}
              <PharmaBadge p={it.pharma} checking={it.pharmaChecking} name={it.name} />
              {it.warn && (
                <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  ⚠ {it.warn}
                </div>
              )}
              {it.checking && <p className="mt-2 text-xs text-amber-600">{t('tp.checking')}</p>}
              {it.consequence && changed(it, it.orig) && (
                <div className="mt-2 rounded-lg border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200 animate-fadeup">
                  <span className="font-semibold">↯ {t('tp.consequence')}: </span>{it.consequence}
                </div>
              )}
            </div>
          ))}

          <button onClick={add} className="btn-ghost !py-1.5 text-sm">{t('tp.add')}</button>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3 dark:border-white/10">
            <span className="text-[11px] text-slate-400">{ai ? '✦ ' + t('tp.aiBadge') : t('tp.ruleBadge')} · {t('pd.dss').replace('* ', '')}</span>
            <button onClick={confirm} disabled={confirming || confirmed} className="btn-primary whitespace-nowrap">
              {confirmed ? t('tp.confirmed') : confirming ? t('tp.confirming') : t('tp.confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
