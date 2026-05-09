# GitHub Repository Setup Guide

> **Status**: Ready to Push
> **Repository Name**: HRMS-PLUS-ATTENDANCE
> **Last Updated**: May 9, 2026

---

## 🔑 Prerequisites

- [ ] GitHub account (free at [github.com](https://github.com))
- [ ] Git installed (`git --version`)
- [ ] Project ready locally ✅ (ALREADY DONE!)

---

## 📍 STEP 1: Create Repository on GitHub

### Option A: Using GitHub Web Interface (Easiest)

1. **Login to GitHub**
   - Go to [github.com](https://github.com)
   - Sign in with your account

2. **Create New Repository**
   - Click "+" icon (top right) → "New repository"
   - Or go to [github.com/new](https://github.com/new)

3. **Fill Repository Details**
   ```
   Repository name:  HRMS-PLUS-ATTENDANCE
   Description:      Enterprise HRMS + Attendance Management System
   Public/Private:   Choose based on your preference
   Initialize:       ❌ NO (don't initialize - we have local repo)
   ```

4. **Create Repository**
   - Click "Create repository"
   - GitHub shows setup instructions

### Option B: Using GitHub CLI (Faster)

```bash
# Install GitHub CLI from https://cli.github.com

# Login to GitHub
gh auth login

# Create repository
gh repo create HRMS-PLUS-ATTENDANCE --public --source=. --remote=origin --push
```

---

## 📤 STEP 2: Connect Local Repository to GitHub

### Get Your Repository URL

From GitHub (after creating repo):
- Click green "Code" button
- Copy the HTTPS URL
- Should look like: `https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE.git`

### Add Remote and Push

```bash
# Navigate to project
cd HRMS-PLUS-ATTENDANCE

# Add GitHub as remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE.git

# Verify remote added
git remote -v

# Push all code to GitHub
git branch -M main
git push -u origin main
```

---

## ✅ STEP 3: Verify on GitHub

1. Go to your repository: `https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE`
2. You should see:
   - [ ] All project files listed
   - [ ] `.gitignore` file (to prevent committing secrets)
   - [ ] All documentation files (README, SETUP_GUIDE, etc.)
   - [ ] `package.json` with dependencies
   - [ ] Source code in `app/`, `components/`, `lib/` folders

3. **Never commit** (verify not in repository):
   - [ ] `.env.local` ✅ (in .gitignore)
   - [ ] `node_modules/` ✅ (in .gitignore)
   - [ ] `.next/` build folder ✅ (in .gitignore)

---

## 🔐 GitHub Security Settings (Recommended)

### Protect Main Branch

1. Go to **Settings** → **Branches**
2. Click "Add rule" under "Branch protection rules"
3. Set:
   ```
   Branch name pattern: main
   ✅ Require pull request reviews before merging
   ✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   ```
4. Click "Create"

### Add GitHub Secrets (for Vercel Deployment)

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret"
3. Add these secrets:
   ```
   Name: SUPABASE_URL
   Value: https://your-project.supabase.co
   
   Name: SUPABASE_ANON_KEY
   Value: your-anon-key-here
   
   Name: DATABASE_URL
   Value: postgresql://...
   ```

---

## 🚀 Optional: Add GitHub Actions CI/CD

### Create Workflow File

Create `.github/workflows/test.yml`:

```yaml
name: Test & Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint code
        run: npm run lint
      
      - name: Build project
        run: npm run build
      
      - name: Run tests (if available)
        run: npm test || true
```

This automatically:
- ✅ Tests code on every push
- ✅ Prevents broken code from being merged
- ✅ Shows build status in pull requests

---

## 📋 Repository Checklist

Before pushing to production, verify:

- [ ] GitHub repository created
- [ ] Local repo connected to GitHub (git remote -v)
- [ ] All files pushed to GitHub
- [ ] `.env.local` NOT in repository
- [ ] `.gitignore` has important files excluded
- [ ] README.md shows on repository page
- [ ] Branch protection rules set (optional but recommended)

---

## 🔗 Useful GitHub URLs

```
Repository:        https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE
Issues:            https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE/issues
Pull Requests:     https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE/pulls
Actions:           https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE/actions
Settings:          https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE/settings
```

---

## 🆘 Troubleshooting

### "fatal: remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/HRMS-PLUS-ATTENDANCE.git
git push -u origin main
```

### "permission denied (publickey)"

```bash
# Generate SSH key (alternative to HTTPS)
ssh-keygen -t ed25519 -C "your@email.com"
cat ~/.ssh/id_ed25519.pub  # Copy output

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Then use SSH URL instead of HTTPS:
git remote set-url origin git@github.com:YOUR-USERNAME/HRMS-PLUS-ATTENDANCE.git
```

### "everything up-to-date" but files not showing on GitHub

```bash
git status
# If nothing shows, all is committed and pushed

# Verify:
git log --oneline
# Should show your commits
```

---

## 🎯 Next Steps After GitHub

1. **Deploy to Vercel** (see PRODUCTION_DEPLOYMENT_CHECKLIST.md)
2. **Setup branch protection** (optional but recommended)
3. **Add team members** as collaborators
4. **Create issues** for feature requests
5. **Setup GitHub Projects** for tracking work

---

## 📖 GitHub Docs

- [GitHub Guides](https://guides.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Actions](https://github.com/features/actions)
- [GitHub Help](https://docs.github.com)

---

**Status**: ✅ Ready for GitHub
**Next**: Deploy to Vercel
**Estimated Time**: 5 minutes to push to GitHub

Last updated: May 9, 2026
