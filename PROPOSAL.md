# Mini Capstone Proposal

## AgriLedger: An Offline-First Digital Financial Ledger and Reporting System for Farmers

**Program:** Bachelor of Science in Information Technology
**Course:** Mini Capstone
**Proponent:** ______________________
**Proposed Title (short form):** *AgriLedger — Farmer Administrator Financial Ledger with Multi-Channel Sync*

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

**AgriLedger** is proposed as a solution to this problem: a mobile-ready, offline-first field agent console that
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

## 3. Objectives

### General Objective
To design and develop **AgriLedger**, an offline-first, PWA-ready field agent console for agricultural extension
workers that captures farmer and farm-records data on-device, aggregates analytics locally, tracks farm
expenses, and synchronizes records to head office through multiple channels.

### Specific Objectives
1. **SO1 — Local-first data layer:** Design a reactive, persistent data store (localStorage-backed with a
   typed domain model) so all create/update/read operations — including expense recording — work fully offline.
2. **SO2 — Multi-channel synchronization engine:** Implement an outbox pattern that queues local changes and
   delivers them via multiple channels (Cloud API, SMS Gateway, USSD Gateway, and email), with per-channel
   latency, retry, realistic failure simulation, and automatic sync on reconnect.
3. **SO3 — On-device analytics:** Build local aggregation selectors that compute dashboards and charts
   (farmer counts, plots, visits, investment & credit-risk summaries) entirely from the on-device snapshot.
4. **SO4 — Farm expense management:** Add farmer-linked expense capture (category, amount, date, description),
   a searchable/filterable records ledger, per-category cost breakdowns, and a downloadable expense report.
5. **SO5 — Usable field console:** Develop a clean, mobile-first PWA interface with farmer/plot/visit
   management, investment tracking, expense records, a sync center, and settings — installable and functional offline.
6. **SO6 — Documentation & evaluation:** Document the architecture and evaluate the system against usability,
   offline resilience, and sync delivery/retry behavior.

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

> *(The student should expand this section with 4–6 cited sources. Placeholder survey below.)*

- **Offline-first / local-first software:** Principles that applications should read and write on the device
  and synchronize asynchronously, prioritizing the local copy (Kleppmann et al., local-first software).
- **Outbox pattern:** A reliable-messaging idiom in which writes are first persisted alongside an outbox
  record and later published asynchronously, ensuring no data is lost even if the transport fails.
- **Multi-channel delivery:** Routing the same logical record type over the most appropriate available
  transport (HTTP/REST, SMS, USSD) to reach institutions in low-connectivity regions — akin to approaches
  used by mobile-money and IVR-based data collection platforms.
- **PWA / service workers:** Enabling installation and offline caching of application shells (used by
  AgriLedger for offline operation out of the box).
- **Rural data collection platforms:** Survey tools (e.g., ODK-like) that pioneered offline mobile data
  capture; AgriLedger extends this into an always-on field management, cost-tracking, and synchronization
  console rather than a one-shot survey tool.

---

## 7. System Overview (Proposed Design)

AgriLedger is organized around a thin client concept: every screen reads from a single reactive local store and
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

- A working **AgriLedger** web app prototype (offline-first, installable PWA) with farmer, plot, visit,
  investment, and **farm expense** management plus on-device analytics.
- A **reporting feature** that produces searchable expense ledgers, per-category breakdowns, and downloadable
  CSV reports.
- An **architecture overview** of the local-first data layer and multi-channel sync engine.
- **Demo dataset** with realistic, always-current relative dates for presentation.
- **Documentation** covering design, methodology, and evaluation.

---

## 13. Conclusion

AgriLedger directly addresses a real, underserved problem: capturing and delivering agricultural field,
farm-investment, and farm-cost data in low-connectivity rural settings. By combining an offline-first data
layer, the outbox pattern, multi-channel synchronization, and on-device analytics and reporting — including a
full farm-expense subsystem — it demonstrates how resilient, decision-useful field records can be maintained
even where reliable connectivity cannot be assumed. As a mini capstone it is well-scoped, technically rich,
and practically significant.