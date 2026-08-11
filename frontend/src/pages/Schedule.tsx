import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getSession } from '../lib/store'
import type { Appointment } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { StatTile } from '../components/StatTile'
import { useT } from '../lib/i18n'

export default function Schedule() {
  const { t, td } = useT()
  const doctor = getSession()?.name ?? ''
  const [appts, setAppts] = useState<Appointment[]>([])

  const load = () => api.doctorAppointments(doctor).then(setAppts)
  useEffect(() => { load() }, [])

  const setStatus = async (id: string, status: string) => {
    await api.setApptStatus(id, status)
    setAppts((a) => a.map((x) => (x.id === id ? { ...x, status } : x)))
  }

  const pending = appts.filter((a) => a.status === "so'ralgan").length

  return (
    <>
      <TopBar title={t('sch.title')} subtitle={doctor} />
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatTile label={t('sch.total')} value={appts.length} accent="text-brand" />
          <StatTile label={t('sch.pending')} value={pending} accent="text-zone-amber" />
        </div>
        <div className="space-y-3">
          {appts.map((a) => (
            <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-14 place-items-center rounded-xl bg-brand/10 text-center font-display font-extrabold text-brand leading-none">
                  <span className="text-sm">{a.time}</span>
                </div>
                <div>
                  <p className="font-semibold">{a.patient_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.date}{a.reason ? ` · ${a.reason}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold dark:bg-slate-800">{td(a.status)}</span>
                {a.status === "so'ralgan" && (
                  <button onClick={() => setStatus(a.id, 'tasdiqlangan')} className="btn-primary !py-1.5 text-xs">{t('sch.confirm')}</button>
                )}
                {a.status !== 'bajarilgan' && (
                  <button onClick={() => setStatus(a.id, 'bajarilgan')} className="btn-ghost !py-1.5 text-xs">{t('sch.complete')}</button>
                )}
              </div>
            </div>
          ))}
          {appts.length === 0 && <p className="text-slate-400">{t('sch.none')}</p>}
        </div>
      </div>
    </>
  )
}
