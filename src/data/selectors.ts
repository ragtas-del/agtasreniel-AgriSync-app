import type { DB, Health, OutboxItem, Risk } from '../domain/types'
import { totalRepaid } from './repository'
import { isOverdue } from './format'
import { monthKey } from './util'

export interface PortfolioRow {
  month: string
  disbursed: number
  repaid: number
}

export function dashboardMetrics(db: DB, outbox: OutboxItem[], now = new Date()) {
  const weekAgo = now.getTime() - 7 * 24 * 3600 * 1000
  const visitsThisWeek = db.visits.filter((v) => new Date(v.date).getTime() >= weekAgo).length
  const overdueFollowUps = db.visits.filter((v) => v.followUpDate && isOverdue(v.followUpDate)).length
  const activeInvestments = db.investments.filter((i) => i.status === 'active' || i.status === 'overdue')
  const outstanding = activeInvestments.reduce(
    (sum, i) => sum + (i.principal - totalRepaid(i)),
    0,
  )
  const pendingSync = outbox.filter((o) => o.status === 'pending' || o.status === 'failed').length
  const poorHealthPlots = db.plots.filter((p) => p.health === 'poor').length
  return {
    farmers: db.farmers.length,
    visitsThisWeek,
    overdueFollowUps,
    activeInvestments: activeInvestments.length,
    outstanding,
    pendingSync,
    poorHealthPlots,
  }
}

export function healthCounts(db: DB): Record<Health, number> {
  return {
    good: db.plots.filter((p) => p.health === 'good').length,
    fair: db.plots.filter((p) => p.health === 'fair').length,
    poor: db.plots.filter((p) => p.health === 'poor').length,
  }
}

export function riskCounts(db: DB): Record<Risk, number> {
  return {
    low: db.farmers.filter((f) => f.creditRisk === 'low').length,
    medium: db.farmers.filter((f) => f.creditRisk === 'medium').length,
    high: db.farmers.filter((f) => f.creditRisk === 'high').length,
  }
}

export function visitsPerWeek(db: DB, weeks = 8): { label: string; visits: number }[] {
  const buckets: { label: string; visits: number; start: number }[] = []
  const now = new Date()
  for (let w = weeks - 1; w >= 0; w--) {
    const start = new Date(now)
    start.setDate(start.getDate() - start.getDay() - w * 7)
    const end = start.getTime() + 7 * 24 * 3600 * 1000
    buckets.push({
      label: start.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
      visits: db.visits.filter((v) => {
        const t = new Date(v.date).getTime()
        return t >= start.getTime() && t < end
      }).length,
      start: start.getTime(),
    })
  }
  return buckets.map(({ visits, label }) => ({ visits, label }))
}

export function investmentMix(db: DB): { name: string; value: number }[] {
  const kinds: Record<string, string> = {
    microloan: 'Microloans',
    equipment: 'Equipment',
    'inputs-financing': 'Inputs financing',
    grant: 'Grants',
  }
  const sums = new Map<string, number>()
  for (const inv of db.investments) {
    sums.set(inv.kind, (sums.get(inv.kind) ?? 0) + inv.principal)
  }
  return [...sums.entries()].map(([k, v]) => ({ name: kinds[k] ?? k, value: v }))
}

export function portfolioTrend(db: DB): PortfolioRow[] {
  const rows = new Map<string, PortfolioRow>()
  for (const inv of db.investments) {
    const m = monthKey(inv.disbursedDate)
    const row = rows.get(m) ?? { month: m, disbursed: 0, repaid: 0 }
    row.disbursed += inv.principal
    row.repaid += totalRepaid(inv)
    rows.set(m, row)
  }
  return [...rows.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, r]) => ({ ...r, month: fmtMonth(r.month) }))

  function fmtMonth(key: string): string {
    const d = new Date(`${key}-02T00:00:00`)
    return d.toLocaleDateString('en-ZA', { month: 'short' })
  }
}

export function plotYieldByCrop(db: DB): { name: string; plots: number; totalT: number }[] {
  const crops = new Map<string, { plots: number; totalT: number }>()
  for (const p of db.plots) {
    const c = crops.get(p.crop) ?? { plots: 0, totalT: 0 }
    c.plots += 1
    c.totalT += p.expectedYieldT
    crops.set(p.crop, c)
  }
  return [...crops.entries()].map(([name, v]) => ({ name, ...v }))
}

export function statusCounts(db: DB): { name: string; value: number }[] {
  const labels: Record<string, string> = {
    active: 'Active',
    repaid: 'Repaid',
    overdue: 'Overdue',
    defaulted: 'Defaulted',
  }
  const counts = new Map<string, number>()
  for (const inv of db.investments) {
    counts.set(inv.status, (counts.get(inv.status) ?? 0) + 1)
  }
  return [...counts.entries()].map(([k, v]) => ({ name: labels[k] ?? k, value: v }))
}