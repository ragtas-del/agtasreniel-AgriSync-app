import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAppState } from '../data/store'
import { createFarmer, updateFarmer } from '../data/repository'
import { toast, Button, Field } from '../components/kit'
import { IconChevronLeft } from '../components/icons'

const PH_PREFIX = '+63 '

function localNumber(phone: string): string {
  return phone.startsWith('+63') ? phone.replace(/^\+63\s*/, '').trim() : phone
}

function formatLocal(digits: string): string {
  return digits.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3')
}

export default function FarmerForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const existing = useAppState((s) => (id ? s.db.farmers.find((f) => f.id === id) : undefined))
  const isEdit = !!id

  const [form, setForm] = useState(() => ({
    name: existing?.name ?? '',
    phone: existing?.phone ?? PH_PREFIX,
    email: existing?.email ?? '',
    village: existing?.village ?? '',
    district: existing?.district ?? '',
    farmSizeHa: existing?.farmSizeHa?.toString() ?? '2.0',
    primaryCrop: existing?.primaryCrop ?? 'Palay (rice)',
    creditRisk: existing?.creditRisk ?? 'low',
    joinedDate: existing?.joinedDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    notes: existing?.notes ?? '',
  }))

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  function setPhone(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 10)
    set('phone', PH_PREFIX + (digits ? formatLocal(digits) : ''))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const size = parseFloat(form.farmSizeHa) || 0
    if (!form.name.trim()) {
      toast('Farmer name is required', 'alert')
      return
    }
    if (isEdit && existing) {
      updateFarmer(existing.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        village: form.village.trim(),
        district: form.district.trim(),
        farmSizeHa: size,
        primaryCrop: form.primaryCrop,
        creditRisk: form.creditRisk,
      })
      toast('Farmer profile updated — queued for sync')
    } else {
      createFarmer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        village: form.village.trim(),
        district: form.district.trim(),
        farmSizeHa: size,
        primaryCrop: form.primaryCrop,
        creditRisk: form.creditRisk as 'low' | 'medium' | 'high',
        joinedDate: new Date(form.joinedDate).toISOString(),
        notes: form.notes.trim() || undefined,
      })
      toast('Farmer registered — saved on device')
    }
    nav(id ? `/farmers/${id}` : '/farmers')
  }

  return (
    <>
      <div className="page-header">
        <div className="flex gap-md">
          <Link to={id ? `/farmers/${id}` : '/farmers'} className="icon-btn" aria-label="Back">
            <IconChevronLeft />
          </Link>
          <div>
            <div className="crumb">{isEdit ? 'Edit profile' : 'New registration'}</div>
            <h1 className="mt-2" style={{ fontSize: 21 }}>{isEdit ? 'Update farmer' : 'Register farmer'}</h1>
          </div>
        </div>
      </div>

      <form onSubmit={submit}>
        <section className="card">
          <h3 className="mb-4">Farmer details</h3>
          <div className="form-grid">
            <Field label="Name" className="grow">
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Juan Dela Cruz" />
            </Field>
            <Field label="Phone number">
              <div className="phone-wrap">
                <span className="phone-prefix">+63</span>
                <input
                  className="input"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="9XX XXX XXXX"
                  value={localNumber(form.phone)}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </Field>
            <Field label="Email address" hint="Used for Gmail cash advance updates.">
              <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="farmer@gmail.com" />
            </Field>
            <Field label="Village">
              <input className="input" value={form.village} onChange={(e) => set('village', e.target.value)} placeholder="Village / locality" />
            </Field>
            <Field label="City / municipality">
              <input className="input" value={form.district} onChange={(e) => set('district', e.target.value)} placeholder="City or municipality" />
            </Field>
            <Field label="Farm size (ha)" hint="Used for cash advance sizing." className="grow">
              <input className="input" type="number" min="0.1" step="0.1" value={form.farmSizeHa} onChange={(e) => set('farmSizeHa', e.target.value)} />
            </Field>
            <Field label="Primary crop">
              <select className="select" value={form.primaryCrop} onChange={(e) => set('primaryCrop', e.target.value)}>
                {['Palay (rice)', 'Corn', 'Onion', 'Garlic', 'Vegetables', 'Mango', 'Sweet potato'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Credit risk" hint="Financial-inclusion profile used for lending eligibility.">
              <div className="pill-row">
                {(['low', 'medium', 'high'] as const).map((r) => (
                  <button
                    type="button"
                    key={r}
                    className={`pill${form.creditRisk === r ? ' on' : ''}`}
                    onClick={() => set('creditRisk', r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Joined date">
              <input className="input" type="date" value={form.joinedDate} onChange={(e) => set('joinedDate', e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="card">
          <h3 className="mb-4">Notes (optional)</h3>
          <textarea
            className="textarea"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Land tenure, water access, off-farm income, etc."
          />
        </section>

        <div className="flex gap-md mt-4">
          <Button type="submit" block>{isEdit ? 'Save changes' : 'Register farmer'}</Button>
          <Link to={id ? `/farmers/${id}` : '/farmers'} className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}