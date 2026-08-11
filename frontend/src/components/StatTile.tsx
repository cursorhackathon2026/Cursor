import type { ReactNode } from 'react'

export function StatTile({
  label,
  value,
  sub,
  accent = 'text-slate-900 dark:text-slate-100',
  icon,
}: {
  label: string
  value: ReactNode
  sub?: string
  accent?: string
  icon?: ReactNode
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className={`mt-2 text-3xl font-extrabold nums ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  )
}
