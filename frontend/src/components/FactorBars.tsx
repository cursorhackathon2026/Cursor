import type { Factor } from '../lib/types'
import { useT } from '../lib/i18n'

/** Xavf omillarining tushuntirilishi — status ranglar + yorliq. */
export function FactorBars({ factors }: { factors: Factor[] }) {
  const { t, td } = useT()
  if (!factors.length)
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t('pd.factorNone')}</p>
  const max = Math.max(60, ...factors.map((f) => f.points))
  return (
    <ul className="space-y-3">
      {factors.map((f, i) => {
        const pct = Math.round((f.points / max) * 100)
        const color = f.severity === 'red' ? 'bg-zone-red' : 'bg-zone-amber'
        return (
          <li key={i}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {f.severity === 'red' ? '⚠ ' : '◆ '}
                {td(f.label)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 nums">{td(f.detail)}</span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
