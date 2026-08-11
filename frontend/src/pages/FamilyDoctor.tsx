import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Alert } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { ZoneBadge } from '../components/ZoneBadge'
import { StatTile } from '../components/StatTile'
import { fmtDateTime } from '../lib/format'
import { useT } from '../lib/i18n'

export default function FamilyDoctor() {
  const [tasks, setTasks] = useState<Alert[]>([])
  const { t, td } = useT()

  const load = () => api.alerts().then(setTasks)
  useEffect(() => { load() }, [])

  const done = async (id: string) => {
    await api.ackAlert(id)
    setTasks((a) => a.map((x) => (x.id === id ? { ...x, status: 'bajarildi' } : x)))
  }

  const active = tasks.filter((t) => t.status === 'ochiq')
  const red = active.filter((t) => t.zone === 'Qizil').length

  return (
    <>
      <TopBar title={t('fd.title')} subtitle={`${active.length} ${t('fd.waiting')}`} alertCount={active.length} />
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatTile label={t('fd.active')} value={active.length} accent="text-brand" />
          <StatTile label={t('fd.urgentRed')} value={red} accent="text-zone-red" />
        </div>

        <div className="space-y-4">
          {tasks.map((task) => {
            const isDone = task.status !== 'ochiq'
            return (
              <div key={task.id} className={`card p-5 ${isDone ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold">
                      {task.patient_name.split(' ').map((x) => x[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">{task.patient_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{td(task.reason)}</p>
                    </div>
                  </div>
                  <ZoneBadge zone={task.zone} />
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-sm">
                  <span className="font-semibold">{t('fd.rec')}: </span>{td(task.recommendation)}
                </div>
                <p className="mt-2 text-xs text-slate-400">{fmtDateTime(task.created_at)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!isDone ? (
                    <>
                      <a href="tel:+998" className="btn-primary !py-2 text-sm">📞 {t('fd.call')}</a>
                      <button onClick={() => done(task.id)} className="btn-ghost !py-2 text-sm">✓ {t('fd.done')}</button>
                    </>
                  ) : <span className="text-sm font-medium text-green-600">✓ {t('fd.doneShort')}</span>}
                </div>
              </div>
            )
          })}
          {tasks.length === 0 && <p className="text-slate-400">{t('fd.none')}</p>}
        </div>
      </div>
    </>
  )
}
