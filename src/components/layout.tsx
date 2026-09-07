import { useEffect, type ReactNode, type SVGProps, type ReactElement } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { getState, logout, useAppState } from '../data/store'
import { runSync } from '../data/sync'
import { toast, Avatar } from './kit'
import {
  IconChart,
  IconCloudOff,
  IconCloudOk,
  IconExpense,
  IconFarmers,
  IconHome,
  IconCashAdvance,
  IconSync,
} from './icons'

export const NAV_ITEMS: {
  to: string
  label: string
  icon: (p: SVGProps<SVGSVGElement>) => ReactElement
  end?: boolean
}[] = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/farmers', label: 'Farmers', icon: IconFarmers },
  { to: '/cash-advances', label: 'Cash Advances', icon: IconCashAdvance },
  { to: '/expenses', label: 'Expenses', icon: IconExpense },
  { to: '/analytics', label: 'Analytics', icon: IconChart },
  { to: '/sync', label: 'Sync', icon: IconSync },
]

function useReconnectAutoSync() {
  useEffect(() => {
    const hadOnline = () => {
      const prev = window.__agriledgerWasOnline
      window.__agriledgerWasOnline = navigator.onLine
      if (navigator.onLine && prev === false && getState().settings.autoSync) {
        void runSync('online-event').then((n) => {
          if (n > 0) toast(`${n} records synced after reconnect`)
        })
      }
    }
    window.addEventListener('online', hadOnline)
    hadOnline()
    return () => window.removeEventListener('online', hadOnline)
  }, [])
}

declare global {
  interface Window {
    __agriledgerWasOnline?: boolean
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  useReconnectAutoSync()
  const online = useAppState((s) => s.online)
  const syncing = useAppState((s) => s.syncing)
  const pending = useAppState(
    (s) => s.outbox.filter((o) => o.status === 'pending' || o.status === 'failed').length,
  )
  const agent = useAppState((s) => s.settings.agentName)
  const user = useAppState((s) => s.auth.user)
  const displayName = user?.name ?? agent
  const initials = user?.initials ?? initialsOf(agent)

  const fatal = pending >= 2 && syncing

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand-mark" aria-label="AgriLedger home">
            <span className="brand-glyph">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22 5 19V9l7-3 7 3v10l-7 3Z" />
                <path d="M5 9l7 3 7-3M12 12v10" />
                <path d="M12 5V2" />
              </svg>
            </span>
            <span>
              <span className="brand-name">AgriLedger</span>
              <span className="brand-sub">Farmer Administrator Console</span>
            </span>
          </Link>

          <nav className="top-nav" aria-label="Main">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Icon width={17} height={17} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-actions">
            <Chip online={online} />
            <SyncButton pending={pending} syncing={syncing} />
            <div className="topbar-user" title={displayName}>
              <span className="topbar-user-name">{displayName}</span>
              <span className="topbar-user-role">{user?.roleLabel ?? 'Farmer Administrator'}</span>
            </div>
            <span style={{ display: 'grid' }}>
              <Avatar initials={initials} size={38} />
            </span>
            <button className="btn btn-ghost btn-sm" onClick={logout} title="Sign out">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {!online && <OfflineBanner pending={pending} />}

      <main className="main">{children}</main>

      <nav className="bottomnav" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `bn-item${isActive ? ' active' : ''}`}
            aria-label={label}
          >
            <Icon width={22} height={22} />
            {label}
            {to === '/sync' && pending > 0 && <span className="bn-dot">{pending}</span>}
          </NavLink>
        ))}
      </nav>

      {pending > 0 && !fatal && (
        <button
          className="fab"
          aria-label="Sync now"
          disabled={syncing}
          onClick={() => {
            if (syncing) return
            void runSync('manual').then((n) => toast(n > 0 ? `${n} records synced` : 'Nothing to sync'))
          }}
        >
          {syncing ? (
            <IconSync className="spin" width={26} height={26} />
          ) : (
            <IconSync width={26} height={26} />
          )}
        </button>
      )}
    </div>
  )
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function Chip({ online }: { online: boolean }) {
  return (
    <span className={`chip ${online ? 'tone-green' : 'tone-amber'}`}>
      <span className="dot" />
      {online ? 'Online' : 'Offline'}
    </span>
  )
}

function SyncButton({ pending, syncing }: { pending: number; syncing: boolean }) {
  return (
    <button
      className={`btn btn-sm ${syncing ? 'btn-soft' : pending > 0 ? 'btn-primary' : 'btn-ghost'}`}
      onClick={() => {
        if (syncing) return
        void runSync('manual').then((n) => toast(n > 0 ? `${n} records synced` : 'All up to date'))
      }}
      disabled={syncing}
      title="Sync outbox"
    >
      {syncing ? <IconSync className="spin" width={16} height={16} /> : <IconSync width={16} height={16} />}
      <span>{syncing ? 'Syncing…' : pending > 0 ? `Sync ${pending}` : 'Synced'}</span>
    </button>
  )
}

function OfflineBanner({ pending }: { pending: number }) {
  return (
    <div className="offline-banner">
      <IconCloudOff width={18} height={18} />
      <span>
        You&rsquo;re offline — {pending > 0 ? `${pending} record${pending === 1 ? '' : 's'} saved on device` : 'data is safe on this device'}.
      </span>
      {pending > 0 && (
        <button
          className="banner-btn"
          onClick={() => {
            if (navigator.onLine) void runSync('manual')
            else toast('Connect to the network to sync', 'alert')
          }}
        >
          <IconCloudOk width={15} height={15} style={{ verticalAlign: '-2px' }} /> Sync
        </button>
      )}
    </div>
  )
}