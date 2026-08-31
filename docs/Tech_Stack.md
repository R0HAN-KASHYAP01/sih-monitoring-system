# Tech Stack Document (v2 — Vibe-Coding Optimized)
## SIH 26095 — AI-Driven Continuous Monitoring & Surprise Inspection System

**Version:** 2.0
**Status:** Draft
**Based on:** PRD v1.0 + MVP v1.0
**Context:** Team is building primarily via AI-assisted ("vibe coded") development, not deep manual mastery of any one framework. Team is also organizing work **vertically by feature/loop-stage**, not horizontally by module — so this stack is chosen to minimize per-slice complexity and cross-layer friction, not to optimize any single layer in isolation.

---

## 1. Why This Stack (Vibe-Coding Lens)

Two extra constraints beyond the original PRD/MVP drove this version:

1. **No one has deep mastery of any framework** — code will mostly be AI-generated and lightly steered/debugged by the team. This means: pick tools with the most AI training data, the fewest manual config steps, and the smallest number of languages total.
2. **Work is sliced vertically (feature-by-feature across the whole loop)**, not horizontally (one person = AI, one = backend, etc.) — see the accompanying `Team_Workflow_Plan.md`. This means every teammate touches every layer at some point, so the stack needs to be learnable/promptable by non-specialists, not just deep for a specialist.

Net effect: **one language (JavaScript) end-to-end wherever possible**, and every layer chosen for how well an AI assistant can generate, explain, and fix it — not for raw technical elegance.

---

## 2. Stack-to-Module Mapping

| PRD Module | Component | Chosen Stack | Why it's vibe-coding-friendly |
|---|---|---|---|
| M1 — Backend | Data model, workflow, APIs | **Supabase** (Postgres + auto REST) + **Next.js API routes** | Supabase auto-generates most CRUD APIs — less code to prompt/debug at all |
| M2 — AI / Risk Engine | Anomaly detection, risk scoring | **Python (FastAPI)**, rule-based for MVP | Simple, well-documented, isolated — one small service, easy for AI to generate and for you to test in isolation |
| M3 — Mobile (InspectorApp) | Field inspection app | **React Native + Expo** | Expo removes native build/config steps that are hardest for AI-generated code to get right |
| M4 — Web (Official Dashboard) | Dashboard, alerts, actions | **Next.js (JavaScript) + React** | Most heavily-represented framework in AI training data; opinionated structure = more consistent AI output |
| M5 — Realtime | CCTV status signal, live dashboard updates | **Supabase Realtime** | No custom WebSocket server to write/debug |
| M6 — Security / DevOps | Auth, encryption, deployment | **Supabase Auth** + **Vercel** / **Render** | Managed services — almost nothing to hand-configure or hand-debug |

---

## 3. Detailed Stack by Layer

### 3.1 Web Dashboard (M4)
| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js (JavaScript)**, App Router | Highest AI fluency of any React framework; file-based routing means less structural decision-making per feature slice |
| UI library | **React** (function components + hooks) | — |
| Styling | **Tailwind CSS** | AI tools are very reliable at generating Tailwind; avoids needing a custom design system |
| Charting | **Recharts** | Simple declarative API, easy for AI to wire to Supabase data |
| Data fetching | `@supabase/supabase-js` client, with Realtime subscriptions | Same client library used later in the mobile app — one pattern to learn, not two |
| Auth | **Supabase Auth** | Role claims: Official, Admin, NGO Admin |
| Hosting | **Vercel** | `git push` → live URL; nothing to configure manually |

### 3.2 Backend / Central Data Platform (M1)
| Concern | Choice | Notes |
|---|---|---|
| Database | **Supabase (Postgres)** | Tables: Organization, Institute, Inspector, Inspection, Evidence, RiskScore, Action |
| API layer | Supabase auto REST for CRUD; **Next.js API routes** only for custom logic (e.g., "Initiate Inspection" → assignment engine) | Minimizes hand-written backend code |
| Row-level security | **Supabase RLS policies** | Enforces role separation at the DB level — no custom auth middleware to write |
| Audit logging | Postgres trigger → `audit_log` table | DB-level, no custom logging code |
| Manual data ingestion (attendance/reports/CCTV flag) | Simple form/CSV upload → Next.js API route → Supabase insert | Matches MVP's "manual upload/CSV or form entry" scope exactly |

### 3.3 AI / Risk Engine (M2)
| Concern | Choice | Notes |
|---|---|---|
| Service | **Python + FastAPI**, rule-based scoring | Isolated microservice — one clear input/output contract (`POST /score` → `{score, band, reasons}`), easy to prompt and test independently of the rest of the app |
| Text similarity check | `difflib` (built-in) or `scikit-learn` TF-IDF cosine similarity | Small, well-known snippets — very reliable for AI to generate correctly |
| Trigger | Called via HTTP from a Next.js API route or Supabase Edge Function whenever new data lands | Keeps the risk engine stateless and swappable |
| Hosting | **Render** or **Railway** | One-click deploy for a small always-on Python service |

### 3.4 Mobile / Inspector App (M3)
| Concern | Choice | Notes |
|---|---|---|
| Framework | **React Native + Expo** | No Xcode/Android Studio setup required to run/test; Expo Go app lets any teammate preview a build instantly on their own phone |
| Navigation | **Expo Router** | File-based, mirrors Next.js routing mental model |
| GPS | **expo-location** | Simple function call for the 100m radius hard-gate |
| Camera / evidence | **expo-camera** / **expo-image-picker** | Photo + note capture; GPS/timestamp/inspector ID/inspection ID tagging done in JS at capture time |
| Offline storage & sync | **expo-sqlite** | Local save → "Pending Sync" → auto-upload on reconnect; simplest offline option that still satisfies the MVP's core differentiator |
| Push notifications | **Expo Notifications** | Assignment alerts; in-app list is an acceptable MVP fallback if push setup eats time |
| Auth | **Supabase Auth** (same client library as web) | One auth pattern across web + mobile |

### 3.5 Storage
| Concern | Choice | Notes |
|---|---|---|
| Evidence files | **Supabase Storage** | S3-compatible, encrypted at rest, signed URLs for the dashboard evidence viewer |
| Checksums | Basic SHA-256 on upload | Stands in for full tamper-evidence hashing (explicitly Phase 2+ per MVP) |

### 3.6 Realtime (M5)
| Concern | Choice | Notes |
|---|---|---|
| Dashboard live updates | **Supabase Realtime** | Risk score changes push to the dashboard without a custom WebSocket server |
| CCTV status signal | A single online/offline flag row, updated via API/webhook | No live video pipeline — matches MVP scope exactly |
| Live video / Random VC | **Deferred to Phase 2+** | Explicitly out of MVP scope |

### 3.7 Security / DevOps (M6)
| Concern | Choice | Notes |
|---|---|---|
| Auth & roles | **Supabase Auth** + `role` claim (Official / Inspector / Admin / NGO Admin) | RLS policies do the enforcement — nothing custom to maintain |
| Transport security | HTTPS by default (Vercel/Render/Supabase) | No manual TLS config |
| Encryption at rest | Supabase-managed | No manual config |
| Deployment | **Vercel** (web) · **Render/Railway** (AI service) · **Supabase Cloud** (DB/Auth/Storage/Realtime) · **Expo EAS** (mobile builds) | Every piece is a managed service with a simple deploy flow — matches a team that isn't managing its own infra |

---

## 4. Summary Table (Quick Reference)

| Layer | Technology |
|---|---|
| Web Dashboard | Next.js (JavaScript) + React + Tailwind CSS |
| Mobile App | React Native + Expo |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT + roles) |
| Evidence Storage | Supabase Storage |
| Realtime Updates | Supabase Realtime |
| AI / Risk Engine | Python + FastAPI (rule-based for MVP) |
| Hosting — Web | Vercel |
| Hosting — AI Service | Render / Railway |
| Hosting — Mobile | Expo EAS Build |
| Offline Mobile Storage | expo-sqlite |

---

## 5. One Rule That Protects This Whole Stack

**Lock the Supabase schema before any vertical slice starts.** Every layer above (web, mobile, AI engine) reads and writes the same tables. If the schema shifts mid-slice, every feature breaks at once, and vibe-coded fixes tend to patch symptoms rather than the root cause. Assign one person as schema owner for the duration of the build — see `Team_Workflow_Plan.md`.
