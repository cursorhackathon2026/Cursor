export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime()
  const s = Math.floor((Date.now() - d) / 1000)
  if (s < 60) return 'hozir'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} daq oldin`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} soat oldin`
  const dd = Math.floor(h / 24)
  return `${dd} kun oldin`
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function todayStr(): string {
  const d = new Date()
  const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}
