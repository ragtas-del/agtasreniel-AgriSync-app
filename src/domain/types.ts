export type ID = string

export type ChannelId = 'cloud-api' | 'sms-gateway' | 'ussd-gateway' | 'gmail'

export type Health = 'good' | 'fair' | 'poor'
export type Risk = 'low' | 'medium' | 'high'
export type ExpenseCategory = 'seeds' | 'fertilizer' | 'fuel' | 'other'

export interface Agent {
  id: ID
  name: string
  role: string
  region: string
  badge: string
  initials: string
  channels: ChannelId[]
}

export type UserRole = 'farmer-admin' | 'field-agent'

export interface User {
  id: ID
  username: string
  password: string
  name: string
  role: UserRole
  roleLabel: string
  region: string
  badge: string
  initials: string
  channels: ChannelId[]
}

export interface AuthState {
  user: User | null
  authenticated: boolean
}

export interface Farmer {
  id: ID
  agentId: ID
  name: string
  phone: string
  email?: string
  village: string
  district: string
  farmSizeHa: number
  primaryCrop: string
  creditRisk: Risk
  joinedDate: string
  notes?: string
  sourceChannel: ChannelId
  createdAt: string
  updatedAt: string
}

export interface Plot {
  id: ID
  farmerId: ID
  name: string
  crop: string
  areaHa: number
  soilType: string
  season: string
  plantedDate: string
  expectedYieldT: number
  health: Health
}

export interface Visit {
  id: ID
  farmerId: ID
  agentId: ID
  date: string
  purpose: string
  cropStage: string
  health: Health
  pests: string[]
  inputsUsed: string[]
  notes: string
  followUpDate?: string
  offline: boolean
  createdAt: string
}

export interface Repayment {
  id: ID
  cashAdvanceId: ID
  date: string
  amount: number
  method: 'cash' | 'mobile-money' | 'auto-deduct' | 'bank-transfer'
}

export interface FarmerNote {
  id: ID
  date: string
  text: string
}

export interface SmsRecord {
  id: ID
  date: string
  to: string
  text: string
}

export interface EmailRecord {
  id: ID
  date: string
  to: string
  subject: string
  body: string
}

export interface CashAdvance {
  id: ID
  farmerId: ID
  kind: 'microloan' | 'equipment' | 'inputs-financing' | 'grant'
  label: string
  principal: number
  disbursedDate: string
  interestRatePct: number
  dueDate: string
  status: 'active' | 'repaid' | 'overdue' | 'defaulted'
  repayments: Repayment[]
  farmerMessages?: FarmerNote[]
  sms?: SmsRecord[]
  emails?: EmailRecord[]
  createdAt: string
}

export interface Expense {
  id: ID
  farmerId: ID
  date: string
  category: ExpenseCategory
  amount: number
  description?: string
  createdAt: string
}

export type OutboxStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export interface OutboxItem {
  id: ID
  entity: 'farmer' | 'plot' | 'visit' | 'cashAdvance' | 'expense' | 'sms' | 'email'
  entityId: ID
  action: 'create' | 'update' | 'delete' | 'notify'
  payload: unknown
  status: OutboxStatus
  channel: ChannelId
  attempts: number
  error?: string
  createdAt: string
  syncedAt?: string
}

export type SyncOutcome = 'success' | 'partial' | 'failed'

export interface SyncLog {
  id: ID
  startedAt: string
  finishedAt: string
  channel: ChannelId
  items: number
  synced: number
  failed: number
  outcome: SyncOutcome
  triggeredBy: 'auto' | 'manual' | 'online-event' | 'interval'
}

export interface AppSettings {
  agentName: string
  region: string
  autoSync: boolean
  preferredChannel: ChannelId
  lastFullSync: string | null
  mail: {
    serviceId: string
    templateId: string
    publicKey: string
  }
}

export interface DB {
  farmers: Farmer[]
  plots: Plot[]
  visits: Visit[]
  cashAdvances: CashAdvance[]
  expenses: Expense[]
}