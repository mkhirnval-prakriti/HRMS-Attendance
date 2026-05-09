# Local Setup Guide — Prakriti CRM

Complete guide for setting up Prakriti CRM on your local machine for development.

---

## System Requirements

| Tool | Minimum Version | Check with |
|------|----------------|------------|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Git | 2.x | `git --version` |

---

## Step 1 — Get the Code

```bash
# Option A: From GitHub
git clone https://github.com/mkhirnval-prakriti/cloudehrms.git
cd cloudehrms

# Option B: From ZIP
unzip prakriti-crm.zip
cd prakriti-crm
```

---

## Step 2 — Install Node Modules

```bash
npm install
```

Expected output ends with `added XXX packages`.

---

## Step 3 — Setup Database (Supabase)

You need a PostgreSQL database. Supabase offers a free tier.

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → Database → Connection String → URI**
4. Copy the connection string

---

## Step 4 — Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# ─── Supabase ─────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ─── Database ─────────────────────────────────
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# ─── App ──────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to find these values:
- Supabase Dashboard → Settings → API → **Project URL** and **API Keys**
- Supabase Dashboard → Settings → Database → **Connection String**

---

## Step 5 — Push Database Schema

```bash
npm run db:push
```

This creates all tables. Run this once, or after schema changes.

---

## Step 6 — Seed Data

```bash
npm run db:seed
```

Seeds:
- 36 Indian states
- Default lead sources
- Punjab districts (for testing)

---

## Step 7 — Create Admin User

### In Supabase:
1. Go to **Authentication → Users → Add User → Create New User**
2. Email: `admin@prakritiherbs.com`
3. Password: your choice
4. Copy the **User UID**

### In Supabase Table Editor:
1. Go to **Table Editor → users**
2. Click **Insert Row**:
   ```
   supabase_id: (paste UID)
   name: Admin
   email: admin@prakritiherbs.com
   role: Admin
   is_active: true
   ```

---

## Step 8 — Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Login with your admin credentials.

---

## Development Scripts

```bash
npm run dev          # Start with hot reload
npm run build        # Check for build errors
npm run lint         # Run ESLint
npm run db:push      # Push schema changes
npm run db:studio    # Visual DB browser (Drizzle Studio)
npm run db:seed      # Re-seed data
```

---

## Folder Structure

```
prakriti-crm/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (dashboard)/          # All protected pages
│   │   ├── dashboard/        # Home dashboard
│   │   ├── orders/           # Orders list + create + bulk upload
│   │   ├── follow-ups/       # Follow-up scheduler
│   │   ├── users/            # User management
│   │   ├── dealers/          # Dealer management
│   │   ├── invoices/         # Invoice management
│   │   ├── reports/          # Analytics & reports
│   │   ├── items/            # Product catalog
│   │   ├── settings/         # Source management
│   │   └── audit-logs/       # Change history (Admin)
│   ├── api/                  # API route handlers
│   │   ├── orders/           # Order CRUD + bulk
│   │   ├── dealers/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── reports/
│   │   ├── users/
│   │   ├── follow-ups/
│   │   ├── audit-logs/
│   │   └── dashboard/
│   ├── globals.css           # Tailwind + custom classes
│   └── layout.tsx            # Root layout
├── components/
│   ├── layout/               # Sidebar, Header, Shell
│   └── orders/               # Edit modal, Bulk actions
├── lib/
│   ├── auth/                 # Auth helpers
│   ├── db/                   # Drizzle + schema + seed
│   ├── supabase/             # Supabase admin client
│   ├── validations/          # Zod schemas
│   └── utils.ts              # Utilities + constants
├── middleware.ts              # Auth middleware
├── drizzle.config.ts          # DB config
├── .env.example               # Environment template
└── docker-compose.yml         # Docker setup
```

---

## Common Issues

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Schema out of sync
```bash
npm run db:push
```

### Can't login
- Verify user exists in Supabase Auth AND in `users` table
- Confirm `supabase_id` matches

### "Cannot find module" errors
```bash
rm -rf node_modules
npm install
```

### TypeScript errors
```bash
npm run build
```
This shows all type errors.

---

## Docker (Alternative)

If you prefer Docker:

```bash
docker-compose up --build
```

This starts:
- CRM app on port 3000
- Local PostgreSQL on port 5432

Note: You still need to configure Supabase Auth (or adjust to use local auth).
