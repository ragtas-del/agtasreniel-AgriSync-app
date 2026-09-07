import { getState, setState } from './store'
import type { ChannelId, DB, OutboxItem, SyncLog, SyncOutcome } from '../domain/types'
import { delay, isoNow, uid } from './util'
import { mailConfigured, sendMail } from './mail'

export const CHANNELS: Record<
  ChannelId,
  { label: string; short: string; desc: string; latency: [number, number]; failRate: number; tone: string }
> = {
  'cloud-api': {
    label: 'AgriLedger Cloud API',
    short: 'Cloud API',
    desc: 'REST integration with the central records hub',
    latency: [350, 1100],
    failRate: 0.05,
    tone: 'green',
  },
  'sms-gateway': {
    label: 'SMS Gateway',
    short: 'SMS',
    desc: 'Farm profiles relayed to head office via SMS forms',
    latency: [800, 2000],
    failRate: 0.12,
    tone: 'amber',
  },
  'ussd-gateway': {
    label: 'USSD Gateway',
    short: 'USSD',
    desc: 'Cash advance records pushed through mobile money rails',
    latency: [600, 1500],
    failRate: 0.08,
    tone: 'gold',
  },
  gmail: {
    label: 'Gmail',
    short: 'Gmail',
    desc: 'Cash advance updates emailed to farmers via Gmail (EmailJS)',
    latency: [500, 1400],
    failRate: 0.1,
    tone: 'brand',
  },
}

function latencyFor(channel: ChannelId): number {
  const [a, b] = CHANNELS[channel].latency
  return a + Math.random() * (b - a)
}

function failFor(channel: ChannelId): boolean {
  return Math.random() < CHANNELS[channel].failRate
}

/** Mark the locally-stored entity as remotely confirmed + record which channel delivered it. */
function confirmEntity(item: OutboxItem, channel: ChannelId): void {
  const entity = item.payload as { id: string }
  if (!entity?.id) return
  setState((s) => {
    const mark = <T extends { id: string }>(list: T[], extra: Partial<T>): T[] =>
      list.map((x) => (x.id === entity.id ? { ...x, ...extra } : x))
    const db = s.db as DB
    const next: DB = {
      farmers: item.entity === 'farmer' ? mark(db.farmers, { sourceChannel: channel } as Partial<DB['farmers'][number]>) : db.farmers,
      plots: db.plots,
      visits: db.visits,
      cashAdvances: db.cashAdvances,
      expenses: db.expenses,
    }
    return { db: next }
  })
}

function updateItem(id: string, patch: Partial<OutboxItem>): void {
  setState((s) => ({
    outbox: s.outbox.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  }))
}

function logEntry(
  channel: ChannelId,
  items: number,
  synced: number,
  failed: number,
  triggeredBy: SyncLog['triggeredBy'],
): SyncLog {
  const outcome: SyncOutcome = failed === 0 ? 'success' : synced === 0 ? 'failed' : 'partial'
  return {
    id: uid('log'),
    startedAt: isoNow(),
    finishedAt: isoNow(),
    channel,
    items,
    synced,
    failed,
    outcome,
    triggeredBy,
  }
}

export async function runSync(
  triggeredBy: SyncLog['triggeredBy'] = 'manual',
): Promise<number> {
  if (getState().syncing) return 0
  const pending = getState().outbox.filter((i) => i.status === 'pending' || i.status === 'failed')
  if (pending.length === 0) {
    setState({ syncing: false, syncingPct: 100, lastSyncAt: isoNow() })
    return 0
  }

  setState({ syncing: true, syncingPct: 0 })

  const byChannel = new Map<ChannelId, OutboxItem[]>()
  for (const item of pending) {
    const list = byChannel.get(item.channel) ?? []
    list.push(item)
    byChannel.set(item.channel, list)
  }

  const logs: SyncLog[] = []
  let done = 0
  const total = pending.length

  for (const [channel, items] of byChannel.entries()) {
    let synced = 0
    let failed = 0
    for (const item of items) {
      updateItem(item.id, { status: 'syncing', attempts: item.attempts + 1 })
      await delay(latencyFor(channel))
      done += 1
      setState({ syncingPct: Math.round((done / total) * 100) })

      let ok = !failFor(channel)
      let error: string | undefined

      if (channel === 'gmail' && item.action === 'notify') {
        const p = item.payload as { recipient?: string; subject?: string; body?: string }
        if (mailConfigured(getState().settings.mail)) {
          try {
            await sendMail(getState().settings.mail, {
              to: p.recipient ?? '',
              subject: p.subject ?? '',
              body: p.body ?? '',
            })
            ok = true
            await delay(300)
          } catch (err) {
            ok = false
            error = err instanceof Error ? err.message : 'Gmail delivery failed'
          }
        } else {
          ok = true
        }
      }

      if (ok) {
        synced += 1
        const t = isoNow()
        updateItem(item.id, { status: 'synced', syncedAt: t })
        confirmEntity(item, channel)
      } else {
        failed += 1
        updateItem(item.id, {
          status: 'failed',
          error:
            error ??
            `Gate${5 + item.attempts}${item.attempts >= 2 ? '2' : ''}: delivery ${item.attempts >= 2 ? 'unconfirmed' : 'timed out'} on ${CHANNELS[channel].short}`,
        })
      }
    }
    logs.push(logEntry(channel, items.length, synced, failed, triggeredBy))
  }

  const remaining = getState().outbox.filter(
    (i) => i.status === 'pending' || i.status === 'syncing' || i.status === 'failed',
  ).length

  setState({
    syncing: false,
    syncingPct: 100,
    syncLogs: [...getState().syncLogs, ...logs.reverse()],
    lastSyncAt: isoNow(),
    db: getState().db,
  })

  if (getState().settings.autoSync && remaining > 0) {
    setTimeout(() => {
      if (getState().online) void runSync('interval')
    }, 2500)
  }

  return syncedCountFromLogs(logs)
}

function syncedCountFromLogs(logs: SyncLog[]): number {
  return logs.reduce((sum, l) => sum + l.synced, 0)
}

export function retryItem(id: string): void {
  updateItem(id, { status: 'pending', error: undefined })
}

export function retryAllFailed(): void {
  setState((s) => ({
    outbox: s.outbox.map((i) =>
      i.status === 'failed' ? { ...i, status: 'pending' as const, error: undefined } : i,
    ),
  }))
}

export function discardSynced(): void {
  setState((s) => ({ outbox: s.outbox.filter((i) => i.status !== 'synced') }))
}