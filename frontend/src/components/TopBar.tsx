import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { LangSwitcher } from './LangSwitcher'

export function TopBar({
  title,
  subtitle,
  alertCount,
}: {
  title: string
  subtitle?: string
  alertCount?: number
}) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-4 md:px-6 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold">{title}</h1>
        {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => nav('/alerts')} className="relative btn-ghost !px-2.5 !py-2" title="Alerts">
          🔔
          {alertCount ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-zone-red px-1 text-[10px] font-bold text-white">
              {alertCount}
            </span>
          ) : null}
        </button>
        <LangSwitcher />
        <ThemeToggle />
      </div>
    </header>
  )
}
