import { useState, type FormEvent, type ReactNode } from 'react'
import { useAppState } from '../data/store'
import { addFarmerMessage, addRepayment, createCashAdvance, notifyFarmer, sendCashAdvanceEmail, totalRepaid } from '../data/repository'
import { fmtDate, fmtMoney, fmtRelative } from '../data/format'
import { Chip, Field, Meta, Modal, toast, Button, Seg } from '../components/kit'
import { IconCashAdvance, IconPlus, IconSend, IconBell, IconPhone, IconMail } from '../components/icons'
import { CHANNELS } from '../data/sync'
import { mailConfigured } from '../data/mail'
import { cashAdvanceEmailDraft } from '../data/emailDraft'
import { ussdCode } from '../data/util'
import type { Farmer, CashAdvance } from '../domain/types'

function statusTone(status: CashAdvance['status']): string {
  return status === 'overdue' ? 'tone-red' : status === 'repaid' ? 'tone-green' : status === 'defaulted' ? 'tone-red' : 'tone-blue'
}

export default function CashAdvances() {
  const db = useAppState((s) => s.db)
  const online = useAppState((s) => s.online)
  const [showNew, setShowNew] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const cashAdvances = [...db.cashAdvances].sort((a, b) => b.disbursedDate.localeCompare(a.disbursedDate))
  const totalDisbursed = cashAdvances.reduce((s, i) => s + i.principal, 0)
  const totalRepaidSum = cashAdvances.reduce((s, i) => s + totalRepaid(i), 0)
  const outstanding = cashAdvances.reduce(
    (s, i) => s + (i.status === 'active' || i.status === 'overdue' ? i.principal - totalRepaid(i) : 0),
    0,
  )
  const active = cashAdvances.filter((i) => i.status === 'active' || i.status === 'overdue').length

  return (
    <>
      <div className="page-header">
        <div>
          <div className="crumb">Financial inclusion portfolio</div>
          <h1 className="mt-2">Cash Advances</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
          <IconPlus width={16} height={16} /> New cash advance
        </button>
      </div>

      <div className="stat-grid">
        <Stat label="Disbursed" value={fmtMoney(totalDisbursed)} sub={`${cashAdvances.length} records`} />
        <Stat label="Repaid" value={fmtMoney(totalRepaidSum)} sub={`${Math.round((totalRepaidSum / Math.max(1, totalDisbursed)) * 100)}% recovery`} />
        <Stat label="Outstanding" value={fmtMoney(outstanding)} sub={`${active} active`} />
        <Stat label="At risk" value={cashAdvances.filter((i) => i.status === 'overdue' || i.status === 'defaulted').length} sub="overdue / defaulted" />
      </div>

      <div className="seg-title mt-5">Portfolio</div>

      <section className="card">
        {cashAdvances.length === 0 ? (
          <p className="text-sm text-mute">No cash advance records yet.</p>
        ) : (
          cashAdvances.map((inv) => {
            const farmer = db.farmers.find((f) => f.id === inv.farmerId)
            const repaid = totalRepaid(inv)
            const pct = Math.min(100, Math.round((repaid / Math.max(1, inv.principal)) * 100))
            const open = expanded === inv.id
            return (
              <div key={inv.id}>
                <div className="row-link" style={{ cursor: 'pointer' }} onClick={() => setExpanded(open ? null : inv.id)}>
                  <span className="avatar" style={{ background: 'linear-gradient(150deg,#d99a2b,#c78a1f)', width: 40, height: 40 }}>
                    <IconCashAdvance width={18} height={18} />
                  </span>
                  <div className="row-main">
                    <div className="row-title">{inv.label}</div>
                    <div className="row-sub">{farmer?.name} · {inv.kind.replace('-', ' ')}</div>
                    <div className="flex gap-md mt-2 wrap" style={{ fontSize: 12.5, color: 'var(--text)' }}>
                      <span>{fmtMoney(inv.principal)}</span>
                      <span>{pct}% repaid</span>
                      <span>due {fmtDate(inv.dueDate)}</span>
                    </div>
                    <div className="progress mt-2" style={{ height: 6 }}>
                      <span style={{ width: `${pct}%`, background: inv.status === 'overdue' ? 'var(--red)' : undefined }} />
                    </div>
                  </div>
                  <Chip tone={statusTone(inv.status)}>{inv.status}</Chip>
                </div>
                {open && <RepaymentPanel inv={inv} />}
              </div>
            )
          })
        )}
      </section>

      <NewCashAdvanceModal open={showNew} onClose={() => setShowNew(false)} online={online} />
    </>
  )
}

function RepaymentPanel({ inv }: { inv: CashAdvance }) {
  const online = useAppState((s) => s.online)
  const farmer = useAppState((s) => s.db.farmers.find((f) => f.id === inv.farmerId))
  const mailCfg = useAppState((s) => s.settings.mail)
  const mailReady = mailConfigured(mailCfg)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('mobile-money')
  const [message, setMessage] = useState('')
  const [smsText, setSmsText] = useState<string | null>(null)
  const [emailSubject, setEmailSubject] = useState<string | null>(null)
  const [emailBody, setEmailBody] = useState<string | null>(null)

  const messages = inv.farmerMessages ?? []
  const emails = inv.emails ?? []
  const draft =
    smsText ??
    (farmer ? smsDraft(inv, farmer, ussdCode(inv.id)) : '')
  const emailDraftText = farmer ? cashAdvanceEmailDraft(inv, farmer) : { subject: '', body: '' }
  const subject = emailSubject ?? emailDraftText.subject
  const body = emailBody ?? emailDraftText.body

  function add(e: FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      toast('Enter a valid amount', 'alert')
      return
    }
    addRepayment(inv.id, { date: new Date().toISOString(), amount: amt, method: method as 'mobile-money' | 'cash' | 'auto-deduct' | 'bank-transfer' })
    toast(online ? `Repayment queued via ${CHANNELS['ussd-gateway'].short}` : 'Repayment saved on device')
    setAmount('')
  }

  function sendMessage() {
    if (!message.trim()) {
      toast('Type the farmer message first', 'alert')
      return
    }
    addFarmerMessage(inv.id, message)
    toast(online ? `Farmer message queued via ${CHANNELS['ussd-gateway'].short}` : 'Farmer message saved on device')
    setMessage('')
  }

  function sendEmail(e: FormEvent) {
    e.preventDefault()
    if (!farmer?.email) {
      toast('Add an email on the farmer profile first', 'alert')
      return
    }
    const rec = sendCashAdvanceEmail(inv.id, farmer.email, subject, body)
    if (rec) {
      toast(
        online
          ? mailReady
            ? `Email queued — sent to ${farmer.email} on next sync`
            : `Update queued via ${CHANNELS['gmail'].short} (simulated)`
          : 'Email update saved on device — sends when reconnected',
        'ok',
      )
      setEmailSubject(null)
      setEmailBody(null)
    } else {
      toast('Fill in the subject and message first', 'alert')
    }
  }

  return (
    <div className="card flash-in panel-in" style={{ margin: '4px 4px 12px', borderRadius: 12 }}>
      <Meta
        rows={[
          ['Disbursed', fmtDate(inv.disbursedDate)],
          ['Rate', `${inv.interestRatePct}% p.a.`],
          ['Due', fmtDate(inv.dueDate)],
          ['Repaid', fmtMoney(inv.repayments.reduce((s, r) => s + r.amount, 0))],
        ]}
      />
      {inv.repayments.length > 0 && (
        <div className="mt-3">
          {inv.repayments.map((r) => (
            <div className="flex between" key={r.id} style={{ fontSize: 13, padding: '4px 0', borderTop: '1px dashed var(--line)' }}>
              <span className="text-mute">{fmtDate(r.date)} · {r.method}</span>
              <span style={{ fontWeight: 650, color: 'var(--ink)' }}>{fmtMoney(r.amount)}</span>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={add} className="flex gap-sm mt-3 wrap">
        <input className="input mono" style={{ flex: 1, minWidth: 120 }} placeholder="Amount (R)" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        <select className="select" style={{ width: 'auto' }} value={method} onChange={(e) => setMethod(e.target.value)}>
          {['mobile-money', 'cash', 'auto-deduct', 'bank-transfer'].map((m) => <option key={m}>{m}</option>)}
        </select>
        <Button size="sm" type="submit">
          <IconSend width={15} height={15} /> Record
        </Button>
      </form>

      <Seg icon={<IconBell width={13} height={13} />} style={{ marginTop: 14 }}>Farmer messages</Seg>
      {messages.length === 0 ? (
        <p className="text-xs text-mute">No message from the farmer yet. Log their request here so it reaches head office.</p>
      ) : (
        <div className="mt-2">
          {[...messages].reverse().map((n) => (
            <div className="feed-item" key={n.id}>
              <span className="feed-icon" style={{ color: 'var(--gold-ink)', background: 'var(--gold-soft)' }}>
                <IconBell width={14} height={14} />
              </span>
              <div className="feed-body grow">
                <div className="feed-title">{n.text}</div>
                <div className="feed-sub">{fmtRelative(n.date)} · {fmtDate(n.date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-sm mt-3">
        <input
          className="input"
          placeholder="Farmer wants to…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <Button size="sm" onClick={sendMessage}>
          <IconSend width={15} height={15} /> Send
        </Button>
      </div>

      <Seg icon={<IconPhone width={13} height={13} />} style={{ marginTop: 14 }}>Watch on the farmer&rsquo;s phone</Seg>
      {farmer ? (
        <>
          <p className="text-xs text-mute">
            {farmer.name} can watch this facility on her own phone — dial{' '}
            <span className="mono" style={{ fontWeight: 700, color: 'var(--brand)' }}>{ussdCode(inv.id)}</span>{' '}
            to check the balance, or get a status update by SMS to <span className="mono">{farmer.phone}</span>.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const n = notifyFarmer(inv.id, farmer.phone, draft)
              if (n) {
                toast(online ? `Status SMS queued via ${CHANNELS['sms-gateway'].short} to ${farmer.phone}` : 'Status SMS saved — sends when reconnected', online ? 'ok' : 'alert')
                setSmsText(smsDraft(inv, farmer, ussdCode(inv.id)))
              } else {
                toast('Nothing to send', 'alert')
              }
            }}
          >
            <textarea className="textarea" style={{ minHeight: 74 }} value={draft} onChange={(e) => setSmsText(e.target.value)} />
            <div className="flex gap-md mt-2">
              <Button size="sm" block type="submit">
                <IconSend width={15} height={15} /> Send status SMS
              </Button>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => setSmsText(smsDraft(inv, farmer, ussdCode(inv.id)))}>
                Reset text
              </button>
            </div>
          </form>
          <button
            type="button"
            className="btn btn-soft btn-sm btn-block"
            style={{ marginTop: 8 }}
            onClick={() => openSmsApp(farmer.phone, draft)}
          >
            <IconPhone width={15} height={15} /> Send now from this phone
          </button>
          {(inv.sms ?? []).length > 0 && (
            <div className="mt-3">
              {[...(inv.sms ?? [])].reverse().map((s) => (
                <div className="feed-item" key={s.id}>
                  <span className="feed-icon" style={{ color: 'var(--green)', background: 'var(--green-soft)' }}>
                    <IconPhone width={14} height={14} />
                  </span>
                  <div className="feed-body grow">
                    <div className="feed-title">{s.text}</div>
                    <div className="feed-sub">To {s.to} · {fmtRelative(s.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-mute">No contact number on file for this farmer.</p>
      )}

      <Seg icon={<IconMail width={13} height={13} />} style={{ marginTop: 14 }}>Email cash advance updates</Seg>
      {farmer?.email ? (
        <>
          <p className="text-xs text-mute">
            Email {farmer.name.split(' ')[0]} a written cash advance update to{' '}
            <span className="mono" style={{ fontWeight: 600 }}>{farmer.email}</span> —{' '}
            {mailReady
              ? 'delivered to their Gmail inbox when you sync.'
              : 'connect the EmailJS keys in Settings so the farmer actually receives it (sending is currently simulated).'}
          </p>
          <form onSubmit={sendEmail} className="mt-2">
            <input
              className="input"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <textarea
              className="textarea"
              style={{ minHeight: 116, marginTop: 8 }}
              value={body}
              onChange={(e) => setEmailBody(e.target.value)}
            />
            <div className="flex gap-md mt-2">
              <Button size="sm" block type="submit">
                <IconSend width={15} height={15} /> Send update email
              </Button>
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={() => {
                  setEmailSubject(null)
                  setEmailBody(null)
                }}
              >
                Reset text
              </button>
            </div>
          </form>
          <button
            type="button"
            className="btn btn-soft btn-sm btn-block"
            style={{ marginTop: 8 }}
            onClick={() => openMailApp(farmer.email ?? '', subject, body)}
          >
            <IconMail width={15} height={15} /> Send now via Gmail app
          </button>
          {emails.length > 0 && (
            <div className="mt-3">
              {[...emails].reverse().map((m) => (
                <div className="feed-item" key={m.id}>
                  <span className="feed-icon" style={{ color: 'var(--brand)', background: 'var(--brand-soft)' }}>
                    <IconMail width={14} height={14} />
                  </span>
                  <div className="feed-body grow">
                    <div className="feed-title">{m.subject}</div>
                    <div className="feed-sub">To {m.to} · {fmtRelative(m.date)}</div>
                    <div className="feed-sub" style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{m.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-mute">No email on file for this farmer — add one from the farmer profile to send updates by Gmail.</p>
      )}
    </div>
  )
}

function openSmsApp(to: string, text: string): void {
  window.location.href = `sms:${to.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(text)}`
}

function openMailApp(to: string, subject: string, body: string): void {
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function smsDraft(inv: CashAdvance, farmer: Farmer, code: string): string {
  const pct = Math.min(100, Math.round((totalRepaid(inv) / Math.max(1, inv.principal)) * 100))
  return `Rice Farm Expenses: ${farmer.name.split(' ')[0]}, your "${inv.label}" — ${fmtMoney(inv.principal)} total, ${pct}% paid back, due ${fmtDate(inv.dueDate)}. Dial ${code} on your phone to check.`
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ fontSize: 19 }}>{value}</div>
      <div className="stat-note">{sub}</div>
    </div>
  )
}

function NewCashAdvanceModal({ open, onClose, online }: { open: boolean; onClose: () => void; online: boolean }) {
  const db = useAppState((s) => s.db)
  const [farmerId, setFarmerId] = useState('')
  const [kind, setKind] = useState('microloan')
  const [label, setLabel] = useState('')
  const [principal, setPrincipal] = useState('')
  const [rate, setRate] = useState('12')
  const [dueDate, setDueDate] = useState('')
  const [initialMessage, setInitialMessage] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const f = db.farmers.find((x) => x.id === farmerId)
    if (!f) {
      toast('Select a farmer', 'alert')
      return
    }
    const amt = parseFloat(principal) || 0
    if (amt <= 0) {
      toast('Enter a valid amount', 'alert')
      return
    }
    createCashAdvance({
      farmerId: f.id,
      kind: kind as 'microloan' | 'equipment' | 'inputs-financing' | 'grant',
      label: label.trim() || `${kind} for ${f.name.split(' ')[0]}`,
      principal: amt,
      disbursedDate: new Date().toISOString(),
      interestRatePct: parseFloat(rate) || 0,
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 180 * 86400000).toISOString(),
      initialMessage,
    })
    toast(online ? 'Cash advance queued via USSD gateway' : 'Cash advance saved on device — syncs later', online ? 'ok' : 'alert')
    onClose()
    setFarmerId(''); setLabel(''); setPrincipal(''); setRate('12'); setDueDate(''); setInitialMessage('')
  }

  return (
    <Modal open={open} onClose={onClose} title="New cash advance">
      <form onSubmit={submit}>
        <Field label="Farmer">
          <select className="select" value={farmerId} onChange={(e) => setFarmerId(e.target.value)}>
            <option value="">Select farmer…</option>
            {db.farmers.map((f) => (
              <option key={f.id} value={f.id}>{f.name} — {f.village}</option>
            ))}
          </select>
        </Field>
        <Field label="Facility type">
          <div className="pill-row">
            {(['microloan', 'inputs-financing', 'equipment', 'grant'] as const).map((k) => (
              <button type="button" key={k} className={`pill${kind === k ? ' on' : ''}`} onClick={() => setKind(k)}>
                {k.replace('-', ' ')}
              </button>
            ))}
          </div>
        </Field>
        <div className="form-grid">
          <div className="grow">
            <Field label="Amount (ZAR)">
              <input className="input mono" inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="5000" required />
            </Field>
          </div>
          <Field label="Interest rate (% p.a.)">
            <input className="input mono" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
        </div>
        <Field label="Label">
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Seasonal input microloan" />
        </Field>
        <Field label="Due date">
          <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Farmer message (optional)" hint="Record what the farmer wants for this facility — e.g. repayment plan or restructure request.">
          <textarea
            className="textarea"
            placeholder="e.g. I want to add this loan on top of my current one…"
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
          />
        </Field>
        <div className="flex gap-md mt-4">
          <Button type="submit" block>Queue cash advance</Button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}