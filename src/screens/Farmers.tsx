import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../data/store'
import { Avatar, Chip, Initials, Empty } from '../components/kit'
import { IconChevronRight, IconMapPin, IconPlus, IconSearch } from '../components/icons'

export default function Farmers() {
  const farmers = useAppState((s) => s.db.farmers)
  const visits = useAppState((s) => s.db.visits)
  const [q, setQ] = useState('')
  const [risk, setRisk] = useState('all')

  const query = q.trim().toLowerCase()
  const filtered = farmers.filter((f) => {
    const matchQ =
      !query ||
      f.name.toLowerCase().includes(query) ||
      f.village.toLowerCase().includes(query) ||
      f.primaryCrop.toLowerCase().includes(query)
    const matchR = risk === 'all' || f.creditRisk === risk
    return matchQ && matchR
  })

  return (
    <>
      <div className="page-header">
        <div>
          <div className="crumb">Census</div>
          <h1 className="mt-2">Farmers</h1>
        </div>
        <Link to="/farmers/new" className="btn btn-primary btn-sm">
          <IconPlus width={16} height={16} /> Register
        </Link>
      </div>

      <div className="search-box">
        <IconSearch width={18} height={18} />
        <input
          className="input"
          placeholder="Search by name, village or crop…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="pill-row mt-3">
        {(['all', 'low', 'medium', 'high'] as const).map((r) => (
          <button
            key={r}
            className={`pill${risk === r ? ' on' : ''}`}
            onClick={() => setRisk(r)}
          >
            {r === 'all' ? 'All clients' : `${r[0].toUpperCase()}${r.slice(1)} credit risk`}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, margin: '14px 2px 4px' }}>
        {filtered.length} farmer{filtered.length === 1 ? '' : 's'}
      </div>

      <section className="card">
        {filtered.length === 0 ? (
          <Empty icon={<IconSearch width={24} height={24} />} title="No farmers match" sub="Try a different search or register a new farmer." />
        ) : (
          filtered.map((f) => {
            const vCount = visits.filter((v) => v.farmerId === f.id).length
            return (
              <Link to={`/farmers/${f.id}`} key={f.id} className="row-link">
                <Avatar initials={Initials(f.name)} />
                <div className="row-main">
                  <div className="row-title">{f.name}</div>
                  <div className="row-sub">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <IconMapPin width={11} height={11} /> {f.village}, {f.district}
                    </span>
                    {' · '}
                    {f.primaryCrop} · {vCount} visit{vCount === 1 ? '' : 's'}
                  </div>
                </div>
                <Chip tone={f.creditRisk === 'low' ? 'tone-green' : f.creditRisk === 'medium' ? 'tone-amber' : 'tone-red'}>
                  {f.creditRisk}
                </Chip>
                <IconChevronRight width={17} height={17} style={{ color: 'var(--muted)' }} />
              </Link>
            )
          })
        )}
      </section>
    </>
  )
}