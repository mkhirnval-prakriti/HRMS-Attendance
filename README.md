# Prakriti Herbs CRM

A full-featured Customer Relationship Management system built for Prakriti Herbs — managing 1,00,000+ orders, agents, dealers, invoices, and analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth + SSR |
| File Upload | SheetJS (xlsx) |
| Charts | Recharts |
| Deployment | Vercel (frontend) + Supabase (DB) |

## Features

- **Orders** — Create, edit, bulk upload (Excel/CSV), export, filter, status tracking
- **Follow-ups** — Scheduled follow-up calendar with overdue alerts
- **Dealers** — CRUD, invoice assignment, payment tracking, balance ledger
- **Invoices** — B2B invoice creation, PDF print, payment recording
- **Reports** — Agent performance, source analytics, dealer ledger, exportable Excel
- **Users** — Role-based access (Admin / ZM / User / Field)
- **Audit Logs** — Full change history (Admin only)
- **Dashboard** — Real-time KPIs, charts, activity feed

## Roles

| Role | Access |
|------|--------|
| Admin | Full access to everything |
| ZM | Zone Manager — sees team's orders, dealers, reports |
| User | Own orders only |
| Field | Own orders only (limited edit) |

## Quick Start

```bash
git clone https://github.com/mkhirnval-prakriti/cloudehrms.git
cd cloudehrms
npm install
cp .env.example .env.local
# Fill in your .env.local values
npm run db:push
npm run db:seed
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push schema to database
npm run db:seed      # Seed initial data (states, sources)
npm run db:studio    # Open Drizzle Studio (DB GUI)
```

## Environment Variables

See `.env.example` for all required variables. Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full step-by-step guide.

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel + Supabase deployment
- [DATABASE.md](./DATABASE.md) — Schema documentation
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) — API reference
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) — Local development setup
