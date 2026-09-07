import { useAppState } from '../data/store'
import { CHANNELS, discardSynced, retryAllFailed, retryItem, runSync } from '../data/sync'
import { fmtRelative, fmtTimeOfDay } from '../data/format'
import { Chip, statusTone, toast } from '../components/kit'
import { IconCheck, IconClock, IconCloudOff, IconMail, IconRefresh, IconSync, IconTrash } from '../components/icons'
import type { OutboxItem, SyncLog } from '../domain/types'

const ENTITY_LABEL: Record<OutboxItem['entity'], string> = {
  farmer: 'Farmer profile',
  plot: 'Plot record',
  visit: 'Field visit',
  investment: 'Investment record',
  expense: 'Farm expense',
  sms: 'SMS to farmer',
  email: 'Email to farmer',
}

export default function SyncCenter() {
  const outbox = useAppState((s) => s.outbox)
  const logs = useAppState((s) => s.syncLogs)
  const syncing = useAppState((s) => s.syncing)
  const pct = useAppState((s) => s.syncingPct)
  const online = useAppState((s) => s.online)
  const lastSync = useAppState((s) => s.lastSyncAt)

  const pending = outbox.filter((o) => o.status === 'pending')
  const failed = outbox.filter((o) => o.status === 'failed')
  const synced = outbox.filter((o) => o.status === 'synced')
  const queue = [...outbox]
    .filter((o) => o.status !== 'synced')
  const activeCount = pending.length + failed.length
  const history = [...logs].reverse()

  return (
    <>
      <div className="page-header">
        <div>
          <div className="crumb">Multi-channel delivery</div>
          <h1 className="mt-2">Sync Center</h1>
        </div>
        <span className={`chip ${online ? 'tone-green' : 'tone-amber'}`}>
          <span className="dot" />
          {online ? 'Connected' : 'Offline'}
        </span>
      </div>

      <section className="card sync-status">
        <span className={`ring ${failed.length > 0 ? 'warn' : syncing ? 'pulse' : 'ok'}`}>
          {failed.length > 0 ? (
            <IconCloudOff width={24} height={24} />
          ) : syncing ? (
            <IconSync className="spin" width={24} height={24} />
          ) : (
            <IconCheck width={24} height={24} />
          )}
        </span>
        <div className="grow">
          <h2 style={{ fontSize: 16 }}>
            {failed.length > 0
              ? `${failed.length} item${failed.length === 1 ? '' : 's'} need attention`
              : syncing
                ? `Syncing… ${pct}%`
                : activeCount > 0
                  ? `${activeCount} item${activeCount === 1 ? '' : 's'} waiting to sync`
                  : 'Outbox clear'}
          </h2>
          <p className="text-sm text-mute mt-2">
            {online ? `Last channel response ${fmtRelative(lastSync)}` : 'No network — work will queue locally.'}
          </p>
          {syncing && <div className="progress mt-3"><span style={{ width: `${pct}%` }} /></div>}
        </div>
      </section>

      <div className="flex gap-md mt-4 wrap">
        <button
          className="btn btn-primary grow"
          disabled={syncing || activeCount === 0}
          onClick={() => {
            if (!online) {
              toast('Connect to a network to sync', 'alert')
              return
            }
            void runSync('manual').then((n) =>
              toast(n > 0 ? `${n} record${n === 1 ? '' : 's'} delivered` : 'Nothing to sync'),
            )
          }}
        >
          {syncing ? <IconSync className="spin" width={16} height={16} /> : <IconSync width={16} height={16} />}
          {syncing ? 'Syncing…' : `Sync ${activeCount > 0 ? activeCount : 'now'}`}
        </button>
        <button className="btn btn-ghost" disabled={failed.length === 0} onClick={retryAllFailed}>
          <IconRefresh width={15} height={15} /> Retry failed
        </button>
        <button className="btn btn-soft" disabled={synced.length === 0} onClick={() => { discardSynced(); toast('Synced history cleared from device') }}>
          <IconTrash width={15} height={15} /> Clear synced
        </button>
      </div>

      {queue.length > 0 && (
        <section className="card mt-5">
          <div className="card-row">
            <span className="card-title">Transmission queue</span>
            <span className="text-mute text-sm">{queue.length} on device</span>
          </div>
          {queue.map((o) => (
            <div className="outbox-row" key={o.id}>
              <span className={`feed-icon ${o.status === 'failed' ? '' : ''}`} style={o.status === 'failed' ? { color: 'var(--red)', background: 'var(--red-soft)' } : {}}>
                {o.status === 'failed' ? <IconCloudOff width={16} height={16} /> : o.status === 'syncing' ? <IconSync className="spin" width={16} height={16} /> : <IconClock width={16} height={16} />}
              </span>
              <div className="grow">
                <div className="row-title" style={{ fontSize: 13.5 }}>
                  {ENTITY_LABEL[o.entity]} {o.action === 'update' ? '· update' : ''}
                </div>
                <div className="row-sub mono">
                  {o.entityId}
                  {o.error && <span style={{ color: 'var(--red)', display: 'block' }}>{o.error}</span>}
                </div>
              </div>
              <Chip tone={statusTone(o.status)}>{o.status}</Chip>
              <Chip tone="tone-brand">{CHANNELS[o.channel].short}</Chip>
              <span className="text-xs text-mute" style={{ whiteSpace: 'nowrap' }}>{fmtRelative(o.createdAt)}</span>
              {o.status === 'failed' && (
                <button className="btn btn-sm btn-ghost" onClick={() => retryItem(o.id)}>
                  <IconRefresh width={14} height={14} /> Retry
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      <div className="seg-title mt-5">Channel delivery history</div>
      <section className="card">
        {history.length === 0 ? (
          <p className="text-sm text-mute">
            No syncs yet. New records delivered over the Cloud API, SMS gateway and USSD rails will appear here.
          </p>
        ) : (
          history.slice(0, 10).map((l) => <LogRow key={l.id} l={l} />)
        )}
      </section>

      <div className="seg-title mt-5">Channels</div>
      <section className="card">
        {(Object.keys(CHANNELS) as (keyof typeof CHANNELS)[]).map((id) => (
          <div className="feed-item" key={id}>
            <span className="feed-icon" style={{ color: 'var(--brand)' }}>
              {id === 'sms-gateway' ? <IconClock width={16} height={16} /> : id === 'gmail' ? <IconMail width={16} height={16} /> : <IconRefresh width={16} height={16} />}
            </span>
            <div className="feed-body grow">
              <div className="feed-title">{CHANNELS[id].label}</div>
              <div className="feed-sub">{CHANNELS[id].desc}</div>
            </div>
            <Chip tone="tone-grey" dot>{CHANNELS[id].short}</Chip>
          </div>
        ))}
      </section>
    </>
  )
}

function LogRow({ l }: { l: SyncLog }) {
  return (
    <div className="log-row">
      <span className={`feed-icon ${l.outcome === 'success' ? '' : l.outcome === 'partial' ? 'log-warn' : 'log-err'}`}>
        {l.outcome === 'success' ? <IconCheck width={15} height={15} /> : l.outcome === 'partial' ? <IconClock width={15} height={15} /> : <IconCloudOff width={15} height={15} />}
      </span>
      <div className="grow">
        <div className="flex gap-md wrap">
          <span className="row-title" style={{ fontSize: 13.5 }}>{CHANNELS[l.channel].short} sync</span>
          <Chip tone={l.outcome === 'success' ? 'tone-green' : l.outcome === 'partial' ? 'tone-amber' : 'tone-red'}>
            {l.outcome}
          </Chip>
          {l.failed > 0 && <Chip tone="tone-red">{l.failed} failed</Chip>}
        </div>
        <div className="row-sub mono">
          {l.items} item{l.items === 1 ? '' : 's'} · {l.synced} delivered · {l.triggeredBy}
        </div>
      </div>
      <span className="text-xs text-mute" style={{ whiteSpace: 'nowrap' }}>
        {fmtTimeOfDay(l.finishedAt)} {fmtRelative(l.finishedAt)}
      </span>
    </div>
  )
}