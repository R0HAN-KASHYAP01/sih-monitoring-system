# Project Setup Guide
## SIH 26095 — AI-Driven Continuous Monitoring & Surprise Inspection System

This guide covers everything needed to clone this repo and run it on a new computer. Follow it top to bottom the first time; after that you'll only need the "Running the App" section.

---

## 1. Prerequisites (Install These First)

| Tool | Version | Why | Check with |
|---|---|---|---|
| **Node.js** | 18.x or later (LTS recommended) | Runs the Next.js web app | `node -v` |
| **npm** | comes with Node.js | Package manager | `npm -v` |
| **Git** | any recent version | Version control | `git --version` |
| **A code editor** | VS Code recommended | — | — |
| **A Supabase account** | free tier is fine | Database, Auth, Storage, Realtime | [supabase.com](https://supabase.com) |

> **Not needed yet** (only required once we build those pieces): Python 3.11+ (for the AI risk-scoring service), Expo CLI / Android Studio / Xcode (for the mobile app). This guide will be updated with their setup steps when those slices start.

---

## 2. Clone the Repo

```bash
git clone <your-repo-url>
cd sih-monitoring-system
```

---

## 3. Set Up Your Own Supabase Project

Each developer should use the **same shared Supabase project** for this hackathon (not a personal one) so everyone sees the same data. Get the project credentials from whoever created it:

1. Go to the shared Supabase project dashboard.
2. Go to **Project Settings → API**. You'll need:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this one secret — never commit it, never put it in client-side code)

If you're the one *creating* the Supabase project for the team:
1. Go to [supabase.com](https://supabase.com) → **New Project** → name it, set a DB password, pick a region → **Create**.
2. Once ready, open the **SQL Editor** and run every file inside `supabase/migrations/` **in filename order** (they're numbered for this reason).
3. Also run everything in `supabase/policies.sql` (RLS policies).
4. Share the Project URL + anon key with the team (service role key only with people who need to run server-side code).

---

## 4. Install Dependencies — Web App

```bash
cd apps/web
npm install
```

This installs everything listed in `apps/web/package.json`, including:
- `next` — the framework
- `react`, `react-dom`
- `@supabase/supabase-js` — Supabase client (used for Auth, database reads/writes, and later Realtime)
- `tailwindcss` and related dev dependencies — styling

No other manual installs are needed for the web app — everything else is pulled in by `npm install`.

---

## 5. Environment Variables — Web App

Create a file at `apps/web/.env.local` (this file is git-ignored — never commit it):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these three values from Supabase → **Project Settings → API** (see Section 3).

> `NEXT_PUBLIC_` prefixed variables are exposed to the browser — only the URL and anon key should ever have that prefix. The service role key must **never** have `NEXT_PUBLIC_` in front of it, or it becomes visible to anyone using the site.

---

## 6. Running the App

From `apps/web`:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Visit `/signup` to create a test account (pick a role from the dropdown — this dropdown is temporary, for demo/testing purposes only, see note in `docs/PROGRESS.md`).
- Visit `/login` to sign in — you'll be redirected to the correct dashboard based on your account's role.

---

## 7. Project Structure (Quick Reference)

```
sih-monitoring-system/
├── apps/
│   ├── web/            # Next.js app — Government + NGO/Institute + Beneficiary portals (active)
│   ├── mobile/          # React Native (Expo) — Inspector App (not started yet)
│   └── ai-service/       # Python FastAPI — Risk Engine (not started yet, built separately per team decision)
├── supabase/
│   ├── migrations/       # Run these in order in the Supabase SQL Editor
│   └── policies.sql      # Row-level security policies
├── packages/
│   └── shared/            # Shared constants between web + mobile (not populated yet)
└── docs/
    ├── PRD.md
    ├── MVP.md
    ├── Tech_Stack.md
    ├── Team_Workflow_Plan.md
    ├── Database_Schema.md
    ├── File_Structure.md
    ├── SETUP.md            # this file
    └── PROGRESS.md          # what's been built so far
```

See `docs/File_Structure.md` for the full planned layout, and `docs/Database_Schema.md` for the full table reference.

---

## 8. Common Setup Issues

| Problem | Likely Cause | Fix |
|---|---|---|
| "Failed to fetch" on login/signup | Wrong Supabase URL in `.env.local` | Make sure it's `https://xxxx.supabase.co`, **not** the `supabase.com/dashboard/...` URL from your browser tab |
| "new row violates row-level security policy" | Missing RLS policy, or trying to read a row back before you're allowed to | Check `supabase/policies.sql` was run in full; see `docs/PROGRESS.md` for known gotchas already solved |
| Env changes not taking effect | Next.js only reads `.env.local` on server start | Stop the dev server (Ctrl+C) and run `npm run dev` again |
| 422 error on signup | Email already registered | Use a different test email, or delete the old user in Supabase → Authentication → Users |

---

## 9. What's Next

Once the AI service and mobile app are started, this file will get two new sections: **"Install Dependencies — AI Service"** (Python/FastAPI setup) and **"Install Dependencies — Mobile App"** (Expo setup). For now, only the web app is runnable.
