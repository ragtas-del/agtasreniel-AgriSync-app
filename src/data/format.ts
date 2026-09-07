export function fmtMoney(n: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function fmtNum(n: number, digits = 1): string {
  return new Intl.NumberFormat('en-PH', { maximumFractionDigits: digits }).format(n)
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtShortDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { day: 'numeric', month: 'short' })
}

export function fmtPct(n: number, digits = 0): string {
  return `${new Intl.NumberFormat('en-PH', { maximumFractionDigits: digits }).format(n)}%`
}

export function fmtRelative(iso?: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return fmtShortDate(iso)
}

export function fmtTimeOfDay(iso?: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

export function isOverdue(iso?: string | null): boolean {
  return !!iso && new Date(iso).getTime() < Date.now()
}