/**
 * Bitta ko'rsatkichning vaqt bo'yicha o'zgarishi (bitta seriya → legend shart emas).
 * Ingichka 2px chiziq, ≥8px marker, recessive o'q, ixtiyoriy chegara (threshold).
 */
export function TrendChart({
  title,
  unit,
  points,
  threshold,
  thresholdLabel,
}: {
  title: string
  unit?: string
  points: { label: string; value: number }[]
  threshold?: number
  thresholdLabel?: string
}) {
  const W = 320
  const H = 120
  const PAD = { l: 34, r: 10, t: 12, b: 22 }
  const vals = points.map((p) => p.value)
  const allVals = threshold != null ? [...vals, threshold] : vals
  let lo = Math.min(...allVals)
  let hi = Math.max(...allVals)
  if (hi === lo) { const d = Math.max(1, Math.abs(hi) * 0.1); lo -= d; hi += d }  // tekis seriya
  const padV = (hi - lo) * 0.15
  lo -= padV; hi += padV                                                          // chetga yopishmasin
  const range = hi - lo || 1
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b
  const x = (i: number) =>
    PAD.l + (points.length <= 1 ? iw / 2 : (i / (points.length - 1)) * iw)
  const y = (v: number) => PAD.t + ih - ((v - lo) / range) * ih

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ')

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
        {/* recessive gorizontal gridlar */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={PAD.l}
            x2={W - PAD.r}
            y1={PAD.t + ih * t}
            y2={PAD.t + ih * t}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth={1}
          />
        ))}
        {/* threshold chizig'i */}
        {threshold != null && (
          <>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(threshold)}
              y2={y(threshold)}
              className="stroke-zone-red"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            {thresholdLabel && (
              <text x={W - PAD.r} y={y(threshold) - 3} textAnchor="end" className="fill-zone-red" fontSize={9}>
                {thresholdLabel}
              </text>
            )}
          </>
        )}
        {/* y-min / y-max belgilar */}
        <text x={PAD.l - 6} y={PAD.t + 4} textAnchor="end" className="fill-slate-400" fontSize={9}>
          {Math.round(hi)}
        </text>
        <text x={PAD.l - 6} y={PAD.t + ih} textAnchor="end" className="fill-slate-400" fontSize={9}>
          {Math.round(lo)}
        </text>
        {/* chiziq */}
        <path d={linePath} fill="none" className="stroke-brand" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* markerlar */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.value)} r={4} className="fill-brand" />
            <title>{`${p.label}: ${p.value}`}</title>
          </g>
        ))}
        {/* x yorliqlari (birinchi/oxirgi) */}
        {points.length > 0 && (
          <>
            <text x={x(0)} y={H - 6} textAnchor="start" className="fill-slate-400" fontSize={9}>
              {points[0].label}
            </text>
            <text x={x(points.length - 1)} y={H - 6} textAnchor="end" className="fill-slate-400" fontSize={9}>
              {points[points.length - 1].label}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
