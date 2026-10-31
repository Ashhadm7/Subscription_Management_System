# SubscriptIQ — Brightloop Software

Subscription management, recurring billing, Odoo synchronisation and analytics for **Brightloop Software**, built for **Odoo x Makeathon 9.0**.

> **Status: Phase 4 complete — submission-ready.** Phases 1–4 are implemented and verified locally: authentication and RBAC, products and variants, plans, quotations, the subscription lifecycle, the recurring billing engine, invoices, discounts, payments, Odoo integration (live instance unverified), the admin and staff dashboards, the customer portal, notifications, reporting with CSV export, a rule-based finance assistant, scheduled billing, and a judge-ready demo dataset. Typecheck, lint, production build, 22 Phase 2 workflow checks, 50 Phase 3 data checks and 12 Odoo protocol checks all pass.
> Member 1 — Frontend developer
UI

- Admin dashboard
- Subscription management pages
- Product and plan pages
- Customer portal
- Responsive design


Member 2 — Backend developer
Backend

- Database schema
- Authentication
- Role-based access
- Subscription lifecycle
- Discounts and validations


Member 3 — Odoo integration developer
Critical

- Odoo connection
- API authentication
- Product/customer synchronization
- Invoice creation
- Payment synchronization


Member 4 — Automation and testing
Automation

- Recurring billing logic
- Renewal reminders
- Revenue analytics
- Integration testing
- Demo and presentation

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI primitives) |
| Database | PostgreSQL (project-local cluster via `npm run db:start`) |
| ORM | Prisma 6 (`prisma migrate`, typed client) |
| Auth | Auth.js v5 (Credentials, JWT sessions) + bcrypt |
| Validation | Zod (shared server-side schemas) |
| Charts | Recharts |
| ERP | Odoo JSON-RPC 2.0 external API |

---

## Getting started

### 1. Environment

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"   # AUTH_SECRET
```

`.env` keys:

```ini
DATABASE_URL="postgresql://postgres@127.0.0.1:5432/subscriptiq?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_TRUST_HOST="true"

# Odoo — optional; the application runs without it and reports the blocker.
ODOO_URL=""
ODOO_DB=""
ODOO_USERNAME=""
ODOO_PASSWORD=""          # Odoo 14+ API key recommended
ODOO_TIMEOUT_MS="20000"

# Scheduled billing (/api/cron/billing). The route refuses to run when unset.
CRON_SECRET=""

# Optional email for notifications; in-app notifications work without it.
RESEND_API_KEY=""
NOTIFICATION_FROM_EMAIL="billing@brightloop.example"
```

`ODOO_PASSWORD` accepts a password or an Odoo 14+ **API key** (*Preferences → Account Security → New API Key*).

### 2. Database

```bash
npm run db:start     # start the project-local PostgreSQL cluster, if not already running
npm run db:migrate   # apply Prisma migrations
npm run db:seed      # accounts, catalogue and the full demo dataset
```

To use your own PostgreSQL server, point `DATABASE_URL` at it and skip `db:start`.

### 3. Run

```bash
npm run dev          # http://localhost:3000
```

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@brightloop.example` | `Admin@12345` |
| Staff | `staff@brightloop.example` | `Staff@12345` |
| Customer | `customer@northwind.example` | `Customer@12345` |

Public registration always creates a **customer**; staff accounts are created by an administrator on `/admin/users`.

### Demo dataset

`npm run db:seed` builds the catalogue (5 products incl. variants, 5 plans, 2 taxes, 2 discounts) and then a clearly labelled demo book:

- 5 customers — Northwind Traders, Vertex Labs, Kaveri Textiles, Summit Logistics, Aurora Health
- 6 subscriptions — 4 active, 1 paused, 1 closed; weekly/monthly/quarterly/yearly plans; one renews in 5 days
- 7 invoices — paid, partially paid, unpaid and overdue
- 6 payments — full, partial, multi-method (cash, UPI, card, bank transfer) and one refunded reversal
- 2 quotations (draft and accepted), billing-run history with logs, and an admin notification inbox

Demo documents are rebuilt on every seed run. The reset deletes the billing documents owned by the five demo customers (and nothing belonging to anyone else), so re-seeding always yields the same book: 6 subscriptions, 7 invoices, 6 payment receipts and 2 quotations — even after a billing cycle has generated extra invoices.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:start` / `db:stop` | Local PostgreSQL cluster |
| `npm run db:migrate` | Create/apply migrations |
| `npm run db:seed` | Catalogue + demo dataset (idempotent) |
| `npm run db:studio` | Prisma Studio |
| `npx tsx scripts/verify-phase3.ts` | Dashboard, report, assistant, portal and billing-integrity checks (50 assertions) |
| `npx tsx scripts/verify-phase2.ts` | Phase 2 workflow checks (billing, discounts, payments) — **run `npm run db:seed` afterwards**, it bills and closes demo subscriptions |
| `npx tsx scripts/odoo-transport-check.ts` | Odoo client protocol test against a local stub |

---

## Feature map

### Admin dashboard — `/admin`

Live PostgreSQL figures, not mock data: customers, total/active/draft subscriptions, MRR, ARR, cash collected, outstanding, overdue invoices and upcoming renewals. Charts: revenue vs. collection trend, subscription growth, status distribution and revenue by plan. Date presets (today, 7/30 days, this month, this year) and a custom range.

MRR normalises every billing interval to a monthly value (daily × 30, weekly × 52/12, quarterly ÷ 3, yearly ÷ 12); ARR is MRR × 12. **Recurring revenue is shown separately from cash collected.**

### Staff dashboard — `/staff`

Operational queue: active subscriptions, pending quotations, unpaid and overdue invoices, upcoming renewals, collection worklist and recent activity, plus shortcuts to add a customer, create a quotation, open subscriptions, generate invoices and record payments. No financial configuration or staff management.

### Customer portal — `/portal`

Profile, subscriptions and history, upcoming billing dates, invoices with PDF download, payment history, outstanding balance, available plans, and self-service pause / resume / cancellation requests where the plan permits. Every query is scoped by the signed-in user's customer record; another customer's id resolves to *not found*.

### Catalogue and lifecycle

- **Products** (`/admin/products`): create/edit/archive, variants with additive prices (base ₹999 + Odoo variant ₹560 = ₹1,559), Odoo product push.
- **Plans** (`/admin/plans`): interval/count, price, minimum quantity, availability window, auto-close, pause/early-closure/renewal permissions.
- **Quotations** (`/ops/quotations`): server-priced lines, taxes, validity, unique numbers, confirm/cancel and convert to subscription.
- **Subscriptions** (`/ops/subscriptions`): Draft → Quotation → Confirmed → Active → Closed plus Pause/Resume/Renew/Early cancellation, each validating the transition and recording a `SubscriptionEvent`.
- **Billing** (`/admin/billing`): **Run billing cycle**, due selection, period keys, database-enforced duplicate protection, discounts, billing-run and per-subscription logs, retry-safe.
- **Invoices** (`/ops/invoices`): confirm, cancel, send, print, PDF, payment status derived from payments and due date, Odoo push.
- **Discounts** (`/admin/discounts`): fixed/percentage, scope, date window, usage cap, minimum purchase/quantity, product/customer targeting, usage tracking.
- **Payments** (`/ops/payments`): cash, bank transfer, UPI and card; full and partial payments, multiple payments per invoice, reversal with audit history, automatic invoice status updates, Odoo payment mirroring where available.

### Reports — `/admin/reports`

Four report tabs (revenue, subscriptions, invoices, payments) with summary cards, server-side search, status/method filters, sortable columns, pagination and **CSV export** (`/api/reports/export`, administrator-only, capped at 5,000 rows). Revenue splits into cash collected, invoiced value, outstanding and refunds, plus revenue by product and by plan.

### Finance assistant — `/admin/assistant`

A rule-based analytics assistant that answers plain-language questions (MRR, collections, overdue customers, expiring subscriptions, top plans, outstanding balance) using fixed, auditable database queries. It never estimates or invents a figure, needs no external AI key, and falls back to a book summary for unmatched questions. All reads are server-side and administrator-only.

### Notifications — `/notifications`

In-app inbox for renewals, expiry, invoice generation, payments, overdue invoices, billing failures, Odoo failures and cancellation requests, with unread counts in the sidebar and mark-read actions. `generateReminderNotifications()` is also called by the scheduled job. Email is optional: when `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL` are absent, sending is skipped and the app keeps working.

### Automation

- **Manual**: `Run billing cycle` on `/admin/billing` (administrator only).
- **Scheduled**: `GET|POST /api/cron/billing` with `Authorization: Bearer $CRON_SECRET` (or `?secret=`), declared in `vercel.json` as `0 2 * * *`. It runs the billing engine with the `SCHEDULED` trigger, then generates reminder notifications. Without `CRON_SECRET` the route returns 503 and does nothing — it never exposes an unauthenticated invoice trigger.

---

## Architecture

```
prisma/
  schema.prisma           # models, enums, indexes, unique constraints
  seed.ts                 # accounts + catalogue
  demo-data.ts            # judge-ready demo book (rebuilt per seed)
src/
  app/
    (auth)/               # login, register, forgot/reset password
    admin/                # dashboard, reports, assistant, products, plans,
                          # discounts, billing, users, Odoo integration
    staff/                # staff operational dashboard
    portal/               # customer self-service
    ops/                  # customers, quotations, subscriptions, invoices, payments
    notifications/        # in-app inbox
    api/                  # auth, health, invoice PDF, report CSV, cron billing
  components/             # ui primitives, layout shell, charts, feature forms
  lib/
    auth/                 # Auth.js config (edge-safe split), guards, password policy
    actions/              # server actions, all role-checked
    billing.ts            # recurring billing engine + billing logs
    subscriptions.ts      # lifecycle transitions and events
    invoices.ts/payments.ts/discounts logic
    notifications.ts      # in-app + optional email delivery
    odoo/                 # client, sync services, typed errors, audit logger
    queries/              # analytics, reports, portal, list read models, assistant
    validations/          # Zod schemas
  middleware.ts           # edge route/role guard
```

### Security model

- Roles enforced server-side in three layers: middleware, layout guards (`requireAdmin`, `requireStaffAccess`, `requireCustomer`) and every server action/route (`getAuthorizedUser`, which re-reads the account so deactivation and role changes apply immediately).
- Prices, taxes, discounts and totals are always recomputed on the server; browser-submitted amounts are never trusted.
- Billing uniqueness is enforced by `@@unique([subscriptionId, billingPeriodKey])`; payment receipt numbers and document numbers are unique; invoice amounts are derived from payments.
- Passwords: bcrypt cost 12, policy enforced in Zod and re-checked server-side. Reset tokens are single-use, hashed, one-hour expiry, with identical responses for unknown emails.
- Odoo credentials and the cron secret are server-only environment variables; the integration screen renders only *whether* a secret exists.
- Report CSV and invoice PDF routes re-check the session and object ownership.

### Performance

- Dashboard and report aggregations run in PostgreSQL (`groupBy`, `aggregate`, `date_trunc`), never by loading tables into Node.
- Every listing is paginated in the database with indexed columns (`status`, `dueDate`, `issueDate`, `nextBillingDate`, `customerId`); composite indexes cover the dashboard's `status + date` filters.
- List queries select only rendered columns; charts receive aggregates.
- Observed production timings with the demo dataset: `/admin` 0.45 s first hit, warm admin/report pages 30–90 ms.

---

## Odoo integration

Transport: `/jsonrpc` (JSON-RPC 2.0), which works across Community, Enterprise, Odoo Online and self-hosted deployments and accepts a password or an Odoo 14+ API key.

- `client.ts` — cached uid, per-request timeout, 3 attempts with exponential backoff + jitter, retry classification that only repeats transient failures.
- `sync.ts` — connection verification, product + variant push (matched on `default_code`/SKU), customer push (`res.partner.ref` = customer number), invoice creation/posting (`account.move.ref` = invoice number), payment mirroring (`account.payment`), stored record ids, idempotent re-pushes.
- `logger.ts` — every attempt writes an `OdooSyncLog` row (entity, operation, Odoo id, attempts, duration, payloads, error).

### Verification status — blocked, not mocked

No Odoo instance or credentials are available in this environment, so **no real synchronisation is claimed**. `/admin/integration` shows:

- last synchronization time, successful / failed / pending / skipped counts;
- each failed record with the exact Odoo error, attempt count and a **Retry** action;
- a bulk **Retry failed syncs** action that retries the newest failure per record (idempotent re-link, no duplicates);
- configuration presence (never secret values) and record-id mapping counts.

The connection test, catalogue sync, invoice push, payment push and retry paths are implemented but unverified against a live instance. The client protocol is covered by `scripts/odoo-transport-check.ts` against a protocol-faithful stub (12 checks) — that is a transport test, not proof of a reachable deployment.

To connect a real instance: create an integration user, generate an API key, fill the four `ODOO_*` variables, restart, open `/admin/integration` → **Test connection** → **Sync catalogue**, then push an invoice and payment from their detail pages.

---

## Verification performed (Phase 4)

**Static checks**

- `npm run typecheck` — clean.
- `npm run lint` — clean (0 errors, 0 warnings).
- `npm run build` — production build succeeded, all routes compiled (dynamic dashboards, reports, portal, PDF, CSV and cron).

**Workflow checks** — `npx tsx scripts/verify-phase2.ts`: **22/22 passed** (quotation → activation, server-side pricing, duplicate conversion rejected, billing cycle and skip, discount application and usage, partial → paid payment, over-payment rejected, reversal, lifecycle transitions, PDF structure). The script creates only `T2-` records and removes them, but its billing run legitimately bills real subscriptions: run `npm run db:seed` afterwards to restore the demo book.

**Odoo protocol checks** — `npx tsx scripts/odoo-transport-check.ts`: **12/12 passed** against a protocol-faithful JSON-RPC stub (auth mapping, request shape, retry/backoff, product/customer/invoice/payment mapping, idempotent re-push, audit logging, error surfacing). This proves the client contract, not a live deployment.

**Data-layer checks** — `npx tsx scripts/verify-phase3.ts`: **50/50 passed**. Coverage: date-range presets and inverted-range repair; admin/staff dashboard metrics and MRR↔ARR consistency; revenue, subscription, invoice and payment reports; bounded/sorted/filtered report tables; assistant intents (MRR, revenue, overdue, expiring, plans, fallback); portal scoping (own subscription readable, another customer's resolves to null); notification inbox; duplicate period invoice rejected by the unique constraint.

**HTTP and role checks against the production server**

- Admin (session cookie): `/admin`, `/admin/reports` (all tabs, date range, overdue filter), `/admin/assistant`, `/admin/integration`, `/admin/billing`, products, plans, discounts, users, `/notifications`, all `/ops/*` — all **200**; CSV export returned the expected invoice rows.
- Staff: `/staff` and `/ops/*` **200**; `/admin`, `/admin/reports`, `/admin/assistant`, `/admin/integration`, `/admin/users` → **302 `/forbidden`**.
- Customer: all `/portal/*` **200**; `/admin`, `/admin/reports`, `/staff` → **302 `/forbidden`**; `/ops/invoices` → **307 `/forbidden`**.
- Anonymous: `/admin` → `/login?callbackUrl=…`; `/api/reports/export` → **403**.
- Invalid password → `/login?error=CredentialsSignin&code=credentials` (no session).
- `GET /api/auth/session` confirmed the signed-in role for each account; the invalid-password cookie jar returned `null`.
- Repeated after the Phase 4 build against `npm start`: admin 15/15 routes 200 (incl. CSV export), staff 7/8 with `/admin*` and CSV denied (302/403), customer 9/9 portal routes 200 and every `/admin`, `/ops`, `/staff` route denied, anonymous redirected (307) with APIs returning 401/403.
- `/api/cron/billing` unauthenticated or without `CRON_SECRET` → **503** with an explicit message; nothing runs.

**Not verified** — anything requiring a live Odoo instance, a configured email provider, or a deployed Vercel project. These are reported as blockers, not passes.

---

## Deployment

The app is Vercel-compatible: Next.js App Router, Node runtime for PDF/CSV/cron routes, Prisma migrations, no server-side filesystem dependency.

1. Create a managed PostgreSQL database and set `DATABASE_URL` (append `?sslmode=require` if the provider requires TLS).
2. Set `AUTH_SECRET`, `AUTH_TRUST_HOST=true` and the production `NEXTAUTH_URL`/site URL.
3. Set `CRON_SECRET` (≥16 characters). Vercel Cron will call `/api/cron/billing` at 02:00 UTC via `vercel.json`; set `maxDuration` limits as allowed by the plan.
4. Set `ODOO_*` only when a real instance is available.
5. Optionally set `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL` to enable email; without them, in-app notifications still work.
6. Deploy, then run `npx prisma migrate deploy` against the production database and `npm run db:seed` only if you want the demo book in production.
7. Open `/api/health` (database + configuration probe), then sign in and re-run the role checks above.

Never commit `.env`; all secrets stay in the host's environment settings.

---

## Live judging sequence (~4 minutes)

1. **Admin** signs in → `/admin`: MRR/ARR, collection vs. billing chart, status distribution. Point out ₹ figures come from the seeded book.
2. **Admin** opens **Run billing cycle** → processing summary (already-invoiced periods are skipped, duplicates impossible).
3. **Staff** (`staff@brightloop.example`) → `/ops/quotations` → create a quotation for Northwind with a plan and lines → confirm → convert to a subscription → activate.
4. **Billing**: run the cycle again → invoice generated (or open an existing one) → apply/verify WELCOME10 discount on `INV-2026-0006`.
5. **Payments**: record a partial payment against `INV-2026-0003`, show the invoice move to *Partially paid* and the outstanding balance drop; open the invoice PDF.
6. **Odoo**: `/admin/integration` → show the honest blocker or, with credentials, **Test connection** and **Sync catalogue**, then the success/failed counts and retry controls.
7. **Reports**: `/admin/reports` → invoices tab → overdue filter → export CSV.
8. **Assistant**: `/admin/assistant` → “What is our MRR?”, “Which customers have overdue invoices?”.
9. **Customer** (`customer@northwind.example`) → `/portal`: subscriptions, upcoming billing, invoice PDF, payment history; try `/admin` to show the redirect to *Access denied*.

---

## Known limitations

- **Odoo is unverified**: no live instance or credentials in this environment. The integration screen states this rather than claiming success; retries and record mapping are implemented but untested against a real Odoo deployment.
- **No payment gateway**: payments are recorded manually (cash/bank/UPI/card references); nothing is collected through a gateway, and no such claim is made.
- **Email is optional and unconfigured**: in-app notifications are complete; no email is sent until `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL` are set.
- **Assistant is intentionally rule-based**: it answers the supported finance intents from SQL and refuses to guess. It does not accept arbitrary natural-language reasoning or mutations.
- **Rate limiting and in-process caches** assume a single server process; move them to Redis before horizontal scaling.
- **Cron requires `CRON_SECRET`**; scheduled billing is disabled without it (by design).
- **Demo data is not production data**: re-seeding rebuilds demo documents, so do not seed over a live book.

---

## Exact commands to run and demonstrate

```bash
npm install                 # deps + prisma generate
npm run db:start            # project-local PostgreSQL (skip if 5432 is already up)
npm run db:migrate          # apply migrations
npm run db:seed             # accounts + demo book
npm run dev                 # http://localhost:3000  (or: npm run build && npm start)

# verification (from a clean seed)
npm run typecheck && npm run lint && npm run build
npx tsx scripts/verify-phase2.ts && npm run db:seed   # phase 2 mutates demo billing
npx tsx scripts/verify-phase3.ts
npx tsx scripts/odoo-transport-check.ts
```

Sign in as `admin@brightloop.example / Admin@12345`, `staff@brightloop.example / Staff@12345`, `customer@northwind.example / Customer@12345`.

## Suggested next steps (not started)

1. **Live Odoo verification**: connect a real instance, run the sync checklist, record the exact version/API behaviour here.
2. **Email delivery**: wire a provider to `notifyCustomer`/`notifyRoles`, keep in-app as the fallback.
3. **Payments**: add a real gateway with webhook reconciliation, keeping manual recording for cash.
4. **Extensibility**: usage-based billing, proration, multi-currency, plan upgrades.
5. **Hardening**: Redis rate limiting, structured logging/metrics, queued Odoo retries, audit-log viewer.

Start with `src/lib/billing.ts`, `src/lib/subscriptions.ts`, `src/lib/queries/analytics.ts` and `src/lib/odoo/sync.ts`; `prisma/seed.ts` + `prisma/demo-data.ts` rebuild a working demo state.
