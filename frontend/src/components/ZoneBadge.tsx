import type { Zone } from '../lib/types'
import { useT } from '../lib/i18n'

export const ZONE_STYLE: Record<
  Zone,
  { bg: string; text: string; dot: string; ring: string; solid: string }
> = {
  Qizil: {
    bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300',
    dot: 'bg-zone-red', ring: 'ring-red-200 dark:ring-red-900/60', solid: 'text-zone-red',
  },
  Sariq: {
    bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-zone-amber', ring: 'ring-amber-200 dark:ring-amber-900/60', solid: 'text-zone-amber',
  },
  Yashil: {
    bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-700 dark:text-green-300',
    dot: 'bg-zone-green', ring: 'ring-green-200 dark:ring-green-900/60', solid: 'text-zone-green',
  },
}

export function ZoneBadge({ zone, className = '' }: { zone: Zone; className?: string }) {
  const { zone: zoneT } = useT()
  const s = ZONE_STYLE[zone]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.bg} ${s.text} ${s.ring} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {zoneT(zone)}
    </span>
  )
}
