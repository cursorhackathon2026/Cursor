import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Stats, PatientListItem, Alert, Zone } from '../lib/types'
import { StatTile } from '../components/StatTile'
import { ZoneBadge } from '../components/ZoneBadge'
import { TopBar } from '../components/TopBar'
import { timeAgo, todayStr } from '../lib/format'
import { useT } from '../lib/i18n'

const FILTERS: (Zone | 'Barchasi')[] = ['Barchasi', 'Qizil', 'Sariq', 'Yashil']

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState<Zone | 'Barchasi'>('Barchasi')
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()
  const { t, zone: zoneT } = useT()

  useEffect(() => {
    Promise.all([api.stats(), api.patients(), api.alerts('ochiq')])
      .then(([s, p, a]) => { setStats(s); setPatients(p); setAlerts(a) })
      .finally(() => setLoading(false))
  }, [])

  const shown = filter === 'Barchasi' ? patients : patients.filter((p) => p.zone === filter)

  return (
    <>
      <TopBar title={t('nav.home')} subtitle={`${stats?.region ?? 'Navoiy'} · ${t('dash.sub')}, ${todayStr()}`} alertCount={stats?.open_alerts} />
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile label={t('dash.total')} value={stats?.total ?? '—'} icon="👥" />
          <StatTile label={t('dash.red')} value={stats?.qizil ?? '—'} accent="text-zone-red" icon="⚠" />
          <StatTile label={t('dash.yellow')} value={stats?.sariq ?? '—'} accent="text-zone-amber" icon="◆" />
          <StatTile label={t('dash.openAlerts')} value={stats?.open_alerts ?? '—'} accent="text-brand" icon="🔔" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 card">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold">{t('dash.patients')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      filter === f ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f === 'Barchasi' ? t('c.all') : zoneT(f)}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 font-semibold">{t('th.name')}</th>
                    <th className="px-4 py-3 font-semibold">{t('th.age')}</th>
                    <th className="px-4 py-3 font-semibold">{t('th.week')}</th>
                    <th className="px-4 py-3 font-semibold">{t('th.zone')}</th>
                    <th className="px-4 py-3 font-semibold">{t('th.reason')}</th>
                    <th className="px-4 py-3 font-semibold">{t('th.last')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">{t('c.loading')}</td></tr>}
                  {!loading && shown.map((p) => (
                    <tr key={p.id} onClick={() => nav(`/patients/${p.id}`)} className="cursor-pointer border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 nums">{p.age}</td>
                      <td className="px-4 py-3 nums">{p.gestational_week}</td>
                      <td className="px-4 py-3"><ZoneBadge zone={p.zone} /></td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.reason[0]?.label ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{timeAgo(p.updated_at)}</td>
                    </tr>
                  ))}
                  {!loading && shown.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">{t('dash.noPatients')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{t('nav.alerts')}</h3>
              <button onClick={() => nav('/alerts')} className="text-xs font-semibold text-brand">{t('dash.viewAll')} →</button>
            </div>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{a.patient_name}</span>
                    <ZoneBadge zone={a.zone} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{a.reason}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{timeAgo(a.created_at)}</p>
                </div>
              ))}
              {alerts.length === 0 && <p className="text-sm text-slate-400">{t('dash.noAlerts')}</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
