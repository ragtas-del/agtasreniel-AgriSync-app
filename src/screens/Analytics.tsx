import { useAppState } from '../data/store'
import {
  healthCounts,
  investmentMix,
  plotYieldByCrop,
  portfolioTrend,
  riskCounts,
  visitsPerWeek,
} from '../data/selectors'
import { COLORS, CropBar, DistributionBar, Donut, TrendLine, VisitBars } from '../components/charts'
import { Chip } from '../components/kit'
import { IconChart } from '../components/icons'

export default function Analytics() {
  const db = useAppState((s) => s.db)
  const outbox = useAppState((s) => s.outbox)
  const lastSync = useAppState((s) => s.lastSyncAt)

  const health = healthCounts(db)
  const risk = riskCounts(db)
  const weeks = visitsPerWeek(db)
  const portfolio = portfolioTrend(db)
  const mix = investmentMix(db)
  const crops = plotYieldByCrop(db)

  return (
    <>
      <div className="page-header">
        <div>
          <div className="crumb">Decision intelligence</div>
          <h1 className="mt-2">Analytics</h1>
        </div>
        <Chip tone="tone-green" dot>Snapshot from last sync</Chip>
      </div>

      {outbox.filter((o) => o.status === 'pending' || o.status === 'failed').length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(217,154,43,.4)', background: 'var(--gold-soft)' }}>
          <div style={{ fontSize: 13, color: 'var(--gold-ink)', fontWeight: 600 }}>
            Analytics reflect the on-device snapshot. {outbox.filter((o) => o.status === 'pending' || o.status === 'failed').length} unsynced record(s) will appear after the next sync.
          </div>
        </div>
      )}

      <div className="card mt-4">
        <div className="card-row">
          <span className="card-title">Field visits · last 8 weeks</span>
        </div>
        <div className="chart-box"><VisitBars data={weeks} /></div>
      </div>

      <div className="split-layout mt-4">
        <div className="card">
          <div className="card-row">
            <span className="card-title">Investment portfolio flow</span>
          </div>
          <div className="chart-box" style={{ height: 230 }}><TrendLine data={portfolio} /></div>
        </div>
        <div className="card">
          <div className="card-row">
            <span className="card-title">Capital mix by facility</span>
          </div>
          <div className="chart-box"><Donut data={mix} colors={[COLORS.brand, COLORS.gold, COLORS.blue, COLORS.green]} /></div>
        </div>
      </div>

      <div className="split-layout mt-4">
        <div className="card">
          <div className="card-row">
            <span className="card-title">Plot health</span>
            <span className="text-mute text-sm">All fields</span>
          </div>
          <div className="mt-4">
            <DistributionBar
              data={[
                { name: 'Good', value: health.good },
                { name: 'Fair', value: health.fair },
                { name: 'At risk', value: health.poor },
              ]}
              colors={[COLORS.green, COLORS.amber, COLORS.red]}
            />
          </div>
          <div className="mt-5">
            <div className="card-row">
              <span className="card-title">Credit risk mix</span>
            </div>
            <DistributionBar
              data={[
                { name: 'Low', value: risk.low },
                { name: 'Medium', value: risk.medium },
                { name: 'High', value: risk.high },
              ]}
              colors={[COLORS.green, COLORS.amber, COLORS.red]}
            />
          </div>
        </div>
        <div className="card">
          <div className="card-row">
            <span className="card-title">Expected yield by crop</span>
            <span className="text-mute text-sm">Season plan</span>
          </div>
          <div className="chart-box" style={{ height: 270 }}><CropBar data={crops} /></div>
        </div>
      </div>

      <div className="seg-title mt-5">
        <IconChart width={14} height={14} /> How this works
      </div>
      <div className="card">
        <p className="text-sm text-mute">
          All figures are computed locally from the AgriLedger data snapshot on this device
          ({lastSync ? `last synced ${lastSync.slice(0, 10)}` : 'not synced yet'}). Because aggregation runs on-device,
          this dashboard stays fully usable without a connection — field intelligence, not just records.
        </p>
      </div>
    </>
  )
}