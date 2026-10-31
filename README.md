# SubscribeIQ — Brightloop Software

Subscription management, recurring billing and Odoo synchronisation for **Brightloop Software**, built for **Odoo x Makeathon 9.0**.

> **Status:** Foundation, authentication, role-based access control, the full data model and the Odoo integration layer are implemented and verified. Product, plan, quotation, subscription, billing, invoice, discount and payment modules arrives in next commits

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI primitives) |
| Database | PostgreSQL 18 (local cluster, port 5433) |
| ORM | Prisma 6 (`prisma migrate`, typed client) |
| Auth | Auth.js v5 (Credentials, JWT sessions) + bcrypt |
| Validation | Zod (shared client/server schemas) |
| ERP | Odoo JSON-RPC 2.0 external API |

---

## Getting started

### 1. Environment

```bash
cp .env.example .env
# generate a session secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

`.env` keys:

```ini
DATABASE_URL="postgresql://postgres@127.0.0.1:5433/subscriptiq?schema=public"
AUTH_SECRET="<generated>"
AUTH_TRUST_HOST="true"
ODOO_URL=""
ODOO_DB=""
ODOO_USERNAME=""
ODOO_PASSWORD=""
ODOO_TIMEOUT_MS="20000"
```

`ODOO_PASSWORD` accepts either the user's password or — on Odoo 14 and newer, which is what you should use — an **API key** created at *Preferences → Account Security → New API Key*.

### 2. Database

A project-local PostgreSQL cluster already exists in `.pgdata` (port **5433**, trust auth, gitignored). Start and stop it from a normal terminal:

```bash
npm run db:start   # pg_ctl -D .pgdata start
npm run db:stop
```

To use your own PostgreSQL server instead, point `DATABASE_URL` at it and skip `db:start`.

```bash
npm run db:migrate   # prisma migrate dev
npm run db:seed      # demo accounts, products, plans, taxes, discount
```

### 3. Run

```bash
npm run dev     # http://localhost:3000
```

### Demo accounts (created by `npm run db:seed`)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@brightloop.example` | `Admin@12345` |
| Staff | `staff@brightloop.example` | `Staff@12345` |
| Customer | `customer@northwind.example` | `Customer@12345` |

Public registration always creates a **customer** account. Staff accounts are created by an administrator on `/admin/users`.

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
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |
| `npx tsx --env-file=.env scripts/odoo-transport-check.ts` | Odoo client protocol test (12 checks) |

---

## Architecture

```
prisma/
  schema.prisma           # 17 models, enums, indexes, unique constraints
  seed.ts                 # idempotent demo data
src/
  app/
    (auth)/               # login, register, forgot/reset password (split-panel layout)
    admin/                # admin dashboard, staff accounts, Odoo integration
    staff/                # staff operational dashboard
    portal/               # customer portal
    api/auth/[...nextauth] # Auth.js handlers
    api/health            # readiness probe (db + Odoo config, no secrets)
    forbidden/            # role-mismatch screen
  components/
    ui/                   # design-system primitives (stat card, status badge, …)
    layout/               # navy sidebar shell, user menu
    auth/ admin/          # feature components
  lib/
    auth/                 # Auth.js config (edge-safe split), guards, password policy
    actions/              # server actions (auth, staff, odoo)
    odoo/                 # client, sync services, typed errors, audit logger
    queries/              # dashboard read models
    validations/          # Zod schemas
  middleware.ts           # edge route/role guard
```

### Security model

- Roles are enforced **server-side** in three layers: middleware (edge), layout guards (`requireAdmin`, `requireStaffAccess`, `requireCustomer`), and every server action (`getAuthorizedUser`, which re-reads the account so deactivation and role changes apply immediately).
- Passwords: bcrypt cost 12; policy = more than 8 characters, uppercase, lowercase, special character; enforced in Zod and re-checked server-side.
- Password reset uses single-use, SHA-256-hashed tokens with a 1-hour expiry; the response is identical for unknown emails so the form cannot enumerate accounts.
- Login attempts are rate-limited per email (6/minute). The limiter is in-process — move it to Redis before scaling horizontally.
- Odoo credentials live only in server-side environment variables. They are never imported into client components; the integration screen renders only *whether* a secret is configured.

---

## Odoo integration

Transport: `/jsonrpc` (JSON-RPC 2.0) — the endpoint that Odoo exposes across Community, Enterprise, Odoo Online and self-hosted deployments, and the one that survives the XML-RPC retirement in newer releases. Authenticates with a password or an Odoo 14+ API key.

Implemented in `src/lib/odoo/`:

- `client.ts` — authentication with cached uid, `execute_kw`, per-request timeouts, 3 attempts with exponential backoff + jitter, retry classification that only repeats transient failures (network, HTTP 5xx/429, Odoo concurrency errors) and never a rejected login or validation error.
- `sync.ts` — connection verification, product+variant push (`product.template`/`product.product`, matched on `default_code`/SKU), customer push (`res.partner`, matched on `ref` = customer number), invoice creation + posting (`account.move`), payment mirroring (`account.payment`), record-id mapping stored on each local row, and idempotent re-pushes.
- `logger.ts` — every attempt writes an `OdooSyncLog` row with entity, operation, Odoo id, attempt count, duration, payloads and the Odoo error message.

### Current status — blocked, not mocked

No Odoo instance or credentials are available in this environment, so **no real synchronisation has been claimed**. The integration screen (`/admin/integration`) states the blocker explicitly and lists the missing variables.

To connect a real instance:

1. Create an integration user in Odoo with access to Inventory/Sales/Invoicing (an administrator is easiest for a demo).
2. Generate an API key for that user.
3. Fill `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME` and `ODOO_PASSWORD` in `.env`; restart `npm run dev`.
4. Open `/admin/integration` → **Test connection** (authenticates and reads the user/company), then **Sync catalogue**.

The client protocol itself is covered by `scripts/odoo-transport-check.ts`, which runs the real service layer against a protocol-faithful JSON-RPC stub and asserts 12 behaviours (auth, request shape, retry, error mapping, record mapping, idempotency, empty-invoice rejection, audit rows). It is a transport test — **not** proof that a specific Odoo deployment is reachable.

---

## Verification performed (Phase 1)

- `npx tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm run build` — production build succeeded (15 routes, middleware compiled).
- `/api/health` — database connected.
- Auth + RBAC exercised in a browser: admin login → `/admin`; customer login → `/portal`; staff login → `/staff`; admin → `/portal` redirected to `/forbidden`; customer and staff → `/admin/*` redirected to `/forbidden`; unauthenticated → `/login?callbackUrl=…`.
- Registration: weak password rejected server-side with the exact rule; valid registration created customer `CUST-00003` and signed the user in.
- Failed login keeps the email and clears the password; wrong credentials show a single generic message.
- Admin created a staff account from `/admin/users`; that account signed in with staff scope.
- Unconfigured Odoo: integration screen and **Test connection** report the precise missing variables.
- Odoo transport harness: 12/12 checks passed.

---

## Next: Phase 2

1. **Product & plan management** (`/admin/products`, `/admin/plans`, `/admin/taxes`): CRUD with variants and additive pricing, archive instead of delete, plan intervals/min quantity/availability windows, and Odoo push buttons wired to `syncProduct`.
2. **Customers & quotations** (`/staff/customers`, `/staff/quotations`): customer CRUD, quotation builder with price/tax calculation, validity period, confirm → convert to subscription.
3. **Subscriptions** (`/staff/subscriptions`): lifecycle Draft → Quotation → Confirmed → Active → Closed, plus pause/resume/renew/early-cancel, each recording a `SubscriptionEvent`.
4. **Billing engine** (`src/lib/billing/`): pick due subscriptions, compute the period key, create invoices inside a transaction guarded by `@@unique([subscriptionId, billingPeriodKey])`, apply eligible discounts, and log to `BillingLog` under a `BillingRun`. Expose **Run billing cycle** on the admin dashboard.
5. **Invoices, payments, discounts**: confirm/cancel/send, print view, partial payments that update `amountPaid` and status; admin-only discount rules with usage and expiry enforcement; push invoices/payments to Odoo via the existing services.

### Known gaps that Phase 2/3 should close

- No transactional email provider is configured, so the password-reset link is logged server-side and surfaced on-screen in development only.
- Navigational search in the top bar is a placeholder until the listing modules exist.
- Rate limiting and the in-process caches assume a single Next.js server process.
