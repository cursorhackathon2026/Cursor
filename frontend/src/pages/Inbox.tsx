import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getSession } from '../lib/store'
import type { ReportItem, Adherence, Notif } from '../lib/types'
import { TopBar } from '../components/TopBar'
import { ZoneBadge } from '../components/ZoneBadge'
import { useT } from '../lib/i18n'
import { timeAgo } from '../lib/format'

export default function Inbox() {
  const { t, td } = useT()
  const role = getSession()?.role ?? 'mutaxassis'
  const [reports, setReports] = useState<ReportItem[]>([])
  const [adh, setAdh] = useState<Adherence[]>([])
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [replyFor, setReplyFor] = useState('')
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    api.reports().then(setReports)
    api.adherence().then(setAdh)
    api.notifications(role).then((d) => setNotifs(d.items))
    api.readNotifications(role)
  }, [role])

  const sendReply = async (id: string) => {
    if (!replyText.trim()) return
    await api.replyReport(id, replyText)
    setReplyFor(''); setReplyText('')
    api.reports().then(setReports)
  }

  return (
    <>
      <TopBar title={t('inbox.title')} subtitle={getSession()?.name} />
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-2">
        {/* Ahvol xabarlari + javob */}
        <div className="card p-5">
          <h3 className="mb-3 font-bold">📝 {t('inbox.reports')}</h3>
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{r.patient_name}</span>
                  <span className="text-[11px] text-slate-400">{timeAgo(r.created_at)}</span>
                </div>
                <p className="mt-1 text-sm">{r.note}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold dark:bg-slate-800">{td(r.status)}</span>
                  {r.status !== 'javob berildi' && (
                    <button onClick={() => setReplyFor(replyFor === r.id ? '' : r.id)} className="text-xs font-semibold text-brand">{t('inbox.reply')}</button>
                  )}
                </div>
                {replyFor === r.id && (
                  <div className="mt-2 flex gap-2">
                    <input className="input" placeholder={t('inbox.replyPh')} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                    <button onClick={() => sendReply(r.id)} className="btn-primary !py-2 text-sm whitespace-nowrap">{t('c.send')}</button>
                  </div>
                )}
              </div>
            ))}
            {reports.length === 0 && <p className="text-sm text-slate-400">{t('inbox.noReports')}</p>}
          </div>
        </div>

        {/* Dori intizomi */}
        <div className="card p-5">
          <h3 className="mb-3 font-bold">💊 {t('inbox.adherence')}</h3>
          <div className="space-y-2">
            {adh.map((a) => {
              const ok = a.total > 0 && a.taken === a.total
              const cls = ok ? 'text-zone-green' : a.taken === 0 ? 'text-zone-red' : 'text-zone-amber'
              return (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <span className="flex items-center gap-2 text-sm"><ZoneBadge zone={a.zone} /> {a.name}</span>
                  <span className={`text-sm font-semibold nums ${cls}`}>{a.taken}/{a.total}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bildirishnomalar */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-3 font-bold">🔔 {t('inbox.notifs')}</h3>
          <div className="space-y-2">
            {notifs.map((n) => (
              <div key={n.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
                <span>{n.text}</span>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
              </div>
            ))}
            {notifs.length === 0 && <p className="text-sm text-slate-400">{t('inbox.noNotifs')}</p>}
          </div>
        </div>
      </div>
    </>
  )
}
