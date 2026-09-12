# Mini Capstone Proposal

## Rice Farm Expense Recording and Monitoring System

**Program:** Bachelor of Science in Information Technology
**Course:** Mini Capstone
**Proponent:** Reniel B. Agtas & Kurt Ivan Samillano
**Student ID:** 2023-351
**Proposed Title (short form):** *Rice Farm Expense Recording and Monitoring System*
**Date:** September 9, 2026
**Advisor/Instructor:** Daffodelle V. Lucena

---

## Abstract

Rice Farm Expenses is an offline-first, PWA-ready field console for agricultural extension workers who operate in
low-connectivity rural areas. The system captures farmer profiles, plot assessments, field visits, investments,
repayments, and farm-operating expenses entirely on-device, aggregates analytics from the local snapshot, and
queues every change in an **outbox** for later delivery to head office. Synchronization is resilient by design:
records are routed over multiple channels (Cloud API, SMS, USSD, email) with realistic latency, retries, and
failure simulation, and a queued record is only dropped if the user chooses to discard it. The proposal
describes the problem, objectives, scope, methodology, evaluation, and expected outputs of the system, and
argues that local-first data capture plus multi-channel delivery materially improves the timeliness,
completeness, and credibility of field-based financial and farm-cost data.

---

## 1. Introduction & Background

Rural agricultural extension workers in many developing regions operate in areas with weak or intermittent
internet connectivity. Despite this, they are expected to collect and report critical farm-level data — farmer
profiles, plot assessments, field visit records, microloan disbursements and repayments, and farm input
(cost) records — back to a central head office in a timely and accurate manner. In practice this data is
delayed, lost, or captured on paper and re-encoded later, which undermines the credit-risk analysis, cost
control, and lending decisions that depend on it.

Mobile apps built for this setting often fail because they assume a constant network connection. When a field
agent steps out of coverage, the app stops working, queues nothing, and the day's collected data is silently
dropped. There is a clear need for a **local-first** system: one that stores and processes data on the device at
all times, so that field work continues normally with zero connectivity, and reliably delivers the captured
data to head office once a connection becomes available — through **multiple channels** selected to match
whatever infrastructure actually exists in the field (cloud API, SMS, USSD, or email rails).

**Rice Farm Expenses** is proposed as a solution to this problem: a mobile-ready, offline-first field agent console that
combines on-device data capture (farmers, plots, visits, investments, and farm expenses), local analytics,
expense reporting, and a resilient multi-channel synchronization engine.

---

## 2. Statement of the Problem

1. **Connectivity dependency:** Existing field tools stop functioning or lose data when agents are offline,
   which is the normal condition in many rural areas.
2. **Single point of failure in reporting:** Most solutions rely on one upload path; when that path (e.g., a
   cloud REST API) is unreachable, records never reach head office.
3. **Delayed decision intelligence:** Without local aggregation, field workers and managers cannot see
   dashboards, cost summaries, or risk snapshots while disconnected, delaying credit, spending, and extension
   decisions.
4. **Poor cost visibility:** Farm operating costs (seeds, fertilizer, fuel, labor, and other inputs) are
   typically recorded on paper or kept in separate spreadsheets. Head office cannot produce consolidated
   expense reports per farmer or per category in near real time.
5. **Simultaneously:** financial-inclusion actors (microfinance, input suppliers) need timely, credible
   field data to assess borrower credit risk and track repayments.

The project addresses the question: *How can an offline-first field console reliably capture, store, analyze,
and synchronize agricultural field and farm-cost data across unreliable and heterogeneous connectivity
conditions?*

---

## 3. Project Objectives & Scope

### Main Objectives
1. **OBJ 1 — Offline-first field data layer:** Capture farmer, plot, visit, investment, and farm-expense
   records entirely on-device (persistent local store), so field work continues normally with zero connectivity
   and no data is lost.
2. **OBJ 2 — Multi-channel synchronization engine:** Queue every local change in an outbox and deliver it to
   head office over multiple rails (Cloud API, SMS, USSD, email) with automatic retry and sync on reconnect,
   so records reliably reach head office even when any single channel is down.
3. **OBJ 3 — On-device analytics & reporting:** Compute dashboards, credit-risk summaries, and farm-cost
   reports (with downloadable CSV expense ledgers) directly from the local snapshot, keeping financial and
   cost decisions usable offline.

### Scope
**In scope:** an offline-first, installable PWA (Vite + React + TypeScript) covering farmer/plot/visit
management, microloan & repayment tracking, farm-expense capture and reporting, local analytics, and a
simulated multi-channel sync engine with a delivery audit trail.

### Delimitation (boundaries)
- The sync engine is **simulated** (no real production backend, SMS/USSD carrier, or live server).
- No real financial processing, banking, or regulatory compliance handling.
- Single-agent, single-device scope; multi-device conflict resolution is not implemented.

---

## 4. Scope and Delimitation

### In scope
- An offline-first, PWA-ready web application (Vite + React + TypeScript).
- Farmer, plot, field-visit, investment (microloan/equipment/inputs financing/grant), and **farm expense**
  record management, with credit-risk classification, repayment capture, and expense cost tracking.
- Expense recording per farmer (Seeds, Fertilizer, Fuel, Other categories), a records ledger with search and
  category filters, category roll-ups, and CSV report generation.
- A local-first typed data store (localStorage persistence with a legacy-schema migration) and outbox-based
  change tracking.
- A simulated multi-channel sync engine (Cloud API, SMS, USSD, Gmail/EmailJS) with realistic latency,
  failure rates, retries, and automatic sync on reconnect.
- On-device analytics dashboards (charts + summaries) computed from the local snapshot.
- Responsive, installable PWA shell with offline banner and reconnect auto-sync settings.

### Out of scope / delimitation
- The synchronization engine is **simulated** in this mini capstone — there is no real production backend,
  SMS/USSD carrier integration, or live server. It demonstrates the architecture and behavior of such a
  system rather than a deployment-ready integration.
- No real financial processing, banking, payment, or regulatory compliance handling.
- Single-agent, single-device scope; multi-device conflict resolution and server-side reconciliation are
  not implemented.
- Expense reports are generated as downloadable CSV snapshots; real-time chart drill-downs and server-side
  analytics are out of scope.

---

## 5. Significance of the Study

- **Field agents / extension workers:** Gain a tool that keeps working and records everything — visits,
  repayments, and farm costs — regardless of connectivity, removing data loss and paper re-encoding.
- **Head office / program managers:** Receive timely, tracking-able records with a full audit trail (sync
  log) of what was delivered, through which channel, and whether it succeeded, plus consolidated expense
  visibility per farmer and per cost category.
- **Financial-inclusion partners:** Obtain more reliable, current farm and repayment data to strengthen
  credit-risk assessment and microloan decisioning.
- **IT discipline:** Contributes a practical demonstration of offline-first (local-first) architecture, the
  outbox pattern, multi-channel synchronization, and PWA delivery — patterns widely applicable beyond
  agriculture (health, education, logistics in low-connectivity regions).

---

## 6. Review of Related Literature and Technology

- **Offline-first / local-first software.** Kleppmann et al. (2019) formalize local-first software as software
  that reads and writes primarily on the user's own device and synchronizes asynchronously, so that the local
  copy remains authoritative and the tool keeps functioning without connectivity [1]. Rice Farm Expenses applies this
  idea directly: all reads and writes hit a persistent on-device store, and synchronization happens
  opportunistically.
- **Transactional outbox pattern.** Richardson (2019) describes the transactional outbox, in which a write is
  persisted to a database together with an "outbox" record, and a separate relay later publishes the record —
  guaranteeing that no change is lost even when the transport is down [2]. Rice Farm Expenses's sync engine adapts this
  pattern, treating each local mutation as an `OutboxItem` that is only marked *synced* once a channel confirms
  delivery.
- **Rural data collection platforms.** Hartung et al. (2010) show, through Open Data Kit (ODK), that offline
  mobile data capture is both feasible and transformative in developing regions [3]. Rice Farm Expenses extends this
  pioneer's insight from a one-shot survey tool into an always-on field-management, expense-tracking, and
  synchronization console.
- **Multi-channel delivery.** Routing the same logical record over the most appropriate available transport
  (HTTP/REST, SMS, USSD, or email) is a widely used strategy in low-connectivity settings — the same principle
  behind mobile-money and IVR-based field data platforms. Rice Farm Expenses demonstrates this by mapping entity types
  to channels and simulating each one's latency and failure behavior.
- **PWA / service workers.** Ater (2017) documents how service workers and installable manifests enable
  application shells to load and run offline [4]. Rice Farm Expenses uses a service worker to precache its shell and
  bundle its fonts so offline operation works out of the box.

**References**

1. Kleppmann, M., Wiggins, A., van Hardenberg, P., & McGranaghan, M. (2019). Local-First Software: You Own
   Your Data, in Spite of the Cloud. *Proceedings of the 2019 ACM SIGPLAN International Symposium on New Ideas,
   New Paradigms, and Reflections on Programming (Onward! 2019)*, 154–178.
2. Richardson, C. (2019). *Pattern: Transactional Outbox*. microservices.io. Retrieved from
   https://microservices.io/patterns/data/transactional-outbox.html
3. Hartung, C., Lerer, A., Anokwa, Y., Tseng, C., Brunette, W., & Borriello, G. (2010). Open Data Kit: Tools to
   Build Information Services for Developing Regions. *Proceedings of the 4th ACM/IEEE International Conference
   on Information and Communication Technologies and Development (ICTD '10)*, Article 18.
4. Ater, T. (2017). *Building Progressive Web Apps*. O'Reilly Media.

---

## 7. System Overview (Proposed Design)

Rice Farm Expenses is organized around a thin client concept: every screen reads from a single reactive local store and
mutates the database through typed repository functions, which automatically enqueue an outbox record.

**Domain model (typed, localized):**

| Entity | Purpose | Key fields |
|---|---|---|
| `Agent` | The logged-in field officer | name, region, channels |
| `Farmer` | Registered farmer profile | name, phone, village, district, farm size, crop, credit risk |
| `Plot` | Farm field under a farmer | crop, area, soil, season, health |
| `Visit` | Field assessment | date, purpose, crop stage, health, pests, notes |
| `Investment` | Loan/equipment/grant facility | kind, principal, rate, due date, status, repayments |
| `Expense` | Farm operating cost | farmer, date, category, amount, description |
| `OutboxItem` | Change log to deliver | entity, action, payload, status, channel, attempts |
| `SyncLog` | Delivery audit trail | channel, items, synced, failed, outcome |

**Data flow (offline-first):**
`Screen → repository (mutate local DB + persist to localStorage) → enqueue OutboxItem → sync engine →
per-channel delivery simulation → mark synced/failed → write SyncLog → UI updates reactively
(via useSyncExternalStore).`

**Block diagram (architecture):**

```
                            ┌───────────────────────────────────────────────┐
                            │                FIELD AGENT (device)            │
                            │                                               │
  ┌─────────────────┐   ┌───▼───────────────┐    ┌────────────────────────┐  │
  │  UI SCREENS      │   │  LOCAL DATA LAYER  │    │  SYNC ENGINE           │  │
  │  Login/Farmers/  │──▶│  typed store +      │──▶│  Outbox → per-channel  │  │
  │  Visits/Invest-  │   │  repository (local- │    │  delivery + retries   │  │
  │  ments/Expenses/ │   │  Storage persistence)│    └───────┬──────────────┘  │
  │  Analytics/Sync  │   └────────────────────┘            │                 │
  └─────────────────┘                                      ▼                 │
                         ┌──────────────────────────────────────────────┐    │
                         │       MULTI-CHANNEL DELIVERY (simulated)      │    │
                         │   Cloud API  │  SMS  │  USSD  │  Email/EmailJS  │    │
                         └──────────────┬──────────────────────────────────┘    │
                                        │  (async, latency, ~5–12% failure)     │
                                        ▼                                        │
                            ┌─────────────────────────┐                          │
                            │  HEAD OFFICE            │                          │
                            │  received → SyncLog     │◀─────────────────────────┘
                            └─────────────────────────┘
```

**Sync behavior:** outgoing records are grouped by channel; each delivery simulates realistic latency and a
failure rate (e.g., 5% cloud API, 12% SMS). Failures remain in the outbox for retry; when connectivity is
restored, a background auto-sync flushes the queue. Premium Gmail delivery uses EmailJS when keys are
configured in Settings, otherwise sends are simulated.

**Expense reporting:** expenses are linked to a farmer and summed by category (Seeds, Fertilizer, Fuel,
Other). The Expense screen provides a quick-entry form (farmer, date, category, amount with quick presets,
description), a searchable/filterable ledger with running totals, per-category progress breakdowns, and a
**Generate report** button that exports a `CSV` snapshot of the ledger.

---

## 8. Methodology

### Technical Approach
A straightforward **iterative software-development (prototyping) approach** is proposed for a mini capstone:

1. **Requirements & analysis** — define entities (Agent, Farmer, Plot, Visit, Investment, Expense,
   OutboxItem, SyncLog) and functional/offline requirements.
2. **Prototype** — build a working vertical slice (data model + store + sync simulation + key screens) to
   validate the offline-first and multi-channel approach early.
3. **Iterative build** — flesh out all screens, analytics, expense tracking & reporting, PWA/offline
   behavior, and sync retry/auto-sync.
4. **Evaluation** — test offline resilience (capture while disconnected), multi-channel delivery and retry,
   analytics correctness, expense reporting, and usability; document results.
5. **Documentation & presentation** — finalize the proposal, system documentation, and demo.

The development uses core IT-applied techniques: TypeScript type modeling, a reactive local store
(`useSyncExternalStore`), the outbox design pattern, async simulation of multi-channel delivery, CSV report
generation, and PWA service-worker caching.

### Tools & Technologies

| Layer | Tools / Framework | Purpose |
|---|---|---|
| Frontend | Vite + React 19 + TypeScript | Build tool, UI framework, typed code |
| Routing | react-router-dom | Screen navigation |
| Charts | recharts | On-device analytics charts |
| Offline/PWA | vite-plugin-pwa + service worker | Installable, works without connection |
| State | Custom typed store over `localStorage` + `useSyncExternalStore` | Local-first persistence & reactivity |
| Fonts | @fontsource-variable/inter | Bundled (no CDN, works offline) |
| Email channel | @emailjs/browser (optional) | Real Gmail delivery demo |
| Deployment | Vercel / Netlify (free tier) | Hosting the static PWA demo |
| Editing | VS Code, npm | Development environment |

All tools are free/open-source; the prototype runs with **no hardware** beyond a phone/PC test device.

---

## 9. Timeline of Activities (Gantt Chart)

| Phase | Key Activities | Weeks 1–2 | 3–4 | 5–6 | 7–8 | 9–10 | 11–12 |
|---|---|---|---|---|---|---|---|
| 1 | Requirements analysis, entity modeling, proposal write-up | ██ | | | | | |
| 2 | Data layer (store, repository, seed data) + app shell | | ██ | | | | |
| 3 | Sync engine + outbox + multi-channel simulation | | | ██ | | | |
| 4 | Screens: farmers, plots, visits, investments | | | | ██ | | |
| 5 | Expense tracking + reporting (ledger, categories, CSV) | | | | | ██ | |
| 6 | Analytics, PWA/offline polish, auto-sync on reconnect | | | | | ██ | |
| 7 | Evaluation, documentation, final demo & presentation | | | | | | ██ |

*Total: 12 weeks.*

---

## 10. Budget Requirements

> *(Adjust based on local costs. This project runs on free/open tools.)*

| Item | Type | Cost |
|------|------|------|
| Development tools (VS Code, Vite, React) | Free / Open-source | ₱0 |
| Deployment / hosting (static PWA, optional) | Free tier (e.g., Netlify/Pages) | ₱0 |
| Gmail/EmailJS integration (optional demo) | Free tier | ₱0 |
| Testing device (mobile/PC) | On-hand | ₱0 |

**Estimated total:** ₱0 (no-cost prototype using open tools).

---

## 11. Evaluation Plan

| Criterion | How it is evaluated | Target |
|---|---|---|
| Offline resilience | Capture farmers, visits, repayments, and expenses while disconnected; verify all persist locally | 100% of captured records persist |
| Sync delivery | Run manual/auto sync; verify outbox statuses, retries, and SyncLog outcomes per channel | Failed deliveries recover on retry |
| Multi-channel routing | Confirm entity→channel mapping and per-channel latency/failure simulation | Matches configured mapping |
| Analytics correctness | Cross-check dashboard sums against raw records | Totals reconcile to source records |
| Expense reporting | Compare ledger, category roll-ups, and CSV export with source records | Report totals match source data |
| Usability (PWA) | Install on mobile, navigate all screens, complete end-to-end demo offline/online | All primary flows complete |
| Code quality | `tsc -b`, `eslint`, and production build pass without errors | 0 errors / warnings blocking |

---

## 12. Expected Output / Deliverables

- A working **Rice Farm Expenses** web app prototype (offline-first, installable PWA) with farmer, plot, visit,
  investment, and **farm expense** management plus on-device analytics.
- A **reporting feature** that produces searchable expense ledgers, per-category breakdowns, and downloadable
  CSV reports.
- An **architecture overview** of the local-first data layer and multi-channel sync engine.
- **Demo dataset** with realistic, always-current relative dates for presentation.
- **Documentation** covering design, methodology, and evaluation.

---

## 13. Conclusion

Rice Farm Expenses directly addresses a real, underserved problem: capturing and delivering agricultural field,
farm-investment, and farm-cost data in low-connectivity rural settings. By combining an offline-first data
layer, the outbox pattern, multi-channel synchronization, and on-device analytics and reporting — including a
full farm-expense subsystem — it demonstrates how resilient, decision-useful field records can be maintained
even where reliable connectivity cannot be assumed. As a mini capstone it is well-scoped, technically rich,
and practically significant.