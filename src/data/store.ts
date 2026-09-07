import { useSyncExternalStore } from 'react'
import { seed } from './seed'
import type { AppSettings, AuthState, DB, OutboxItem, SyncLog, User } from '../domain/types'

const KEYS = {
  db: 'agriledger.db.v1',
  outbox: 'agriledger.outbox.v1',
  logs: 'agriledger.synclogs.v1',
  settings: 'agriledger.settings.v1',
  meta: 'agriledger.meta.v1',
  auth: 'agriledger.auth.v1',
}

const DEFAULT_SETTINGS: AppSettings = {
  agentName: seed.agent.name,
  region: seed.agent.region,
  autoSync: true,
  preferredChannel: 'cloud-api',
  lastFullSync: new Date().toISOString(),
  mail: {
    serviceId: '',
    templateId: '',
    publicKey: '',
  },
}

export interface AppState {
  db: DB
  outbox: OutboxItem[]
  syncLogs: SyncLog[]
  settings: AppSettings
  auth: AuthState
  online: boolean
  syncing: boolean
  syncingPct: number
  lastSyncAt: string | null
  seeded: boolean
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or unavailable — keep running in memory */
  }
}

const seeded = load(KEYS.meta, null) !== null
const meta = load<{ seeded?: boolean; lastSyncAt?: string | null } | null>(KEYS.meta, null)

function loadSettings(): AppSettings {
  const saved = load<Partial<AppSettings>>(KEYS.settings, {})
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    mail: { ...DEFAULT_SETTINGS.mail, ...(saved.mail ?? {}) },
  }
}

let state: AppState = {
  db: seeded ? load(KEYS.db, seed.db) : seed.db,
  outbox: seeded ? load(KEYS.outbox, []) : [],
  syncLogs: seeded ? load(KEYS.logs, []) : [],
  settings: loadSettings(),
  auth: load<AuthState>(KEYS.auth, { user: null, authenticated: false }),
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  syncing: false,
  syncingPct: 0,
  lastSyncAt: seeded ? (meta?.lastSyncAt ?? null) : new Date().toISOString(),
  seeded: true,
}

if (!state.db.expenses) state.db = { ...state.db, expenses: [] }

const listeners = new Set<() => void>()

function persist(patch: Partial<AppState>): void {
  if ('db' in patch) save(KEYS.db, patch.db)
  if ('outbox' in patch) save(KEYS.outbox, patch.outbox)
  if ('syncLogs' in patch) save(KEYS.logs, patch.syncLogs)
  if ('settings' in patch) save(KEYS.settings, patch.settings)
  if ('auth' in patch) save(KEYS.auth, patch.auth)
  if ('lastSyncAt' in patch) save(KEYS.meta, { seeded: true, lastSyncAt: patch.lastSyncAt })
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)): void {
  const next = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...next }
  persist(next)
  listeners.forEach((l) => l())
}

export function getState(): AppState {
  return state
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getState()))
}

export function login(username: string, password: string): User | null {
  const user = seed.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password,
  )
  if (!user) return null
  setState({ auth: { user, authenticated: true } })
  return user
}

export function logout(): void {
  setState({ auth: { user: null, authenticated: false } })
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (!getState().online) setState({ online: true })
  })
  window.addEventListener('offline', () => {
    if (getState().online) setState({ online: false })
  })
}

export function resetAll(): void {
  Object.values(KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* noop */
    }
  })
  state = {
    db: seed.db,
    outbox: [],
    syncLogs: [],
    settings: DEFAULT_SETTINGS,
    auth: { user: null, authenticated: false },
    online: navigator.onLine,
    syncing: false,
    syncingPct: 0,
    lastSyncAt: new Date().toISOString(),
    seeded: true,
  }
  listeners.forEach((l) => l())
}