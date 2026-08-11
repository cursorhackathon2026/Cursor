import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Alert } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { ZoneBadge } from '../components/ZoneBadge'
import { StatTile } from '../components/StatTile'
import { fmtDateTime } from '../lib/format'

export default function FamilyDoctor() {
  const [tasks, setTasks] = useState<Alert[]>([])

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
      <TopBar title="Aktiv chaqiruv" subtitle={`${active.length} ta vazifa kutmoqda`} alertCount={active.length} />
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatTile label="Aktiv chaqiruv" value={active.length} accent="text-brand" />
          <StatTile label="Kutilmoqda" value={active.length} sub="24s SLA" accent="text-zone-amber" />
          <StatTile label="Shoshilinch (qizil)" value={red} accent="text-zone-red" />
        </div>

        <div className="space-y-4">
          {tasks.map((t) => (
            <div key={t.id} className={`card p-5 ${t.status !== 'ochiq' ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold">
                    {t.patient_name.split(' ').map((x) => x[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{t.patient_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.reason}</p>
                  </div>
                </div>
                <ZoneBadge zone={t.zone} />
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-sm">
                <span className="font-semibold">Tavsiya: </span>{t.recommendation}
              </div>
              <p className="mt-2 text-xs text-slate-400">Yaratildi: {fmtDateTime(t.created_at)}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {t.status === 'ochiq' ? (
                  <>
                    <a href="tel:+998" className="btn-primary !py-2 text-sm">📞 Qo‘ng‘iroq qilish</a>
                    <button onClick={() => done(t.id)} className="btn-ghost !py-2 text-sm">✓ Bajarildi deb belgilash</button>
                  </>
                ) : (
                  <span className="text-sm font-medium text-green-600">✓ Bajarildi</span>
                )}
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-slate-400">Aktiv chaqiruv yo‘q</p>}
        </div>
      </div>
    </>
  )
}
