import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Alert } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { ZoneBadge, ZONE_STYLE } from '../components/ZoneBadge'
import { timeAgo } from '../lib/format'
import { useT } from '../lib/i18n'

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [onlyOpen, setOnlyOpen] = useState(true)
  const { t, td } = useT()

  const load = () => api.alerts().then(setAlerts)
  useEffect(() => { load() }, [])

  const ack = async (id: string) => {
    await api.ackAlert(id)
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, status: "ko'rildi" } : x)))
  }

  const shown = onlyOpen ? alerts.filter((a) => a.status === 'ochiq') : alerts
  const open = alerts.filter((a) => a.status === 'ochiq').length

  return (
    <>
      <TopBar title={t('al.title')} subtitle={`${open} ${t('al.open')}`} alertCount={open} />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex gap-1.5">
          {[[t('al.filterOpen'), true], [t('c.all'), false]].map(([l, v]) => (
            <button key={String(v)} onClick={() => setOnlyOpen(v as boolean)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${onlyOpen === v ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
              {l as string}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {shown.map((a) => (
            <div key={a.id} className="card overflow-hidden">
              <div className="flex">
                <div className={`w-1.5 ${ZONE_STYLE[a.zone].dot}`} />
                <div className="flex-1 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{a.patient_name}</span>
                      <ZoneBadge zone={a.zone} />
                      {a.urgent && <span className="rounded-full bg-red-100 dark:bg-red-950/60 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:text-red-300">{t('al.urgent')}</span>}
                    </div>
                    <span className="text-xs text-slate-400">{timeAgo(a.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{td(a.reason)}</p>
                  <p className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 text-sm">{td(a.recommendation)}</p>
                  <div className="mt-3">
                    {a.status === 'ochiq'
                      ? <button onClick={() => ack(a.id)} className="btn-primary !py-2 text-sm">✓ {t('al.ack')}</button>
                      : <span className="text-sm font-medium text-green-600">✓ {t('al.seen')}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {shown.length === 0 && <p className="text-slate-400">{t('al.none')}</p>}
        </div>
      </div>
    </>
  )
}
