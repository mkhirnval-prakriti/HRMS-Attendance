# HRMS-PLUS-ATTENDANCE: Complete Setup Guide

> **⏱️ Time to Complete**: 15-30 minutes
> **📊 Difficulty**: Beginner-Friendly
> **✨ Latest Update**: May 9, 2026

---

## 📋 Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [Detailed Setup (15 minutes)](#detailed-setup)
3. [Testing Locally](#testing-locally)
4. [Deployment Options](#deployment-options)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- ✅ Node.js 20+ ([install here](https://nodejs.org))
- ✅ Git ([install here](https://git-scm.com))
- ✅ GitHub account (free at [github.com](https://github.com))
- ✅ Supabase account (free at [supabase.com](https://supabase.com))

### Steps (Copy & Paste)

```bash
# 1. Clone the project
git clone https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE.git
cd HRMS-PLUS-ATTENDANCE

# 2. Install dependencies
npm install

# 3. Setup environment (see below)
# Create .env.local and fill with values

# 4. Run locally
npm run dev

# 5. Open in browser
# Visit http://localhost:3000
```

---

## 🔧 Detailed Setup

### Step 1: Setup Supabase (Free Tier)

<details>
<summary>📚 Click to expand</summary>

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Click "Sign Up" (free tier available)
   - Sign in with GitHub (recommended)

2. **Create a New Project**
   - Click "New Project"
   - Fill in:
     - **Name**: `hrms-plus-attendance`
     - **Database Password**: Create a strong password
     - **Region**: Select closest to you (e.g., "us-east-1" or "eu-west-1")
   - Click "Create new project" (takes 1-2 minutes)

3. **Get Your Credentials**
   - Go to **Settings** → **API**
   - You'll see:
     - **Project URL** → Copy this to `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** key → Copy to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role secret** key → Copy to `SUPABASE_SERVICE_ROLE_KEY`

4. **Get Database Connection String**
   - Go to **Settings** → **Database**
   - Copy the "Connection String" (you'll see an option to copy)
   - Paste to `DATABASE_URL` in your `.env.local`
   - ⚠️ Make sure to replace `[YOUR-PASSWORD]` with your actual password!

5. **Create Tables (Database Schema)**
   - Go to **SQL Editor** in Supabase
   - Create a new query
   - Copy-paste the schema from `DATABASE.md` file in this project
   - Click "Run"
   - ✅ Tables should appear in the left sidebar

</details>

### Step 2: Create `.env.local` File

<details>
<summary>📝 Click to expand</summary>

**Option A: Using the Template**
- Copy `.env.local` file that was already created
- Fill in your Supabase values from Step 1

**Option B: Manual Creation**
1. In project root, create file named `.env.local`
2. Add these lines (fill in YOUR actual values):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_SECRET=your-random-secret-min-32-chars-here
```

3. **Generate APP_SECRET**:
   - **Windows PowerShell**:
     ```powershell
     [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object {Get-Random -Maximum 256}))) | substring 0 32
     ```
   - **Mac/Linux**:
     ```bash
     openssl rand -base64 32
     ```
   - **Online**: [generate-random.org](https://generate-random.org)

4. ⚠️ **Important**: This file is in `.gitignore` - it WON'T be committed to GitHub

</details>

### Step 3: Install Dependencies

```bash
npm install
```

This installs all required packages (~397 packages).

### Step 4: Validate Environment

```bash
npm run validate:env
```

You should see:
```
✅ VALIDATION PASSED: All required variables are set
```

---

## 🧪 Testing Locally

### Start Development Server

```bash
npm run dev
```

You should see:
```
> next dev

  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000
  - Environments: .env.local
```

### Test in Browser

1. Open [http://localhost:3000](http://localhost:3000)
2. You should see **Login Page**
3. If you see errors, check console (`F12` → **Console** tab)

### Common Issues

| Issue | Solution |
|-------|----------|
| **Cannot find module** | Run `npm install` again |
| **Environment variables not found** | Check `.env.local` file exists and is filled |
| **Database connection error** | Verify `DATABASE_URL` is correct, check Supabase status |
| **Port 3000 already in use** | Kill other process: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows) |

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended for Next.js) ⭐

**Best for**: Quick deployment, free tier, automatic updates from GitHub

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up" (use GitHub account)
   - Click "Import Project"
   - Select your `HRMS-PLUS-ATTENDANCE` repository
   - Click "Import"

3. **Add Environment Variables**
   - Vercel will ask for environment variables
   - Add all values from your `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `DATABASE_URL`
     - `APP_SECRET`
   - Click "Deploy"

4. **Access Your App**
   - Deployment completes in 2-5 minutes
   - Vercel gives you a URL like: `https://hrms-plus-attendance.vercel.app`
   - Click the link to access your live app! 🎉

### Option 2: Docker (For Self-Hosted)

```bash
# Build Docker image
docker build -t hrms-plus-attendance .

# Run with environment file
docker run -p 3000:3000 --env-file .env.docker hrms-plus-attendance
```

### Option 3: Railway/Render (Free Tier Available)

Similar to Vercel:
1. Connect GitHub repo
2. Add environment variables
3. Auto-deployment on git push

---

## 📚 API Documentation

All API endpoints require authentication. See `API_DOCUMENTATION.md` for:
- Order management
- User management  
- Reporting
- Follow-ups
- Invoice management
- And more...

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-09T12:00:00Z",
  "uptime": 123.45,
  "environment": "development",
  "checks": {
    "supabase": true,
    "database": true,
    "secrets": true
  }
}
```

---

## 🔒 Security Best Practices

✅ **What We've Done**
- [x] Created `.gitignore` to prevent committing secrets
- [x] Added security headers in middleware
- [x] Environment validation on startup
- [x] Service role key kept separate from anon key
- [x] Health check endpoint for monitoring

✅ **What You Should Do**
- [ ] Never commit `.env.local` file
- [ ] Rotate secrets periodically (every 90 days)
- [ ] Use strong database passwords
- [ ] Enable 2FA on Supabase & GitHub accounts
- [ ] Monitor Supabase logs regularly
- [ ] Review user roles monthly

---

## 🐛 Troubleshooting

### Build Errors

**TypeScript Error**:
```bash
npm run lint
```

Check the output and fix errors.

**Module Not Found**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Runtime Errors

**Check console** (`F12` or `right-click` → **Inspect** → **Console**)

**Common solutions**:
1. Check `.env.local` is correct
2. Check Supabase project is active
3. Restart dev server: `Ctrl+C` then `npm run dev`
4. Clear browser cache: `Ctrl+Shift+Delete`

### Database Issues

**Schema not created**:
1. Go to Supabase SQL Editor
2. Run migrations from `DATABASE.md`
3. Verify tables appear in Supabase UI

**Connection timeout**:
- Check DATABASE_URL
- Verify Supabase project is running
- Check your internet connection

---

## 📞 Getting Help

1. **Check logs**: Look at browser console and terminal output
2. **Read docs**: See `API_DOCUMENTATION.md`, `DATABASE.md`, `DEPLOYMENT.md`
3. **GitHub Issues**: Report bugs at [GitHub Issues](https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE/issues)
4. **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
5. **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

## ✅ Verification Checklist

Before going to production, verify:

- [ ] `.env.local` has all required variables
- [ ] `npm run validate:env` passes
- [ ] `npm run dev` works without errors
- [ ] Can login at `http://localhost:3000/login`
- [ ] Dashboard loads without errors
- [ ] Can create/view/edit data
- [ ] Health check works: `/api/health`
- [ ] All API endpoints respond (check Network tab in DevTools)
- [ ] Database is seeded with initial data
- [ ] No console errors (F12 → Console)

---

## 🎓 Next Steps

After successful setup:

1. **Customize for your organization**
   - Update company name and logo
   - Configure role-based access
   - Add your business rules

2. **Add users**
   - Go to Supabase → Authentication → Users
   - Create test users
   - Assign roles

3. **Populate data**
   - Create sample orders, dealers, agents
   - Test all features
   - Verify reporting works

4. **Deploy to production**
   - Follow Vercel/Docker deployment steps above
   - Configure production database
   - Test on live URL

5. **Monitor and maintain**
   - Check error logs regularly
   - Monitor database usage
   - Update dependencies monthly

---

## 📄 License & Support

This is a commercial HRMS + Attendance system.

For support, contact: `support@hrmsplus.local`

---

**Happy deploying! 🚀**

Last updated: May 9, 2026
