import { Link } from 'react-router-dom'
import { useAppState } from '../data/store'
import { dashboardMetrics } from '../data/selectors'
import { fmtMoney, fmtRelative } from '../data/format'
import { Avatar, Chip, Stat } from '../components/kit'
import {
  IconArrowRight,
  IconBell,
  IconCheck,
  IconClock,
  IconCloudOk,
  IconExpense,
  IconFarmers,
  IconInvest,
  IconPlus,
  IconSync,
} from '../components/icons'
import { CHANNELS } from '../data/sync'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const db = useAppState((s) => s.db)
  const outbox = useAppState((s) => s.outbox)
  const online = useAppState((s) => s.online)
  const syncing = useAppState((s) => s.syncing)
  const agent = useAppState((s) => s.settings.agentName)
  const user = useAppState((s) => s.auth.user)
  const displayName = user?.name ?? agent
  const lastSync = useAppState((s) => s.lastSyncAt)
  const m = dashboardMetrics(db, outbox)

  const recent = [...db.visits]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((v) => {
      const farmer = db.farmers.find((f) => f.id === v.farmerId)
      return { ...v, farmerName: farmer?.name ?? 'Unknown farmer' }
    })

  const recentSyncs = [...outbox]
    .filter((o) => o.status === 'synced')
    .sort((a, b) => (b.syncedAt ?? '').localeCompare(a.syncedAt ?? ''))
    .slice(0, 4)

  return (
    <>
      <div className="page-header">
        <div>
          <div className="crumb">Farmer Administrator Console · {m.farmers} farmers enrolled</div>
          <h1 className="mt-2">{greeting()}, {displayName.split(' ')[0]}</h1>
        </div>
        <div className="flex gap-sm">
          <Link to="/farmers/new" className="btn btn-primary btn-sm">
            <IconPlus width={16} height={16} /> New farmer
          </Link>
        </div>
      </div>

      <section
        className="card hero-card"
        style={{ marginBottom: 14 }}
      >
        <div className="flex between" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <div className="hero-kicker">{online ? 'Cloud connected' : 'Offline-first mode'}</div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>
              {online ? 'Channel sync healthy' : 'Working on local data'}
            </h2>
            <p className="mt-2" style={{ fontSize: 13, opacity: 0.92, maxWidth: 420 }}>
              {online
                ? `Sync last completed ${fmtRelative(lastSync)}. ${m.pendingSync} item${m.pendingSync === 1 ? '' : 's'} in the outbox.`
                : `${m.pendingSync} record${m.pendingSync === 1 ? '' : 's'} saved on this device — they'll flow to head office automatically when you reconnect.`}
            </p>
          </div>
          <Chip tone={online ? 'tone-green' : 'tone-amber'} dot>
            {online ? 'Cloud connected' : 'Offline mode'}
          </Chip>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }} className="flex gap-md mt-4 wrap">
          <span className="chip tone-gold">
            <IconClock width={13} height={13} /> Last sync {fmtRelative(lastSync)}
          </span>
          {syncing && (
            <span className="chip tone-blue">
              <IconSync className="spin" width={13} height={13} /> Syncing outbox…
            </span>
          )}
          {!online && m.pendingSync > 0 && (
            <span className="chip tone-amber">
              <IconCloudOk width={13} height={13} /> Queued locally
            </span>
          )}
        </div>
      </section>

      {m.overdueFollowUps > 0 && (
        <div className="card" style={{ borderColor: 'rgba(191,75,51,.35)', background: 'var(--red-soft)' }}>
          <div className="flex between">
            <div className="flex gap-md">
              <span style={{ color: 'var(--red)', display: 'grid' }}>
                <IconBell width={20} height={20} />
              </span>
              <div>
                <div style={{ fontWeight: 650, color: 'var(--ink)' }}>
                  {m.overdueFollowUps} follow-up{m.overdueFollowUps === 1 ? ' is' : 's are'} overdue
                </div>
                <div className="text-sm mt-2" style={{ color: 'var(--text)' }}>
                  Farmers are waiting on the next visit or input confirmation.
                </div>
              </div>
            </div>
            <Link to="/farmers" className="btn btn-sm btn-danger-ghost">
              Review <IconArrowRight width={15} height={15} />
            </Link>
          </div>
        </div>
      )}

      <div className="stat-grid mt-4">
        <Stat label="Farmers" value={m.farmers} note="Registered profiles" icon={<IconFarmers width={14} height={14} />} />
        <Stat label="Visits this week" value={m.visitsThisWeek} note="Field assessments" icon={<IconCheck width={14} height={14} />} />
        <Stat
          label="Outstanding"
          value={fmtMoney(m.outstanding)}
          note={`${m.activeInvestments} active investments`}
          icon={<IconInvest width={14} height={14} />}
        />
        <Stat
          label="Pending sync"
          value={m.pendingSync}
          note={m.poorHealthPlots > 0 ? `${m.poorHealthPlots} plots flagged at risk` : 'All channels clear'}
          icon={<IconSync width={14} height={14} />}
        />
      </div>

      <div className="seg-title mt-5">Recent activity</div>

      <section className="card">
        {recent.length === 0 ? (
          <p className="text-sm text-mute">No visits recorded yet.</p>
        ) : (
          <div className="feed">
            {recent.map((v) => (
              <div className="feed-item" key={v.id}>
                <span className="feed-icon">
                  <IconCheck width={17} height={17} />
                </span>
                <div className="feed-body grow">
                  <div className="feed-title">Visit · {v.purpose}</div>
                  <div className="feed-sub">
                    {v.farmerName} · {v.cropStage} · {v.health}
                  </div>
                </div>
                <span className="feed-time">{fmtRelative(v.date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {recentSyncs.length > 0 && (
        <>
          <div className="seg-title">Latest channel deliveries</div>
          <section className="card">
            {recentSyncs.map((o) => (
              <div className="feed-item" key={o.id}>
                <span className="feed-icon">
                  <span style={{ color: 'var(--green)' }}><IconCheck width={16} height={16} /></span>
                </span>
                <div className="feed-body grow">
                  <div className="feed-title">
                    {o.entity === 'sms'
                      ? 'SMS to farmer'
                      : o.entity === 'email'
                        ? 'Email to farmer'
                        : o.entity === 'farmer'
                          ? 'Farm profile'
                          : o.entity === 'visit'
                            ? 'Field visit'
                            : o.entity === 'investment'
                          ? 'Investment record'
                          : o.entity === 'expense'
                            ? 'Farm expense'
                            : 'Plot record'}{' '}
                    · {o.action}
                  </div>
                  <div className="feed-sub">{o.entityId}</div>
                </div>
                <span className="chip tone-green">{CHANNELS[o.channel].short}</span>
                <span className="feed-time">{fmtRelative(o.syncedAt)}</span>
              </div>
            ))}
          </section>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="mt-5">
        <Link to="/farmers" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'grid' }}><Avatar initials="FV" size={40} /></span>
          <span className="grow">
            <span className="row-title" style={{ fontSize: 14 }}>Field visits</span>
            <span className="row-sub d-block">Log a farm assessment</span>
          </span>
          <IconArrowRight width={17} height={17} style={{ color: 'var(--muted)' }} />
        </Link>
        <Link to="/investments" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'grid' }}><span className="avatar" style={{ background: 'linear-gradient(150deg,#d99a2b,#c78a1f)' }}><IconInvest width={19} height={19} /></span></span>
          <span className="grow">
            <span className="row-title" style={{ fontSize: 14 }}>Investments</span>
            <span className="row-sub d-block">Portfolio & repayments</span>
          </span>
          <IconArrowRight width={17} height={17} style={{ color: 'var(--muted)' }} />
        </Link>
        <Link to="/expenses" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'grid' }}><span className="avatar" style={{ background: 'linear-gradient(150deg,#2e6b4f,#1d4e3b)' }}><IconExpense width={19} height={19} /></span></span>
          <span className="grow">
            <span className="row-title" style={{ fontSize: 14 }}>Farm expenses</span>
            <span className="row-sub d-block">Log cost & reports</span>
          </span>
          <IconArrowRight width={17} height={17} style={{ color: 'var(--muted)' }} />
        </Link>
      </div>
    </>
  )
}