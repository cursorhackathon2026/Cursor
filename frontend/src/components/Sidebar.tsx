import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { getSession, clearSession, type Role } from '../lib/store'
import { useT } from '../lib/i18n'
import { api } from '../lib/api'

const NAV: Record<Role, { to: string; key: string; icon: string }[]> = {
  mutaxassis: [
    { to: '/dashboard', key: 'nav.home', icon: '▦' },
    { to: '/schedule', key: 'nav.schedule', icon: '📅' },
    { to: '/inbox', key: 'nav.inbox', icon: '📥' },
    { to: '/alerts', key: 'nav.alerts', icon: '🔔' },
  ],
  oilaviy: [
    { to: '/followup', key: 'nav.activeCall', icon: '📞' },
    { to: '/schedule', key: 'nav.schedule', icon: '📅' },
    { to: '/inbox', key: 'nav.inbox', icon: '📥' },
    { to: '/alerts', key: 'nav.alerts', icon: '🔔' },
  ],
  hamshira: [{ to: '/capture', key: 'nav.addVisit', icon: '➕' }],
  bemor: [{ to: '/patient', key: 'nav.myPage', icon: '🏠' }],
}

export function Sidebar() {
  const session = getSession()
  const role = (session?.role ?? 'mutaxassis') as Role
  const nav = useNavigate()
  const { t, role: roleT } = useT()
  const items = NAV[role] ?? []
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (role === 'mutaxassis' || role === 'oilaviy') {
      api.notifications(role).then((d) => setUnread(d.unread)).catch(() => {})
    }
  }, [role])

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200 dark:border-slate-800">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white font-bold">M</div>
        <div>
          <p className="text-sm font-bold leading-tight">MedAI</p>
          <p className="text-[11px] text-slate-400 leading-tight">Raqamli egizak</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand/10 text-brand' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <span aria-hidden>{it.icon}</span>
            <span className="flex-1">{t(it.key)}</span>
            {it.key === 'nav.inbox' && unread > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">{unread}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 dark:border-slate-800 p-3">
        <p className="px-2 text-xs font-medium truncate">{session?.name}</p>
        <p className="px-2 text-[11px] text-slate-400">{roleT(role)}</p>
        <button onClick={() => { clearSession(); nav('/') }} className="mt-1 w-full btn-ghost !justify-start !py-2 text-sm">
          ⏻ {t('c.logout')}
        </button>
      </div>
    </aside>
  )
}
