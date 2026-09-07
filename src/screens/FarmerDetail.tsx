import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppState } from '../data/store'
import { createPlot } from '../data/repository'
import { createExpense } from '../data/repository'
import { deleteFarmer } from '../data/repository'
import { totalRepaid } from '../data/repository'
import { fmtDate, fmtMoney, fmtRelative, fmtShortDate } from '../data/format'
import { Avatar, Chip, confirmDialog, HEALTH_TONE, Initials, Meta, toast, Button, Field, Seg } from '../components/kit'
import {
  IconBell,
  IconChevronLeft,
  IconChevronRight,
  IconExpense,
  IconLeaf,
  IconMail,
  IconMapPin,
  IconPhone,
  IconPlus,
  IconSync,
  IconTrash,
  IconWallet,
} from '../components/icons'
import { CHANNELS } from '../data/sync'
import type { ExpenseCategory } from '../domain/types'
import { CATEGORIES, CATEGORY_LABEL } from './Expenses'

export default function FarmerDetail() {
  const nav = useNavigate()
  const { id } = useParams()
  const db = useAppState((s) => s.db)
  const online = useAppState((s) => s.online)
  const farmer = db.farmers.find((f) => f.id === id)

  const [showPlot, setShowPlot] = useState(false)
  const [plot, setPlot] = useState({
    name: '',
    crop: 'Palay (rice)',
    areaHa: '1.0',
    soilType: 'Sandy loam',
    season: 'Summer 2026',
    plantedDate: new Date().toISOString().slice(0, 10),
    expectedYieldT: '2.0',
    health: 'good',
  })
  const [showExpense, setShowExpense] = useState(false)
  const [expense, setExpense] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'seeds' as ExpenseCategory,
    amount: '',
    description: '',
  })

  if (!farmer) {
    return (
      <div className="card">
        <p>Farmer not found.</p>
        <Link to="/farmers" className="btn btn-ghost mt-4">Back to farmers</Link>
      </div>
    )
  }
  const f = farmer

  const plots = db.plots.filter((p) => p.farmerId === f.id)
  const visits = db.visits
    .filter((v) => v.farmerId === f.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const cashAdvances = db.cashAdvances.filter((i) => i.farmerId === f.id)
  const expenses = db.expenses
    .filter((e) => e.farmerId === f.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const outstanding = cashAdvances.reduce(
    (sum, i) => sum + (i.status === 'active' || i.status === 'overdue' ? i.principal - totalRepaid(i) : 0),
    0,
  )

  function addPlot(e: FormEvent) {
    e.preventDefault()
    createPlot(
      {
        farmerId: f.id,
        name: plot.name.trim() || `${plot.crop} field`,
        crop: plot.crop,
        areaHa: parseFloat(plot.areaHa) || 1,
        soilType: plot.soilType,
        season: plot.season,
        plantedDate: new Date(plot.plantedDate).toISOString(),
        expectedYieldT: parseFloat(plot.expectedYieldT) || 0,
        health: plot.health as 'good' | 'fair' | 'poor',
      },
      { quiet: plots.length === 0 },
    )
    toast(`Plot added — queued via ${CHANNELS['cloud-api'].short}`)
    setShowPlot(false)
  }

  function addExpense(e: FormEvent) {
    e.preventDefault()
    const amt = parseFloat(expense.amount)
    if (!amt || amt <= 0) {
      toast('Enter a valid amount', 'alert')
      return
    }
    createExpense({
      farmerId: f.id,
      date: new Date(expense.date).toISOString(),
      category: expense.category,
      amount: Math.round(amt),
      description: expense.description.trim() || undefined,
    })
    toast(`Expense saved — queued via ${CHANNELS['cloud-api'].short}`)
    setShowExpense(false)
    setExpense({ date: new Date().toISOString().slice(0, 10), category: 'seeds', amount: '', description: '' })
  }

  return (
    <>
      <div className="page-header">
        <div className="flex gap-md">
          <Link to="/farmers" className="icon-btn" aria-label="Back">
            <IconChevronLeft />
          </Link>
          <div>
            <div className="crumb">{f.village}, {f.district}</div>
            <h1 className="mt-2" style={{ fontSize: 21 }}>{f.name}</h1>
          </div>
        </div>
        <div className="flex gap-md">
          <Link to={`/farmers/${f.id}/edit`} className="btn btn-ghost btn-sm">Edit profile</Link>
          <button
            className="btn btn-danger-ghost btn-sm"
            onClick={() =>
              confirmDialog(`Delete ${f.name}?`, `${f.village} and her plots, visits and cash advance records will be removed from your device and queued for deletion on the central server.`, () => {
                deleteFarmer(f.id)
                toast(online ? `Farmer deletion queued via ${CHANNELS['sms-gateway'].short}` : 'Farmer deleted — saves when reconnected', online ? 'ok' : 'alert')
                nav('/farmers')
              })
            }
          >
            <IconTrash width={14} height={14} /> Delete
          </button>
        </div>
      </div>

      <section className="card">
        <div className="flex between">
          <div className="flex gap-md">
            <Avatar initials={Initials(f.name)} size={48} />
            <div>
              <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                <span className="flex gap-sm" style={{ fontSize: 13, color: 'var(--text)' }}>
                  <IconMapPin width={14} height={14} /> {f.village}
                </span>
                <span className="flex gap-sm" style={{ fontSize: 13, color: 'var(--text)' }}>
                  <IconPhone width={14} height={14} /> {f.phone}
                </span>
                {f.email && (
                  <span className="flex gap-sm" style={{ fontSize: 13, color: 'var(--text)' }}>
                    <IconMail width={14} height={14} /> {f.email}
                  </span>
                )}
              </div>
              <div className="flex gap-sm mt-2 wrap">
                <Chip tone={f.creditRisk === 'low' ? 'tone-green' : f.creditRisk === 'medium' ? 'tone-amber' : 'tone-red'}>
                  {f.creditRisk} credit risk
                </Chip>
                <Chip tone="tone-brand">Joined {fmtRelative(f.joinedDate)}</Chip>
                <Chip tone="tone-gold">{f.sourceChannel} · origin</Chip>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Meta
            rows={[
              ['Farm size', `${f.farmSizeHa} ha`],
              ['Primary crop', f.primaryCrop],
              ['Municipality', f.district],
              ['Plots', String(plots.length)],
              ['Visits logged', String(visits.length)],
              ['Outstanding cash advance', fmtMoney(outstanding)],
              ['Farm expenses', fmtMoney(expensesTotal)],
            ]}
          />
        </div>

        <div className="flex gap-md mt-4">
          <a className="btn btn-soft grow" href={`sms:${f.phone.replace(/[^\d+]/g, '')}`}>
            <IconPhone width={15} height={15} /> Text farmer
          </a>
          {f.email ? (
            <a className="btn btn-ghost grow" href={`mailto:${f.email}`}>
              <IconMail width={15} height={15} /> Email farmer
            </a>
          ) : (
            <span className="btn btn-ghost grow" style={{ opacity: 0.5, pointerEvents: 'none' }}>
              <IconMail width={15} height={15} /> No email on file
            </span>
          )}
        </div>

        {!online && (
          <div className="flex gap-sm mt-4" style={{ background: 'var(--amber-soft)', borderRadius: 10, padding: '10px 12px' }}>
            <IconSync width={16} height={16} style={{ color: 'var(--amber)' }} />
            <span style={{ fontSize: 13, color: 'var(--gold-ink)' }}>
              Changes save on this device and sync automatically when you reconnect.
            </span>
          </div>
        )}
      </section>

      <div className="flex gap-md mt-5">
        <Link to={`/farmers/${f.id}/visit`} className="btn btn-primary grow">
          <IconPlus width={16} height={16} /> Log visit
        </Link>
        <button className="btn btn-ghost grow" onClick={() => setShowPlot((v) => !v)}>
          <IconLeaf width={16} height={16} /> Add plot
        </button>
      </div>

      {showPlot && (
        <form onSubmit={addPlot} className="card mt-4" style={{ borderColor: 'var(--brand)' }}>
          <h3 className="mb-3">New plot</h3>
          <div className="form-grid">
            <Field label="Plot name">
              <input className="input" value={plot.name} onChange={(e) => setPlot({ ...plot, name: e.target.value })} placeholder="e.g. Upper field" />
            </Field>
            <Field label="Crop">
              <select className="select" value={plot.crop} onChange={(e) => setPlot({ ...plot, crop: e.target.value })}>
                {['Palay (rice)', 'Corn', 'Onion', 'Garlic', 'Vegetables', 'Mango', 'Sweet potato'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Area (ha)">
              <input className="input" type="number" step="0.1" value={plot.areaHa} onChange={(e) => setPlot({ ...plot, areaHa: e.target.value })} />
            </Field>
            <Field label="Soil type">
              <select className="select" value={plot.soilType} onChange={(e) => setPlot({ ...plot, soilType: e.target.value })}>
                {['Sandy loam', 'Clay loam', 'Coastal sand', 'Loam'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Season">
              <select className="select" value={plot.season} onChange={(e) => setPlot({ ...plot, season: e.target.value })}>
                {['Summer 2026', 'Winter 2026'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Planted">
              <input className="input" type="date" value={plot.plantedDate} onChange={(e) => setPlot({ ...plot, plantedDate: e.target.value })} />
            </Field>
            <Field label="Expected yield (t)">
              <input className="input" type="number" step="0.1" value={plot.expectedYieldT} onChange={(e) => setPlot({ ...plot, expectedYieldT: e.target.value })} />
            </Field>
            <Field label="Crop health">
              <div className="pill-row">
                {(['good', 'fair', 'poor'] as const).map((h) => (
                  <button type="button" key={h} className={`pill${plot.health === h ? ' on' : ''}`} onClick={() => setPlot({ ...plot, health: h })}>
                    {h}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="flex gap-md mt-4">
            <Button type="submit" block>Save plot</Button>
            <button className="btn btn-ghost" onClick={() => setShowPlot(false)}>Cancel</button>
          </div>
        </form>
      )}

      <Seg icon={<IconLeaf width={14} height={14} />}>Farm plots</Seg>
      <section className="card">
        {plots.length === 0 ? (
          <p className="text-sm text-mute">No plots recorded yet.</p>
        ) : (
          plots.map((p) => (
            <div className="row-link" key={p.id}>
              <span className="feed-icon"><IconLeaf width={16} height={16} /></span>
              <div className="row-main">
                <div className="row-title">{p.name}</div>
                <div className="row-sub">{p.crop} · {p.areaHa} ha · {p.soilType} · planted {fmtShortDate(p.plantedDate)} · yield est {p.expectedYieldT} t</div>
              </div>
              <Chip tone={HEALTH_TONE[p.health]}>{p.health}</Chip>
            </div>
          ))
        )}
      </section>

      <Seg>Field visits</Seg>
      <section className="card">
        {visits.length === 0 ? (
          <p className="text-sm text-mute">No visits logged yet — log the first one above.</p>
        ) : (
          visits.map((v) => (
            <div className="feed-item" key={v.id}>
              <span className="feed-icon"><IconPhone width={15} height={15} /></span>
              <div className="feed-body grow">
                <div className="feed-title">{v.purpose}</div>
                <div className="feed-sub">{fmtDate(v.date)} · {v.cropStage} · {v.health === 'good' ? 'Healthy' : v.health === 'fair' ? 'Fair' : 'At risk'}</div>
              </div>
              <span className="feed-time">{fmtRelative(v.date)}</span>
            </div>
          ))
        )}
      </section>

      <Seg icon={<IconWallet width={14} height={14} />}>Farm expenses</Seg>
      <section className="card">
        {expenses.length === 0 && !showExpense ? (
          <p className="text-sm text-mute">No expenses recorded yet — add the first one.</p>
        ) : (
          <>
            {expenses.map((e) => (
              <div className="feed-item" key={e.id}>
                <span className="feed-icon"><IconExpense width={15} height={15} /></span>
                <div className="feed-body grow">
                  <div className="feed-title">
                    <Chip tone={expenseTone(e.category)}>{CATEGORY_LABEL[e.category]}</Chip>
                    {' '}{e.description ?? 'Farm expense'}
                  </div>
                  <div className="feed-sub">{fmtDate(e.date)}</div>
                </div>
                <span className="mono" style={{ fontWeight: 650, color: 'var(--ink)' }}>{fmtMoney(e.amount)}</span>
              </div>
            ))}
            {expenses.length > 0 && (
              <div className="flex between" style={{ marginTop: 12, borderTop: '1px dashed var(--line)', paddingTop: 12 }}>
                <span className="text-mute text-sm" style={{ fontWeight: 650 }}>TOTAL EXPENSES</span>
                <span className="mono" style={{ fontWeight: 750, color: 'var(--ink)', fontSize: 16 }}>{fmtMoney(expensesTotal)}</span>
              </div>
            )}
          </>
        )}

        {showExpense && (
          <form onSubmit={addExpense} className="mt-4" style={{ borderTop: '1px dashed var(--line)', paddingTop: 14 }}>
            <div className="flex gap-md between">
              <span className="card-title">Add farm expense</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowExpense(false)}>Cancel</button>
            </div>
            <div className="form-grid mt-3">
              <Field label="Date">
                <input className="input" type="date" value={expense.date} onChange={(e) => setExpense({ ...expense, date: e.target.value })} required />
              </Field>
              <Field label="Category">
                <select className="select" value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value as ExpenseCategory })}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Amount (₱)">
                <input className="input mono" inputMode="decimal" placeholder="0" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} required />
              </Field>
              <Field label="Description" className="grow">
                <input className="input" placeholder="What was it for?" value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} />
              </Field>
            </div>
            <Button type="submit" block className="mt-3">
              <IconPlus width={15} height={15} /> Save expense
            </Button>
          </form>
        )}
      </section>

      <div className="flex gap-md mt-3" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowExpense((v) => !v)}>
          <IconExpense width={15} height={15} /> {showExpense ? 'Hide expense form' : 'Add expense'}
        </button>
      </div>

      <Seg>Cash Advances</Seg>
      <section className="card">
        {cashAdvances.length === 0 ? (
          <p className="text-sm text-mute">No cash advances yet — open the Cash Advances tab to add one.</p>
        ) : (
          cashAdvances.map((inv) => {
            const pct = Math.min(100, Math.round((totalRepaid(inv) / Math.max(1, inv.principal)) * 100))
            return (
              <Link to="/cash-advances" key={inv.id} className="row-link">
                <span className="avatar" style={{ background: 'linear-gradient(150deg,#d99a2b,#c78a1f)', width: 38, height: 38 }}>
                  <IconLeaf width={16} height={16} />
                </span>
                <div className="row-main">
                  <div className="row-title">{inv.label}</div>
<div className="row-sub">{fmtMoney(inv.principal)} · {pct}% repaid · due {fmtShortDate(inv.dueDate)}</div>
                <div className="progress mt-2" style={{ height: 5 }}>
                  <span style={{ width: `${pct}%`, background: inv.status === 'overdue' ? 'var(--red)' : undefined }} />
                </div>
              </div>
              {inv.farmerMessages && inv.farmerMessages.length > 0 && (
                <Chip tone="tone-gold">
                  <IconBell width={12} height={12} /> {inv.farmerMessages.length}
                </Chip>
              )}
              <Chip tone={inv.status === 'overdue' ? 'tone-red' : inv.status === 'repaid' ? 'tone-green' : 'tone-blue'}>
                  {inv.status}
                </Chip>
                <IconChevronRight width={16} height={16} style={{ color: 'var(--muted)' }} />
              </Link>
            )
          })
        )}
      </section>
    </>
  )
}

function expenseTone(cat: ExpenseCategory): string {
  return CATEGORIES.find((c) => c.id === cat)?.tone ?? 'tone-grey'
}