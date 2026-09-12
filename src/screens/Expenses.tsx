import { useMemo, useState, type FormEvent } from 'react'
import { useAppState } from '../data/store'
import { createExpense } from '../data/repository'
import { fmtDate, fmtMoney } from '../data/format'
import { Button, Chip, Field, Seg, toast } from '../components/kit'
import { IconDownload, IconExpense, IconPlus, IconSearch, IconWallet } from '../components/icons'
import type { DB, Expense, ExpenseCategory } from '../domain/types'

export const CATEGORIES: { id: ExpenseCategory; label: string; tone: string; color: string }[] = [
  { id: 'seeds', label: 'Seeds', tone: 'tone-green', color: '#2f7d4f' },
  { id: 'fertilizer', label: 'Fertilizer', tone: 'tone-gold', color: '#d99a2b' },
  { id: 'fuel', label: 'Fuel', tone: 'tone-blue', color: '#2f6b8f' },
  { id: 'other', label: 'Other', tone: 'tone-red', color: '#bf4b33' },
]

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))

const PRESET_AMOUNTS = [1500, 2500, 3000, 4200, 5000, 5500]

export default function Expenses() {
  const db = useAppState((s) => s.db)
  const online = useAppState((s) => s.online)
  const [showForm, setShowForm] = useState(true)

  const expenses = useMemo(
    () => [...db.expenses].sort((a, b) => b.date.localeCompare(a.date)),
    [db.expenses],
  )
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const byCategory = useMemo(() => {
    const sums = new Map<ExpenseCategory, number>()
    for (const e of db.expenses) sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount)
    const ordering: ExpenseCategory[] = ['seeds', 'fertilizer', 'fuel', 'other']
    return ordering
      .map((c) => ({ category: c, label: CATEGORY_LABEL[c], amount: sums.get(c) ?? 0 }))
      .filter((r) => r.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [db.expenses])

  return (
    <>
      <div className="page-header">
        <div>
          <div className="crumb">Farm operations finance</div>
          <h1 className="mt-2">Farm Expenses</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          <IconPlus width={16} height={16} /> {showForm ? 'Hide form' : 'New expense'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-row">
            <span className="card-title">Add farm expense</span>
          </div>
          <ExpenseForm online={online} onSaved={() => setShowForm(false)} />
        </div>
      )}

      {expenses.length > 0 && <RecordsTable expenses={expenses} />}

      <div className="seg-title mt-5">
        <IconExpense width={14} height={14} /> Expense report
      </div>
      <div className="card">
        <div className="stat-grid">
          <StatBox label="Total farmers" value={String(db.farmers.length)} note="Registered profiles" />
          <StatBox label="Total expenses" value={fmtMoney(total)} note={`${expenses.length} records`} />
          <StatBox label="Avg per record" value={fmtMoney(Math.round(total / Math.max(1, expenses.length)))} note="Approximate" />
          <StatBox label="Top category" value={byCategory[0]?.label ?? '—'} note={byCategory[0] ? fmtMoney(byCategory[0].amount) : 'No expenses yet'} />
        </div>

        <Seg icon={<IconWallet width={13} height={13} />} style={{ marginTop: 18 }}>
          Breakdown by category
        </Seg>
        {byCategory.length === 0 ? (
          <p className="text-sm text-mute">No expenses recorded yet — add your first expense above.</p>
        ) : (
          <div className="mt-2">
            {byCategory.map(({ category, label, amount }) => (
              <div key={category} className="expense-bar">
                <div className="flex between" style={{ fontSize: 13, marginBottom: 6 }}>
                  <span className="expense-bar-label">
                    <ChipDot color={bareTone(category).color} /> {label}
                  </span>
                  <span style={{ fontWeight: 650, color: 'var(--ink)' }}>{fmtMoney(amount)}</span>
                </div>
                <div className="progress" style={{ height: 14 }}>
                  <span style={{ width: `${Math.max(4, (amount / Math.max(1, total)) * 100)}%`, background: `linear-gradient(90deg, ${bareTone(category).color}, ${bareTone(category).color}cc)` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <Button variant="accent" block className="mt-4" onClick={() => downloadReport(db)}>
          <IconDownload width={16} height={16} /> Generate report
        </Button>
      </div>
    </>
  )
}

function StatBox({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ fontSize: 20 }}>{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  )
}

function ChipDot({ color }: { color: string }) {
  return <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: color, verticalAlign: '-0.5px' }} />
}

function bareTone(cat: ExpenseCategory) {
  return CATEGORIES.find((c) => c.id === cat)!
}

function ExpenseForm({ online, onSaved }: { online: boolean; onSaved: () => void }) {
  const db = useAppState((s) => s.db)
  const farmers = [...db.farmers].sort((a, b) => a.name.localeCompare(b.name))
  const [farmerId, setFarmerId] = useState('')
  const [date, setDate] = useState(todayInput())
  const [category, setCategory] = useState<ExpenseCategory>('seeds')
  const [presetVal, setPresetVal] = useState<number | 'custom'>('custom')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const f = db.farmers.find((x) => x.id === farmerId)
    if (!f) {
      toast('Select a farmer', 'alert')
      return
    }
    const amt = presetVal === 'custom' ? parseFloat(amount) : presetVal
    if (!amt || amt <= 0) {
      toast('Enter a valid amount', 'alert')
      return
    }
    createExpense({
      farmerId: f.id,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      category,
      amount: Math.round(amt),
      description: description.trim() || undefined,
    })
    toast(
      online ? `Expense queued via Cloud API for ${f.name.split(' ')[0]}` : 'Expense saved on device — syncs later',
      online ? 'ok' : 'alert',
    )
    onSaved()
    setFarmerId(''); setDate(todayInput()); setPresetVal('custom'); setAmount(''); setDescription('')
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <Field label="Farmer">
          <select className="select" value={farmerId} onChange={(e) => setFarmerId(e.target.value)} required>
            <option value="">Select farmer…</option>
            {farmers.map((f) => (
              <option key={f.id} value={f.id}>{f.name} — {f.village}</option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Expense category">
          <div className="pill-row">
            {CATEGORIES.map((c) => (
              <button type="button" key={c.id} className={`pill${category === c.id ? ' on' : ''}`} onClick={() => setCategory(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Amount (₱)">
        <div className="pill-row mb-3">
          {PRESET_AMOUNTS.map((a) => (
            <button type="button" key={a} className={`pill pill-sm${presetVal === a ? ' on' : ''}`} onClick={() => setPresetVal(a)}>
              ₱{a.toLocaleString()}
            </button>
          ))}
          <button type="button" className={`pill pill-sm${presetVal === 'custom' ? ' on' : ''}`} onClick={() => setPresetVal('custom')}>
            Custom…
          </button>
        </div>
        {presetVal === 'custom' && (
          <div className="amount-wrap">
            <span className="amount-prefix">₱</span>
            <input
              className="input mono"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
        )}
      </Field>

      <Field label="Description" hint="Optional — what the expense was for.">
        <textarea
          className="textarea"
          style={{ minHeight: 64 }}
          placeholder="e.g. Inbred rice seed for wet season planting"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="flex gap-md mt-4" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost" onClick={onSaved}>Cancel</button>
        <Button type="submit">
          <IconPlus width={15} height={15} /> Save expense
        </Button>
      </div>
    </form>
  )
}

function RecordsTable({ expenses }: { expenses: Expense[] }) {
  const db = useAppState((s) => s.db)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | ExpenseCategory>('all')

  const query = q.trim().toLowerCase()
  const rows = expenses
    .map((e) => ({ expense: e, farmerName: db.farmers.find((f) => f.id === e.farmerId)?.name ?? 'Unknown' }))
    .filter(({ expense, farmerName }) => {
      const matchQ =
        !query ||
        farmerName.toLowerCase().includes(query) ||
        expense.description?.toLowerCase().includes(query) ||
        CATEGORY_LABEL[expense.category].toLowerCase().includes(query)
      const matchF = filter === 'all' || expense.category === filter
      return matchQ && matchF
    })

  return (
    <>
      <div className="seg-title mt-5">
        <IconWallet width={14} height={14} /> Expense records
      </div>
      <div className="card">
        <div className="flex gap-md wrap mb-3" style={{ alignItems: 'flex-end' }}>
          <div className="search-box">
            <IconSearch width={18} height={18} />
            <input className="input" placeholder="Search farmer, description or category…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="select" style={{ width: 170 }} value={filter} onChange={(e) => setFilter(e.target.value as 'all' | ExpenseCategory)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-mute">No expense records match.</p>
        ) : (
          <>
            <div className="expense-table">
              <div className="expense-row expense-head">
                <span>Date</span>
                <span>Farmer</span>
                <span>Category</span>
                <span className="mono">Amount</span>
              </div>
              {rows.map(({ expense, farmerName }) => {
                const t = bareTone(expense.category)
                return (
                  <div className="expense-row" key={expense.id}>
                    <span>{fmtDate(expense.date)}</span>
                    <span>{farmerName}</span>
                    <span><Chip tone={t.tone}>{CATEGORY_LABEL[expense.category]}</Chip></span>
                    <span className="mono" style={{ fontWeight: 650, color: 'var(--ink)' }}>{fmtMoney(expense.amount)}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex between" style={{ marginTop: 14, borderTop: '1px dashed var(--line)', paddingTop: 12 }}>
              <span className="text-mute text-sm" style={{ fontWeight: 650 }}>TOTAL EXPENSE · {rows.length} record{rows.length === 1 ? '' : 's'}</span>
              <span className="mono" style={{ fontWeight: 750, color: 'var(--ink)', fontSize: 16 }}>{fmtMoney(rows.reduce((s, r) => s + r.expense.amount, 0))}</span>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function downloadReport(db: DB): void {
  const farmerName = (id: string) => db.farmers.find((f) => f.id === id)?.name ?? 'Unknown'
  const header = 'Date,Farmer,Category,Amount,Description'
  const lines = db.expenses.map((e) => {
    return [e.date.slice(0, 10), farmerName(e.farmerId), e.category, e.amount, (e.description ?? '').replace(/"/g, '""')]
      .map((v) => `"${v}"`)
      .join(',')
  })
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rice-farm-expense-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast('Expense report generated — download started')
}

function todayInput(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}