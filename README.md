# Rice Farm Expense Recording and Monitoring System

**Digital expense recording and monitoring system for rice farms.**

Rice Farm Expense Recording and Monitoring System is an offline-first, PWA-ready console for rice farm
administrators. Administrators capture farmer profiles, plots, field assessments, investments, repayments and
farm-expense records on-device; everything is queued in an **outbox** and delivered to head office through
**multiple channels** (Cloud API, SMS gateway, USSD rails) whenever a connection is available. Analytics are
aggregated locally from the on-device snapshot, so expense monitoring and financial decisions keep working with
zero coverage.

Sectors covered: **Agriculture**, **Financial Inclusion** (credit-risk profiles, microloans, repayments), and
**Business Systems Integration** (local-first data layer + multi-channel sync engine).

## Stack

- Vite + React 19 + TypeScript
- `react-router-dom` — screen routing
- `recharts` — on-device analytics charts
- `vite-plugin-pwa` — service worker + installable manifest (offline works out of the box)
- `@fontsource-variable/inter` — bundled fonts (no CDN, works offline)
- Custom typed store over `localStorage` (`src/data/store.ts`) with a `useSyncExternalStore` hook

## Architecture

```
src/
  domain/types.ts        entity model (Farmer, Plot, Visit, Investment, OutboxItem, SyncLog)
  data/
    store.ts             reactive, persistent app state (localStorage-backed)
    repository.ts        CRUD — local-first writes queued to the outbox
    sync.ts              sync engine + multi-channel simulator (latency, retries, failures)
    seed.ts              rich demo dataset (relative dates, always "current")
    selectors.ts         local aggregation for dashboards & analytics
    format.ts / util.ts  formatting + ids/dates
  components/
    layout.tsx           app shell: top bar, bottom nav, offline banner, reconnect auto-sync
    kit.tsx              primitives (chips, stats, modal, toast, confirm)
    charts.tsx           recharts wrappers
    icons.tsx            inline SVG icon set (no icon library)
  screens/               Login, Dashboard, Farmers, FarmerDetail, FarmerForm, NewVisit,
                         Investments, Analytics, SyncCenter, Settings
```

## Key behaviors

- **Offline-first**: every create/update writes locally and appends an `OutboxItem`
  (`pending → syncing → synced/failed`). Reads always hit the local snapshot.
- **Multi-channel delivery**: items route by entity — farmers over SMS, plots/visits over the
  Cloud API, investments over USSD — with realistic latency and ~5–12% failure to demo retry.
- **Reconnect auto-sync**: toggled in Settings; honours an interval retry for failed deliveries.
- **On-device analytics**: charts compute from the local snapshot and work fully offline.
- **PWA**: precaches the shell; fonts bundled; installable with brand icons.

## Commands

```sh
npm install
npm run dev       # local dev
npm run build     # typecheck + production build (incl. service worker)
npm run preview   # serve the built app
npm run lint      # eslint
```

## Prototype notes

Sync is simulated in `src/data/sync.ts` (no real backend yet). The demo dataset in `src/data/seed.ts`
uses relative dates so the dashboards always look live. Reset to the fresh seed from **Settings → Reset local data**.