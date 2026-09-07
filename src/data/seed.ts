import type { Agent, DB, Health, Risk, User } from '../domain/types'

function daysAgo(n: number, hour = 9): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, Math.floor(Math.random() * 50) + 5, 0, 0)
  return d.toISOString()
}

const AGENT: Agent = {
  id: 'agent-01',
  name: 'Mariel Santos',
  role: 'Farmer Administrator',
  region: 'Nueva Ecija',
  badge: 'ADM-001',
  initials: 'MS',
  channels: ['cloud-api', 'sms-gateway', 'ussd-gateway', 'gmail'],
}

export const ADMIN: User = {
  id: 'user-admin',
  username: 'admin',
  password: 'admin123',
  name: 'Mariel Santos',
  role: 'farmer-admin',
  roleLabel: 'Farmer Administrator',
  region: 'Nueva Ecija',
  badge: 'ADM-001',
  initials: 'MS',
  channels: ['cloud-api', 'sms-gateway', 'ussd-gateway', 'gmail'],
}

const OPERATOR: User = {
  id: 'user-agent',
  username: 'renielagtas10@gmail.com',
  password: 'kurt123',
  name: 'Reniel Agtas',
  role: 'field-agent',
  roleLabel: 'Field Data Officer',
  region: 'Nueva Ecija',
  badge: 'FLX-011',
  initials: 'RA',
  channels: ['cloud-api', 'sms-gateway', 'ussd-gateway'],
}

const HEALTH: Record<string, Health> = {}
function h(r: number): Health {
  const key = JSON.stringify(r)
  return (HEALTH[key] ??= r < 0.34 ? 'good' : r < 0.67 ? 'fair' : 'poor')
}
function riskScore(r: number): Risk {
  return r < 0.35 ? 'low' : r < 0.7 ? 'medium' : 'high'
}

interface Row {
  name: string
  phone: string
  email: string
  village: string
  district: string
  farmSizeHa: number
  crop: string
  joinedDays: number
  riskSeed: number
  healthSeed: number
}

const FARMERS: Row[] = [
  { name: 'Ramon Dela Cruz', phone: '+63 917 445 1120', email: 'ramon.delacruz@gmail.com', village: 'San Juan', district: 'Cabanatuan City', farmSizeHa: 2.4, crop: 'Palay (rice)', joinedDays: 390, riskSeed: 0.2, healthSeed: 0.2 },
  { name: 'Fe Catacutan', phone: '+63 919 522 8810', email: 'fe.catacutan@gmail.com', village: 'Maligaya', district: 'Science City of Muñoz', farmSizeHa: 1.6, crop: 'Onion', joinedDays: 210, riskSeed: 0.55, healthSeed: 0.5 },
  { name: 'Josefa Ramos', phone: '+63 928 331 4416', email: 'josefa.ramos@gmail.com', village: 'Poblacion Sur', district: 'Guimba', farmSizeHa: 3.1, crop: 'Palay (rice)', joinedDays: 540, riskSeed: 0.1, healthSeed: 0.12 },
  { name: 'Ernesto Villanueva', phone: '+63 916 779 0992', email: 'ernesto.villanueva@gmail.com', village: 'Sto. Rosario', district: 'Cabiao', farmSizeHa: 1.2, crop: 'Garlic', joinedDays: 95, riskSeed: 0.8, healthSeed: 0.62 },
  { name: 'Luzviminda Aquino', phone: '+63 917 503 2377', email: 'luzviminda.aquino@gmail.com', village: 'Pulo', district: 'Talavera', farmSizeHa: 4.0, crop: 'Corn', joinedDays: 720, riskSeed: 0.3, healthSeed: 0.3 },
  { name: 'Arnel Domingo', phone: '+63 908 466 1745', email: 'arnel.domingo@gmail.com', village: 'Concepcion', district: 'Zaragoza', farmSizeHa: 1.9, crop: 'Vegetables', joinedDays: 150, riskSeed: 0.65, healthSeed: 0.55 },
]

function build(): DB {
  const farmers = FARMERS.map((f, i) => ({
    id: `farmer-0${i + 1}`,
    agentId: AGENT.id,
    name: f.name,
    phone: f.phone,
    email: f.email,
    village: f.village,
    district: f.district,
    farmSizeHa: f.farmSizeHa,
    primaryCrop: f.crop,
    creditRisk: riskScore(f.riskSeed),
    joinedDate: daysAgo(f.joinedDays, 10),
    notes: undefined,
    sourceChannel: (['cloud-api', 'sms-gateway', 'cloud-api'] as const)[i % 3],
    createdAt: daysAgo(f.joinedDays, 10),
    updatedAt: daysAgo(Math.max(f.joinedDays - 10, 2), 12),
  }))

  const plots: DB['plots'] = []
  const visits: DB['visits'] = []
  const cashAdvances: DB['cashAdvances'] = []
  const expenses: DB['expenses'] = []

  farmers.forEach((farmer, i) => {
    const hSeed = FARMERS[i].healthSeed
    plots.push({
      id: `plot-${i + 1}a`,
      farmerId: farmer.id,
      name: `${farmer.primaryCrop} — Main Field`,
      crop: farmer.primaryCrop,
      areaHa: Math.round(farmer.farmSizeHa * 0.6 * 10) / 10,
      soilType: i % 2 ? 'Sandy loam' : 'Clay loam',
      season: 'Summer 2026',
      plantedDate: daysAgo(45, 8),
      expectedYieldT: Math.round(farmer.farmSizeHa * 3.4 * 10) / 10,
      health: h(hSeed),
    })
    plots.push({
      id: `plot-${i + 1}b`,
      farmerId: farmer.id,
      name: `${i % 2 ? 'Sunflower' : 'Cabbage'} — Rotation`,
      crop: i % 2 ? 'Sunflower' : 'Cabbage',
      areaHa: Math.round(farmer.farmSizeHa * 0.4 * 10) / 10,
      soilType: i % 2 ? 'Clay loam' : 'Sandy loam',
      season: 'Winter 2026',
      plantedDate: daysAgo(160, 11),
      expectedYieldT: Math.round(farmer.farmSizeHa * 2.1 * 10) / 10,
      health: h(hSeed + 0.1),
    })

    if (i % 2 === 0) {
      visits.push({
        id: `visit-${i + 1}-a`,
        farmerId: farmer.id,
        agentId: AGENT.id,
        date: daysAgo(1, 15),
        purpose: 'Follow-up on input application',
        cropStage: 'Vegetative',
        health: h(hSeed),
        pests: hSeed > 0.5 ? ['Fall armyworm'] : ['None'],
        inputsUsed: ['Compound D', 'Urea'],
        notes: 'Top-dressing complete. Moisture levels adequate.',
        followUpDate: daysAgo(-12, 10),
        offline: false,
        createdAt: daysAgo(1, 15),
      })
    }
    visits.push({
      id: `visit-${i + 1}-b`,
      farmerId: farmer.id,
      agentId: AGENT.id,
      date: daysAgo(20 + i * 4, 13),
      purpose: 'Season monitoring',
      cropStage: 'Early growth',
      health: h(hSeed + 0.05),
      pests: ['None'],
      inputsUsed: i % 2 ? ['Pre-emergent herbicide'] : ['Compost'],
      notes: 'Crop stands improving after the rains.',
      followUpDate: daysAgo(-5, 9),
      offline: false,
      createdAt: daysAgo(20 + i * 4, 13),
    })

    const kinds: DB['cashAdvances'][number]['kind'][] = ['microloan', 'inputs-financing', 'equipment', 'grant']
    const kind = kinds[i % 4]
    const principal = [4800, 2500, 12000, 3000][i % 4]
    const label =
      kind === 'microloan'
        ? 'Seasonal input microloan'
        : kind === 'inputs-financing'
          ? 'Fertilizer & seed finance'
          : kind === 'equipment'
            ? 'Drip irrigation unit'
            : 'Community water access grant'
    const status: DB['cashAdvances'][number]['status'] =
      i === 3 ? 'overdue' : i === 5 ? 'active' : i % 2 ? 'repaid' : 'active'
    const repayments: DB['cashAdvances'][number]['repayments'] = []
    const nRepay = status === 'repaid' ? 4 : i === 5 ? 1 : 2
    for (let r = 0; r < nRepay; r++) {
      repayments.push({
        id: `repay-${i + 1}-${r}`,
        cashAdvanceId: `invest-${i + 1}`,
        date: daysAgo(100 - r * 45, 14),
        amount: Math.round((principal / 4) * 10) / 10,
        method: (['mobile-money', 'cash', 'auto-deduct', 'bank-transfer'] as const)[r % 4],
      })
    }
    cashAdvances.push({
      id: `invest-${i + 1}`,
      farmerId: farmer.id,
      kind,
      label,
      principal,
      disbursedDate: daysAgo(180, 9),
      interestRatePct: kind === 'microloan' ? 14 : kind === 'inputs-financing' ? 9 : 0,
      dueDate: status === 'repaid' ? daysAgo(20, 8) : daysAgo(-40, 16),
      status,
      repayments,
      farmerMessages:
        i === 3
          ? [
              {
                id: `note-${i + 1}-1`,
                date: daysAgo(4, 16),
                text: 'Harvest is a bit delayed by the rains — can I pay the balance early next month?',
              },
            ]
          : i === 1
            ? [
                {
                  id: `note-${i + 1}-1`,
                  date: daysAgo(9, 11),
                  text: 'I would like to extend the loan so I can buy more seed.',
                },
              ]
            : [],
      sms:
        i === 3
          ? [
              {
                id: `sms-${i + 1}-1`,
                date: daysAgo(2, 17),
                to: farmer.phone,
                text: `AgriLedger: reminder — your balance is due. Dial *134# on your phone to check your cash advance.`,
              },
            ]
          : [],
      emails:
        i === 3
          ? [
              {
                id: `email-${i + 1}-1`,
                date: daysAgo(3, 14),
                to: farmer.email,
                subject: `Your "${label}" cash advance update`,
                body: `Dear ${farmer.name.split(' ')[0]},\n\nYour cash advance "${label}" — ${principal} total, 50% paid back, due soon. Please review and reply to this email.\n\nAgriLedger`,
              },
            ]
          : [],
      createdAt: daysAgo(180, 9),
    })
  })

  const expenseSeeds = [
    { farmerId: farmers[0].id, days: 5, category: 'seeds', amount: 2500, description: 'Inbred rice seed for wet season planting' },
    { farmerId: farmers[0].id, days: 4, category: 'fertilizer', amount: 3000, description: 'Compound D + urea top dressing' },
    { farmerId: farmers[1].id, days: 3, category: 'fuel', amount: 1500, description: 'Pump fuel for land prep' },
    { farmerId: farmers[2].id, days: 9, category: 'seeds', amount: 5500, description: 'Hybrid seed & inoculation' },
    { farmerId: farmers[3].id, days: 7, category: 'fertilizer', amount: 4200, description: 'Foliar spray + micronutrients' },
    { farmerId: farmers[4].id, days: 6, category: 'fuel', amount: 2600, description: 'Irrigation pump diesel' },
    { farmerId: farmers[1].id, days: 12, category: 'other', amount: 1200, description: 'Tractor rental labour' },
    { farmerId: farmers[5].id, days: 8, category: 'other', amount: 900, description: 'Hand tools & twine' },
  ] as const
  expenseSeeds.forEach((es, i) => {
    expenses.push({
      id: `exp-0${i + 1}`,
      farmerId: es.farmerId,
      date: daysAgo(es.days, 9 + (i % 6)),
      category: es.category,
      amount: es.amount,
      description: es.description,
      createdAt: daysAgo(es.days, 9),
    })
  })

  return { farmers, plots, visits, cashAdvances, expenses }
}

export const seed = { agent: AGENT, admin: ADMIN, users: [ADMIN, OPERATOR], db: build() }