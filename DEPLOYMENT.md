# Deployment Guide — Prakriti CRM

This guide walks you through deploying Prakriti CRM from scratch to production.
**Total time: ~30–45 minutes.**

---

## Prerequisites

- Node.js 18+ installed ([nodejs.org](https://nodejs.org))
- Git installed ([git-scm.com](https://git-scm.com))
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account
- A free [GitHub](https://github.com) account

---

## Step 1 — Get the Code

### Option A: Clone from GitHub
```bash
git clone https://github.com/mkhirnval-prakriti/cloudehrms.git
cd cloudehrms
```

### Option B: Extract ZIP
```bash
unzip prakriti-crm.zip
cd prakriti-crm
```

---

## Step 2 — Install Dependencies

```bash
npm install
```

This installs all required packages (Next.js, Drizzle, Supabase, etc.)

---

## Step 3 — Setup Supabase

### 3a. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Enter:
   - **Project Name:** `prakriti-crm`
   - **Database Password:** (save this, you'll need it)
   - **Region:** Southeast Asia (Singapore) — closest to India
4. Click **Create New Project** and wait ~2 minutes

### 3b. Get Your Supabase Keys
1. In your Supabase project, go to **Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (different long string — keep this SECRET)

### 3c. Get Your Database URL
1. Go to **Settings → Database**
2. Scroll to **Connection String**
3. Select **URI** tab
4. Copy the string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the password you set in Step 3a

---

## Step 4 — Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxx

# Database (from Step 3c)
DATABASE_URL=postgresql://postgres:yourpassword@db.xxxx.supabase.co:5432/postgres

# App URL (for local dev)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5 — Create Database Tables

```bash
npm run db:push
```

This creates all tables in your Supabase database automatically.

You should see output like:
```
✓ Your schema has been pushed
```

---

## Step 6 — Seed Initial Data

```bash
npm run db:seed
```

This creates:
- All 36 Indian states
- Default lead sources (Facebook, Google, TV, etc.)
- Punjab districts

---

## Step 7 — Create Your First Admin User

1. Go to your Supabase project → **Authentication → Users**
2. Click **Add User → Create New User**
3. Enter email and password
4. Copy the **User UID** shown after creation

Now add this user to your database:
1. Go to **Table Editor → users** table
2. Click **Insert Row**
3. Fill in:
   - `supabase_id`: (paste the UID you copied)
   - `name`: Your Name
   - `email`: your@email.com
   - `role`: Admin
   - `is_active`: true

---

## Step 8 — Run Locally (Test Before Deploying)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

Login with the email/password you created in Step 7.

If everything works, proceed to deployment.

---

## Step 9 — Push to GitHub

### If using the existing repo:
```bash
git add .
git commit -m "Initial CRM setup"
git push origin main
```

### If setting up fresh GitHub repo:
1. Create a new repository at [github.com/new](https://github.com/new)
2. Name it `prakriti-crm` (or any name)
3. Run:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/prakriti-crm.git
git push -u origin main
```

---

## Step 10 — Deploy to Vercel

### 10a. Connect GitHub to Vercel
1. Go to [https://vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Click **Import Git Repository**
4. Select your `prakriti-crm` repository
5. Click **Import**

### 10b. Configure Environment Variables in Vercel
Before clicking Deploy, click **Environment Variables** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `DATABASE_URL` | Your database URL |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://prakriti-crm.vercel.app`) |

### 10c. Deploy
1. Click **Deploy**
2. Wait 2–3 minutes for the build to complete
3. Vercel will give you a URL like `https://prakriti-crm-xxx.vercel.app`

---

## Step 11 — Update Supabase Auth Settings

1. Go to Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL:
   ```
   https://prakriti-crm-xxx.vercel.app
   ```
3. Under **Redirect URLs**, add:
   ```
   https://prakriti-crm-xxx.vercel.app/**
   ```
4. Click **Save**

---

## Step 12 — Custom Domain (Optional)

### In Vercel:
1. Go to your project → **Settings → Domains**
2. Add your domain: `crm.prakritiherbs.com`
3. Follow the DNS configuration instructions shown

### In Cloudflare (if using):
1. Add a CNAME record:
   - Name: `crm`
   - Target: `cname.vercel-dns.com`
   - Proxy: ON (orange cloud)
2. In Vercel, verify the domain

---

## Updating the App

Any time you push changes to GitHub, Vercel automatically redeploys:

```bash
git add .
git commit -m "Your changes description"
git push origin main
```

Vercel detects the push and redeploys in ~2 minutes.

---

## Troubleshooting

### "Invalid login credentials"
- Check that your user exists in both Supabase Auth AND the `users` table
- Confirm `supabase_id` in the users table matches the Auth user UID

### "Database connection error"
- Verify `DATABASE_URL` is correct and includes your password
- In Supabase: Settings → Database → check password is correct

### "NEXT_PUBLIC vars not found"
- Redeploy after setting environment variables in Vercel

### Build fails
- Run `npm run build` locally first to catch errors
- Check the Vercel build logs for specific errors

---

## Railway Alternative (Backend Only)

If you prefer Railway for hosting:

1. Go to [railway.app](https://railway.app)
2. Click **New Project → Deploy from GitHub**
3. Select your repo
4. Add the same environment variables
5. Railway auto-detects Next.js and deploys

---

## Architecture Summary

```
Browser
  ↓
Cloudflare CDN (cache, DDoS protection)
  ↓
Vercel (Next.js App — frontend + API routes)
  ↓
Supabase (PostgreSQL database + Auth)
```

All data lives in Supabase PostgreSQL. Vercel handles the app logic. Cloudflare sits in front for performance.
