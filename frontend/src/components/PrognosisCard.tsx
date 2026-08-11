import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Prognosis } from '../lib/types'
import { useT } from '../lib/i18n'

const RISK_STYLE: Record<string, { bar: string; chip: string }> = {
  yuqori: { bar: 'bg-red-500', chip: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
  "o'rta": { bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  past: { bar: 'bg-green-500', chip: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300' },
}

export function PrognosisCard({ patientId }: { patientId: string }) {
  const { t, lang } = useT()
  const [data, setData] = useState<Prognosis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.prognosis(patientId, lang).then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [patientId, lang])

  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-brand">🔮</span>
        <h3 className="font-bold">{t('prog.title')}</h3>
      </div>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t('prog.desc')}</p>

      {loading && <div className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />}

      {!loading && data && (
        <div className="animate-fadeup">
          {data.summary && (
            <div className="mb-3 rounded-xl bg-brand/5 px-4 py-3 text-sm text-plum dark:bg-brand/10 dark:text-slate-200">
              {data.summary}
            </div>
          )}
          {data.items.length === 0 && <p className="text-sm text-slate-400">{t('prog.none')}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {data.items.map((it, i) => {
              const st = RISK_STYLE[it.risk] ?? RISK_STYLE["o'rta"]
              return (
                <div key={i} className="rounded-2xl border border-slate-200 p-3.5 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug">{it.cond}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${st.chip}`}>
                      {t(`prog.risk.${it.risk}`)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full ${st.bar}`} style={{ width: it.risk === 'yuqori' ? '90%' : it.risk === "o'rta" ? '60%' : '30%' }} />
                  </div>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">{t('prog.when')}: <span className="font-semibold text-slate-600 dark:text-slate-300">{it.when}</span></p>
                  {it.why && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300"><b>{t('prog.why')}:</b> {it.why}</p>}
                  {it.prevent && <p className="mt-1 text-xs text-teal dark:text-teal-300"><b>{t('prog.prevent')}:</b> {it.prevent}</p>}
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">{data.ai ? '✦ ' + t('twin.aiBadge') : t('twin.ruleBadge')} · {t('pd.dss').replace('* ', '')}</p>
        </div>
      )}
    </div>
  )
}
