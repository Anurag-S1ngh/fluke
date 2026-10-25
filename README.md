# fluke

A play-money prediction market. Every question trades in cents between 1¢ and 99¢, and each winning share pays $1.00 when the question resolves. No real money, no house position, no hidden spread.

## What it does

- **Email OTP auth** — sign up or sign in with a one-time code. New accounts start with $1,000 in play money; a daily grant is added on the first verification of each UTC day.
- **Markets** — write a question, publish it, close the book automatically at `closesAt` (or manually), then resolve YES/NO or refund every position.
- **Trading** — limit orders cross the book automatically with price-time priority. Partial fills, cash/share reservation, and no self-trading.
- **Portfolio** — cash, open and settled positions, resting orders, and cancellation.
- **Admin desk** — create, publish, close, resolve, refund, and delete markets.
- **Demo data** — a seeder that builds users, markets, a real trade tape, positions, and ledger history.

## Stack

- **Web** — Next.js 16 (App Router), React 19, Tailwind CSS, shared shadcn/ui primitives in `packages/ui`
- **API** — Express 5 on Bun, Zod validation, JWT session cookie
- **Data** — PostgreSQL with Drizzle ORM; Redis for OTP storage
- **Email** — Resend for OTP delivery
- **Tooling** — Turborepo, Oxlint + Oxfmt, Varlock for environment schemas

## Project structure

```
fluke/
├── apps/
│   ├── web/                 # Next.js frontend (:3001)
│   └── server/              # Express API (:3000, mounted at /api/v1)
├── packages/
│   ├── db/                  # Drizzle schema, migrations, and demo seeder
│   ├── email/               # Resend client and OTP template
│   ├── redis/               # Redis client
│   ├── ui/                  # Shared shadcn/ui components and global styles
│   └── config/              # Shared TypeScript/lint configuration
├── turbo.json
└── package.json
```

Money is stored as **integer cents** (`1250` is $12.50), and prices are integer cents between `1` and `99`.

### API overview

| Area      | Endpoints                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------- |
| Auth      | `POST /auth/signup`, `POST /auth/signin`, `POST /auth/verify`, `POST /auth/signout`, `GET /auth/me` |
| Markets   | `GET /markets?status=`, `GET /markets/:id`, `GET /markets/:id/history`                              |
| Admin     | `POST /markets`, `PATCH /markets/:id/publish`, `/close`, `/resolve`, `DELETE /markets/:id`          |
| Orders    | `GET /orders`, `GET /orders/book?marketId=`, `POST /orders`, `DELETE /orders/:id`                   |
| Positions | `GET /positions`                                                                                    |

Admin routes require a session whose user has the `ADMIN` role.

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.4+
- PostgreSQL
- Redis
- A [Resend](https://resend.com) API key and a verified sender address (needed to deliver OTP emails)

### 1. Install dependencies

```bash
bun install
```

The `postinstall` script runs `varlock codegen` to generate each package's typed `env.ts`.

### 2. Configure environment

`.env` files are gitignored. Each app owns a `.env.schema` that documents its variables; copy those values into local `.env` files.

**`apps/server/.env`**

| Variable         | Notes                                                   |
| ---------------- | ------------------------------------------------------- |
| `NODE_ENV`       | `development`, `production`, or `test`                  |
| `CORS_ORIGIN`    | Web origin, e.g. `http://localhost:3001`                |
| `DATABASE_URL`   | PostgreSQL connection string                            |
| `REDIS_URL`      | Redis connection string, e.g. `redis://localhost:6379`  |
| `RESEND_API_KEY` | Resend API key                                          |
| `EMAIL_FROM`     | Verified sender, e.g. `fluke <no-reply@yourdomain.com>` |
| `JWT_SECRET`     | Session signing secret, at least 32 characters          |

**`apps/web/.env`**

| Variable                 | Notes                                    |
| ------------------------ | ---------------------------------------- |
| `NEXT_PUBLIC_SERVER_URL` | API origin, e.g. `http://localhost:3000` |

After changing any `.env.schema`, regenerate the typed env files:

```bash
bun run env:generate
```

### 3. Create the database schema

Apply the committed migrations:

```bash
bun run db:migrate
```

For rapid local iteration you can push the schema directly instead:

```bash
bun run db:push
```

The shared database packages read `DATABASE_URL` from `apps/server`, so keep that file up to date.

### 4. Seed demo data (optional)

Run from the server app so Varlock loads the right environment:

```bash
cd apps/server
bun run db:seed
```

This creates 14 markets across every status, one admin, nine traders (three of them market makers), a generated price history, resting orders, positions, and a matching ledger. It ends by printing the demo admin's username and email.

- The seed is idempotent: if the demo admin already exists it exits without writing.
- Rebuild from scratch with `bun run db:seed -- --reset` (removes only seeded users and markets).

To use the admin desk locally, either change `ADMIN` in `packages/db/src/seed.ts` to an inbox you control before seeding, or promote an existing account:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

### 5. Run the apps

```bash
bun run dev
```

- Web: [http://localhost:3001](http://localhost:3001)
- API: [http://localhost:3000](http://localhost:3000)

Or run one at a time:

```bash
bun run dev:web
bun run dev:server
```

## Scripts

Run these from the repository root.

| Script                 | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `bun run dev`          | Start web and server together                        |
| `bun run dev:web`      | Start only the Next.js app                           |
| `bun run dev:server`   | Start only the API                                   |
| `bun run build`        | Build all apps and packages                          |
| `bun run check-types`  | Type-check every workspace                           |
| `bun run check`        | Run Oxlint and format with Oxfmt                     |
| `bun run format`       | Format with Oxfmt                                    |
| `bun run db:migrate`   | Apply Drizzle migrations                             |
| `bun run db:generate`  | Generate a migration from schema changes             |
| `bun run db:push`      | Push the schema without a migration                  |
| `bun run db:studio`    | Open Drizzle Studio                                  |
| `bun run db:test:push` | Push the schema to the test database                 |
| `bun run test`         | Run the server test suite against the test database  |
| `bun run compose:up`   | Start Postgres and Redis with Docker                 |
| `bun run compose:down` | Stop the Docker services                             |
| `bun run env:generate` | Regenerate typed `env.ts` files after schema changes |

Server-only commands, run from `apps/server`:

| Script                       | Purpose                        |
| ---------------------------- | ------------------------------ |
| `bun run test`               | Run the server test suite      |
| `bun run test:watch`         | Re-run tests on file changes   |
| `bun run db:seed`            | Seed demo data                 |
| `bun run db:seed -- --reset` | Rebuild demo data from scratch |

## Testing

The server has unit/integration tests for auth, order matching, settlement, and positions. They talk to a real PostgreSQL database and Redis, and they **truncate tables between tests**.

The suite refuses to run unless the database name ends in `_test`:

```text
refusing to run tests against non-test database "fluke" —
set DATABASE_URL to a database ending in _test
```

Tests use a separate database and Redis database from development, so a run cannot wipe your dev data.

### Setup

`docker/compose.yaml` starts Postgres (with `fluke_test` created by the init script) and Redis:

```bash
bun run compose:up
```

Create `apps/server/.env.test` (gitignored) with the test overrides:

```dotenv
DATABASE_URL=postgresql://fluke:fluke@localhost:5432/fluke_test
REDIS_URL=redis://localhost:6379/1
```

Use the same credentials as the `DATABASE_URL` in `apps/server/.env` and change only the database name. The values above match the compose services. Redis database `1` keeps test keys out of the development database.

Varlock loads `.env` first and `.env.test` on top when `NODE_ENV=test`, so secrets such as `JWT_SECRET` still come from `.env`. Process environment variables override both.

Apply the schema to the test database whenever the schema changes:

```bash
bun run db:test:push
```

### Run

```bash
bun run test
```

The `test` script in `apps/server` sets `NODE_ENV=test`, which makes Varlock load `.env.test`. Turbo runs the task uncached because the tests mutate the database.

If the Postgres volume already exists from an earlier boot, `fluke_test` may be missing. Recreate the volume once:

```bash
bun run compose:down
docker compose -f docker/compose.yaml down -v
bun run compose:up
bun run db:test:push
```

Email delivery is mocked in tests, so no Resend key is exercised there.

## Environment and secrets

Each app owns an `.env.schema` consumed by [Varlock](https://varlock.dev); the generated `src/env.ts` files are typed. Commit schemas, never `.env` files. Bun's automatic env loading is disabled in `bunfig.toml` — Varlock loads configuration at startup, including in standalone scripts like the seeder and Drizzle config.

## Current limitations

These are known gaps, not undocumented surprises:

- **Daily grant requires re-verification.** The grant runs during OTP verification, so a user staying signed in across days will not receive it until their next sign-in.
- **No OTP rate limiting.** There is no attempt cap or send throttle on `/auth/signup` and `/auth/signin`.
- **No pagination.** Market, order, and position lists are unpaginated; price history is capped at the newest 2,000 trades.
- **No deployment configuration.** There is no Dockerfile or log/metrics integration; CI only runs tests and type checks.

## Built with

Scaffolded with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).
