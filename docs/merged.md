## Merged Files List
- 1. MVP.md (8.6 KB)
- 2. Team_Workflow_Plan.md (7.2 KB)
- 3. Tech_Stack.md (8.2 KB)
- 4. Database_Schema.md (14.9 KB)
- 5. File_Structure.md (15 KB)
- 6. SETUP.md (5.7 KB)


## 1. MVP.md

```md
# MVP Definition
## SIH 26095 — AI-Driven Continuous Monitoring & Surprise Inspection System

**Version:** 1.0
**Status:** Draft
**Purpose:** Define the smallest end-to-end slice of the full PRD that still demonstrates the complete loop — *Monitor → Detect → Score → Assign → Inspect → Verify → Act* — convincingly for a hackathon demo / first real pilot.

---

## 1. MVP Principle

The MVP must prove the **entire loop closes**, even if each stage is simplified. A judge or pilot stakeholder should be able to watch:

> A risk score rise on the dashboard → an inspector get auto-assigned → a real GPS-verified field inspection happen on a phone → evidence come back → the risk score update → an official take action.

Depth within any single stage matters far less than the loop being unbroken end-to-end.

## 2. MVP Scope by Module

### M1 — Backend (MVP)
**In:**
- Organization/institute registration (single-step form + manual admin approval — no document workflow engine needed yet).
- Simple data model: Organization, Institute, Inspector, Inspection, Evidence, RiskScore, Action.
- REST APIs to ingest: attendance (manual upload/CSV or form entry), reports (text upload), CCTV status (simple online/offline flag), complaints (simple form).
- Central store joining all of the above per institute.

**Out (Phase 2+):**
- Multi-step document verification workflow.
- Complex scheme/beneficiary master data management.
- Full audit-log UI (basic DB-level logging is enough for MVP).

### M2 — AI / Risk Engine (MVP)
**In:**
- Rule-based (not ML) anomaly detection to start:
  - Attendance anomaly: simple statistical deviation from a stored historical average.
  - CCTV irregularity: binary offline/online + hours-active threshold.
  - Report similarity: basic text-similarity check (e.g., cosine similarity / diff ratio) between current and previous report.
- Weighted risk score formula exactly as specified in the PRD (0–100, configurable weights).
- Risk banding (LOW/MEDIUM/HIGH/CRITICAL).
- Re-analysis trigger: recompute score once inspection report is submitted, using observed vs. reported values.

**Out (Phase 2+):**
- Machine-learned anomaly models trained on historical data.
- NLP-based deep report content analysis.
- Predictive risk forecasting.

### M3 — Mobile / Inspector App (MVP)
**In:**
- Login for inspector (simple auth).
- Assignment notification (can be push notification or in-app list for MVP demo).
- Static or basic map view of institute location + distance shown.
- GPS check against a fixed allowed radius (e.g., 100 m) — hard gate before inspection starts.
- Digital checklist (fixed set of ~8 yes/no + notes fields as listed in PRD).
- Evidence capture: photo + note minimum (video/document optional stretch).
- Each evidence item tagged with GPS + timestamp + inspector ID + inspection ID (hash generation can be a stretch goal).
- Basic offline mode: local save + "Pending Sync" + auto-upload on reconnect (this is a core differentiator — keep it in MVP even if simplified).
- Report submission.

**Out (Phase 2+):**
- Full conflict-of-interest history across all past assignments.
- Rich media (multi-video, large document sets).
- Cryptographic file hashing / advanced tamper-evidence (can fake with checksum for demo).

### M4 — Web / Official Dashboard (MVP)
**In:**
- List/grid of registered institutes with current risk score and band.
- Alert view for HIGH/CRITICAL institutes with reason list.
- "Initiate Inspection" button → triggers assignment engine.
- Assignment result view (which inspector, distance, why chosen).
- Evidence viewer for a completed inspection (photos + report fields).
- Simple action buttons: Corrective Action / Close Case / Re-inspection (minimum 3 actions).

**Out (Phase 2+):**
- Full compliance workflow with NGO response portal.
- Random VC feature.
- Advanced analytics/reporting exports.

### M5 — Realtime (MVP)
**In:**
- CCTV represented as a simple online/offline status signal feeding the risk engine (no need for live video streaming in MVP).

**Out (Phase 2+):**
- Full RTSP/ONVIF → WebRTC/HLS live streaming pipeline.
- Random Video Conference (WebRTC) feature — nice demo add-on if time allows, not required for loop to close.

### M6 — Security/DevOps (MVP)
**In:**
- Basic auth + role separation (Official, Inspector, Admin).
- HTTPS everywhere; encrypted storage for evidence files.
- Deployed demo environment (single cloud instance is fine).

**Out (Phase 2+):**
- Full CI/CD security scanning pipeline.
- Advanced anti-gaming safeguards on randomization/assignment logic.

## 3. MVP Assignment Engine (Simplified)

Full engine factors (PRD Stage 7) reduced to a demo-friendly subset:

1. Filter inspectors by availability.
2. Rank by distance to institute.
3. Exclude any inspector with a prior assignment to this same institute (basic conflict-of-interest check).
4. Apply a random tie-break among the top 2–3 candidates.

This keeps the "can't be predicted/gamed" property intact without needing full workload-balancing logic.

## 4. MVP User Stories

1. *As an Admin*, I can register a new institute so it starts being monitored.
2. *As the system*, I can ingest attendance/report/CCTV-status data and compute a live risk score per institute.
3. *As an Official*, I can see a dashboard of institutes ranked by risk, with reasons for high scores.
4. *As an Official*, I can click "Initiate Inspection" on a high-risk institute.
5. *As the system*, I can assign an available, conflict-free inspector, with a randomized tie-break.
6. *As an Inspector*, I receive the assignment, navigate to the location, and must be GPS-verified within radius before I can start.
7. *As an Inspector*, I complete a checklist, capture photo evidence with GPS/timestamp, and submit — even with no internet, syncing later.
8. *As the system*, I recompute risk using the inspection's observed data and update the dashboard.
9. *As an Official*, I review the evidence and take an action (corrective action / close case / re-inspect).

## 5. MVP Demo Script (End-to-End)

1. Show dashboard: ABC Institute at risk 42 (Normal).
2. Trigger/simulate attendance anomaly upload → risk recalculates upward, reason shown.
3. Simulate CCTV going offline → risk crosses HIGH threshold, alert appears.
4. Official clicks "Initiate Inspection."
5. System assigns Inspector B (nearest, no conflict, randomized tie-break shown).
6. Switch to mobile app: inspector receives assignment, "arrives" (GPS mock/actual), verified within radius.
7. Inspector completes checklist, snaps a photo, submits report with observed beneficiary count lower than reported.
8. Dashboard updates: risk jumps to CRITICAL, evidence and discrepancy visible.
9. Official clicks "Corrective Action" → case marked for follow-up.
10. Loop visually returns to "Continue Monitoring."

## 6. Suggested Tech Stack (Lightweight, for MVP speed)

| Layer | Suggestion |
|---|---|
| Backend | Node.js/Express or Python/FastAPI + PostgreSQL |
| AI/Risk Engine | Python service (rule-based scoring first; scikit-learn optional stretch) |
| Mobile | Flutter or React Native (cross-platform, offline storage via local DB e.g. SQLite/Hive) |
| Web Dashboard | React + a charting library for risk visualization |
| Realtime (stretch) | WebRTC via a managed SFU (e.g., LiveKit) if VC/CCTV streaming is attempted |
| Storage | Cloud object storage (S3-compatible) for evidence files |
| Auth | JWT-based auth with role claims |
| Hosting | Single cloud VM or container platform (e.g., Render/Railway/AWS) for demo |

## 7. Milestones (Indicative, Hackathon Timeline)

| Phase | Deliverable |
|---|---|
| Day 1 | Data model + registration + manual data ingestion APIs |
| Day 2 | Risk scoring engine + dashboard risk view |
| Day 3 | Assignment engine + inspector mobile app (checklist + GPS + evidence capture) |
| Day 4 | Offline sync + AI re-analysis after inspection |
| Day 5 | Official action panel + end-to-end demo run-through + polish |

## 8. Explicitly Deferred to Post-MVP

- Live CCTV video streaming and Random Video Conference feature.
- Full document-verification registration workflow.
- Machine-learned (vs. rule-based) anomaly detection.
- Full compliance lifecycle with NGO self-service response portal.
- Cryptographic evidence hashing / advanced tamper-evidence.
- Fine-grained workload balancing in the assignment engine.
- National-scale multi-vendor CCTV integration.

## 9. MVP Success Criteria

The MVP is considered successful if a single unbroken run of the loop (registration → anomaly → risk score → assignment → GPS-verified inspection → evidence → updated risk → official action) can be demonstrated live, including at least one offline-then-synced inspection to prove the field-usability differentiator.
```

## 2. Team_Workflow_Plan.md

```md
# Team Workflow Plan
## SIH 26095 — AI-Driven Continuous Monitoring & Surprise Inspection System

**Version:** 1.0
**Status:** Draft
**Approach:** Vertical feature slicing (whole team works together through each loop-stage), not horizontal module ownership (one person = AI, one = backend, etc.)

---

## 1. Why Vertical, Not Horizontal

Horizontal splitting (one person owns AI, one owns backend, one owns mobile...) assumes each person can independently debug and extend their own layer. That assumption breaks down when the team is mostly **vibe coding** — if the "mobile person" gets stuck, nobody else can jump in, because the work was never shared.

Vertical slicing means the **whole team builds one thin end-to-end feature at a time**, all layers included, before moving to the next. This has three advantages for this project specifically:

- It matches how the MVP is actually judged: **"depth within any single stage matters far less than the loop being unbroken end-to-end"** (MVP.md, Section 1).
- Non-coders on the team are still useful every day — they write the plain-English spec for the slice, test the result, and write that slice's demo line, while whoever is driving translates it into prompts.
- If someone gets stuck, the whole team is looking at the same feature and can jump in — no one is isolated in a layer nobody else understands.

---

## 2. Non-Negotiable First Step: Lock the Schema

Before slice 1 begins, **one person is designated Schema Owner** and defines the Supabase tables for the whole MVP in one sitting:

`Organization`, `Institute`, `Inspector`, `Inspection`, `Evidence`, `RiskScore`, `Action`

Every vertical slice reads/writes these tables. If the schema shifts mid-slice, every feature built so far breaks at once — this is the one thing done horizontally, and done first, before any feature work starts.

---

## 3. The Six Vertical Slices

These map directly onto the MVP's own demo script and 5-day milestone table — each slice is a "day," but treat the days as sequence, not strict 24-hour boxes.

### Slice 1 — Registration + Dashboard Shell
**What ships:** An institute can be registered (simple form), and shows up on a dashboard list with a placeholder risk number/band.
**Touches:** Supabase table inserts, Next.js registration page, Next.js dashboard list page, basic Tailwind styling.
**Done when:** You can add an institute through the UI and see it appear on the dashboard.

### Slice 2 — Anomaly → Risk Score → Alert
**What ships:** Uploading attendance/report/CCTV-status data triggers the risk engine, updates the score live on the dashboard, and HIGH/CRITICAL institutes show an alert with reasons.
**Touches:** Ingestion form/API route, Python FastAPI risk service, Supabase Realtime subscription, dashboard alert UI.
**Done when:** Simulating an attendance anomaly or CCTV going offline visibly moves an institute's score/band on the dashboard.

### Slice 3 — Initiate Inspection → Assignment
**What ships:** "Initiate Inspection" button on a high-risk institute triggers the (simplified) assignment engine — filters by availability, ranks by distance, excludes conflict-of-interest, random tie-break — and the dashboard shows who was assigned and why.
**Touches:** Next.js API route (assignment logic), Supabase writes (Assignment/Inspection record), dashboard assignment-result view.
**Done when:** Clicking the button produces a specific inspector, visibly chosen for a specific reason.

### Slice 4 — Mobile: Login → Assignment → GPS Gate
**What ships:** Inspector logs into the mobile app, sees their assignment, and is GPS-gated — cannot start the inspection unless within the allowed radius of the institute.
**Touches:** React Native/Expo app, Supabase Auth, expo-location.
**Done when:** The app blocks inspection start outside the radius and unlocks it inside — testable by walking around or mocking GPS.

### Slice 5 — Mobile: Checklist → Evidence → Offline Sync
**What ships:** Inspector completes the fixed checklist, captures a photo tagged with GPS/timestamp/IDs, and can submit even with no connectivity — saved locally as "Pending Sync," auto-uploaded on reconnect.
**Touches:** Expo checklist form, expo-camera, expo-sqlite, Supabase Storage upload on reconnect.
**Done when:** You can turn off WiFi, submit an inspection, turn WiFi back on, and watch it sync.

### Slice 6 — Re-analysis → Evidence Viewer → Official Action
**What ships:** Submitting a report triggers the risk engine to re-score using observed vs. reported data; the dashboard's evidence viewer shows the photos and discrepancy; the official can click Corrective Action / Close Case / Re-inspection.
**Touches:** Risk engine re-analysis call, dashboard evidence viewer UI, action buttons writing to the `Action` table.
**Done when:** A discrepancy (e.g., lower observed beneficiary count) visibly pushes the score to CRITICAL, and clicking an action button updates the case status.

---

## 4. How to Run Each Slice Day-to-Day

1. **Spec it in plain English first.** Before any prompting starts, the team (including non-coders) agrees on: what does the user see, what does success look like, what's the simplest version that still counts. Write this as 3–5 bullet points — this becomes the slice's acceptance test.
2. **Rotate who drives.** One person prompts the AI tool and applies changes; everyone else watches the same screen, calls out issues, and cross-checks against the spec. Rotate the driver role each slice so knowledge doesn't concentrate in one person.
3. **One branch per slice.** Merge into `main` only when the slice's mini end-to-end test passes — this avoids six people's AI-generated changes colliding in the same files at once.
4. **Test the slice like a mini demo before moving on.** Literally run through it as if a judge were watching. If it breaks, fix it before starting the next slice — don't stack unfinished slices.
5. **Write the demo-script line for that slice immediately**, while it's fresh — by the end of Slice 6 you'll already have a full first draft of your final demo script (see MVP.md Section 5 for the reference structure).

---

## 5. Suggested Sequencing Against a 5-Day Timeline

| Day | Slice(s) | Note |
|---|---|---|
| Day 0 (before Day 1) | Schema lock | Not a full day — a focused session before Slice 1 starts |
| Day 1 | Slice 1 | Registration + dashboard shell |
| Day 2 | Slice 2 | Anomaly → risk → alert |
| Day 3 | Slice 3 + start Slice 4 | Assignment engine; begin mobile login/GPS |
| Day 4 | Finish Slice 4 + Slice 5 | GPS gate; checklist, evidence, offline sync |
| Day 5 | Slice 6 + full run-through + polish | Re-analysis, action panel, then rehearse the whole loop end-to-end |

This is the same total scope as the original MVP milestone table — it's just organized as shared feature slices instead of parallel module tracks.

---

## 6. What This Plan Deliberately Avoids

- **No "AI person" / "backend person" / "mobile person" split** — every slice touches whatever layers it needs, together.
- **No slice starts before the previous one's mini-demo works.** Half-finished slices compound into a broken final loop, which is the one thing the MVP is graded on.
- **No schema changes after Day 0** without the whole team stopping to re-sync — this is the single biggest risk to a vertically-sliced, vibe-coded build.
```

## 3. Tech_Stack.md

```md
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
```

## 4. Database_Schema.md

```md
# Database Schema
## SIH 26095 — AI-Driven Continuous Monitoring & Surprise Inspection System

**Version:** 1.0
**Status:** Draft
**Database:** Supabase (PostgreSQL)
**Based on:** PRD v1.0, MVP v1.0, Tech Stack v2.0, and the full sitemap/flow diagram (Government Web, NGO/Institute Web, Inspector Mobile App, Beneficiary App/Web, Random Assignment Flow, Inspector Detailed Flow, Offline Flow, Checklist Flow)

> Tables are tagged **[MVP]** or **[Phase 2+]** so the schema owner can create the MVP tables first without blocking on features the MVP explicitly defers (VC, full compliance lifecycle, etc.). All tables use `uuid` primary keys (`default gen_random_uuid()`) and `created_at timestamptz default now()` unless noted.

---

## 1. Entity Overview

```
organizations ──< institutes ──< attendance
                       │       ──< cctv_cameras ──< cctv_status_log
                       │       ──< reports
                       │       ──< complaints
                       │       ──< risk_scores
                       │       ──< inspections ──< inspection_checklist_items
                       │                        ──< evidence
                       │       ──< actions ──< compliance_responses
                       │       ──< vc_sessions
users ──< inspectors
      ──< notifications
      ──< audit_logs (actor)
schemes ──< institutes
```

---

## 2. Core Tables

### 2.1 `users` **[MVP]**
Backs Supabase Auth; extends `auth.users` with app-specific fields.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | matches `auth.users.id` |
| `role` | text | `government`, `pmu`, `inspector`, `ngo_admin`, `institute_admin`, `beneficiary`, `system_admin` |
| `full_name` | text | |
| `email` | text | |
| `phone` | text | used for OTP/MFA login on mobile + beneficiary app |
| `organization_id` | uuid, FK → `organizations.id`, nullable | null for government/system users |
| `is_active` | boolean, default `true` | |
| `created_at` | timestamptz | |

RLS: users can read their own row; `government`/`system_admin` can read all.

### 2.2 `organizations` **[MVP]**
Represents government bodies, NGOs, or institute-owning entities (Users → Government Users / NGOs / Institutes tree in the sitemap).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | text | |
| `type` | text | `government`, `ngo`, `institute_owner` |
| `parent_organization_id` | uuid, FK → self, nullable | e.g., institute under an NGO |
| `registration_status` | text | `pending`, `approved`, `rejected` — MVP: single-step + manual admin approval |
| `approved_by` | uuid, FK → `users.id`, nullable | |
| `created_at` | timestamptz | |

### 2.3 `schemes` **[MVP]**
Government schemes/projects an institute is registered under (referenced in "Select Scheme" step of the Random Assignment Flow).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | text | |
| `description` | text | |
| `department` | text | e.g., DoSJE | |

### 2.4 `institutes` **[MVP]**
The core monitored entity.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `organization_id` | uuid, FK → `organizations.id` | owning NGO/institute org |
| `scheme_id` | uuid, FK → `schemes.id` | |
| `name` | text | |
| `region` | text | used in "Select Region" step of assignment flow |
| `state` | text | supports Government Web "State View" |
| `district` | text | supports "District View" |
| `latitude` | numeric | for map view + GPS radius check |
| `longitude` | numeric | |
| `status` | text | `active`, `flagged`, `under_inspection`, `closed` |
| `created_at` | timestamptz | |

### 2.5 `inspectors` **[MVP]**
Extends `users` (role = `inspector`) with fields the assignment engine needs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id` | |
| `home_region` | text | for distance ranking |
| `specialization` | text, nullable | e.g., education, health — Phase 2+ if not needed for MVP demo |
| `availability_status` | text | `available`, `busy`, `off_duty` |
| `current_workload` | int, default `0` | open inspections assigned |
| `created_at` | timestamptz | |

---

## 3. Monitoring Signal Tables

### 3.1 `attendance` **[MVP]**
Matches Government/NGO Web "Attendance → Daily Attendance / History / Analytics."

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `institute_id` | uuid, FK → `institutes.id` | |
| `date` | date | |
| `reported_count` | int | as submitted by institute |
| `historical_average` | numeric | rolling baseline used by risk engine |
| `source` | text | `manual_upload`, `csv`, `form` |
| `submitted_by` | uuid, FK → `users.id` | |
| `created_at` | timestamptz | |

### 3.2 `cctv_cameras` **[MVP]**
Matches "CCTV → Cameras / Add Camera."

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `institute_id` | uuid, FK → `institutes.id` | |
| `label` | text | e.g., "Main Hall Camera" |
| `installed_at` | timestamptz | |

### 3.3 `cctv_status_log` **[MVP]**
Matches "Camera Status / Camera Health / CCTV Events." MVP simplifies to a status flag, no live video.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `camera_id` | uuid, FK → `cctv_cameras.id` | |
| `status` | text | `online`, `offline` |
| `active_hours_today` | numeric | used for the "16hrs → 2hrs" anomaly rule |
| `checked_at` | timestamptz | |

### 3.4 `reports` **[MVP]**
Matches "Reports" page — project reports used for the text-similarity anomaly check.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `institute_id` | uuid, FK → `institutes.id` | |
| `submitted_by` | uuid, FK → `users.id` | |
| `content_text` | text | |
| `similarity_score` | numeric, nullable | computed vs. previous report by AI service |
| `created_at` | timestamptz | |

### 3.5 `complaints` **[MVP]**
Matches Government "Complaint Dashboard / Details / Resolution Tracking" and Beneficiary App "Complaint."

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `institute_id` | uuid, FK → `institutes.id` | |
| `submitted_by` | uuid, FK → `users.id`, nullable | nullable to allow anonymous complaints |
| `description` | text | |
| `status` | text | `open`, `under_review`, `resolved` |
| `created_at` | timestamptz | |

### 3.6 `beneficiary_feedback` **[Phase 2+]**
Matches Beneficiary App "Feedback / Survey." Not required for the MVP loop but schema reserved.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `institute_id` | uuid, FK → `institutes.id` | |
| `beneficiary_id` | uuid, FK → `users.id` | |
| `type` | text | `feedback`, `survey` |
| `content` | jsonb | |
| `created_at` | timestamptz | |

---

## 4. Risk Engine Tables

### 4.1 `risk_scores` **[MVP]**
One row per computed score (append-only, so the dashboard can show trend history — "Risk Dashboard," "Anomaly Alerts").

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `institute_id` | uuid, FK → `institutes.id` | |
| `score` | int | 0–100 |
| `band` | text | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `reasons` | jsonb | e.g., `[{"signal":"attendance_anomaly","weight":25}, ...]` — drives the alert reason list |
| `trigger_source` | text | `ingestion`, `re_analysis_post_inspection` |
| `computed_at` | timestamptz | |

> `institutes.status` and dashboard views read the **latest** `risk_scores` row per institute (`select distinct on (institute_id) ...`).

---

## 5. Inspection Lifecycle Tables

### 5.1 `inspections` **[MVP]**
Central record for the whole assignment → GPS → checklist → evidence → submit flow.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `institute_id` | uuid, FK → `institutes.id` | |
| `inspector_id` | uuid, FK → `inspectors.id` | |
| `type` | text | `surprise`, `scheduled` |
| `status` | text | `assigned`, `en_route`, `gps_verified`, `in_progress`, `submitted`, `pending_sync`, `synced`, `closed` |
| `assigned_at` | timestamptz | |
| `assignment_reason` | jsonb | distance, availability, tie-break details — for "Assignment result view (why chosen)" |
| `gps_verified` | boolean, default `false` | hard gate before checklist starts |
| `arrival_latitude` | numeric, nullable | |
| `arrival_longitude` | numeric, nullable | |
| `distance_from_institute_m` | numeric, nullable | must be within allowed radius (e.g. 100m) |
| `submitted_at` | timestamptz, nullable | |
| `synced_at` | timestamptz, nullable | when offline-queued evidence/report finished uploading |

### 5.2 `inspection_checklist_items` **[MVP]**
Matches the Inspection Checklist Flow categories: Infrastructure, Staff, Beneficiaries, Attendance, Documents, CCTV, Scheme Compliance.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `inspection_id` | uuid, FK → `inspections.id` | |
| `category` | text | `infrastructure`, `staff`, `beneficiaries`, `attendance`, `documents`, `cctv`, `scheme_compliance` |
| `question` | text | fixed checklist question text |
| `answer` | text | `yes`, `no` |
| `notes` | text, nullable | free-text observation |
| `observed_value` | jsonb, nullable | e.g., `{"observed_beneficiary_count": 42}` — used by risk re-analysis |

### 5.3 `evidence` **[MVP]**
Matches "Evidence Capture: Photo / Video / Audio / Document."

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `inspection_id` | uuid, FK → `inspections.id` | |
| `inspector_id` | uuid, FK → `inspectors.id` | denormalized for quick queries |
| `type` | text | `photo`, `video`, `audio`, `document` |
| `file_url` | text | Supabase Storage path/signed URL |
| `checksum` | text | SHA-256, MVP stand-in for full tamper-evidence hashing |
| `latitude` | numeric | |
| `longitude` | numeric | |
| `captured_at` | timestamptz | device timestamp at capture |
| `sync_status` | text | `pending_sync`, `synced` — supports the Offline Flow |
| `uploaded_at` | timestamptz, nullable | |

### 5.4 `inspection_reports` **[MVP]**
The "Complete Report" + "Digital Declaration" step — a summary record separate from individual checklist items, holding the inspector's overall assessment.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `inspection_id` | uuid, FK → `inspections.id` | |
| `overall_assessment` | text | free text |
| `declaration_confirmed` | boolean | inspector's digital declaration checkbox |
| `submitted_at` | timestamptz | |

---

## 6. Action & Compliance Tables

### 6.1 `actions` **[MVP]**
Matches "Compliance → Pending Actions / Notices / Corrective Actions / Closure" and the dashboard's action buttons.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `institute_id` | uuid, FK → `institutes.id` | |
| `inspection_id` | uuid, FK → `inspections.id`, nullable | |
| `type` | text | `corrective_action`, `close_case`, `re_inspection` (MVP minimum 3); `notice`, `escalation` (Phase 2+ full set) |
| `issued_by` | uuid, FK → `users.id` | |
| `status` | text | `open`, `awaiting_response`, `resolved`, `closed` |
| `notes` | text, nullable | |
| `created_at` | timestamptz | |

### 6.2 `compliance_responses` **[Phase 2+]**
Matches the full NGO response lifecycle (PRD Stage 16) — deferred per MVP scope, schema reserved so Phase 2 doesn't require a migration surprise.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `action_id` | uuid, FK → `actions.id` | |
| `response_text` | text | |
| `submitted_by` | uuid, FK → `users.id` | NGO admin |
| `submitted_at` | timestamptz | |
| `reviewed_by` | uuid, FK → `users.id`, nullable | |
| `outcome` | text, nullable | `satisfied`, `not_satisfied` |

---

## 7. Realtime / Supporting Tables

### 7.1 `vc_sessions` **[Phase 2+]**
Matches "Video Conferencing → Start Random VC / Select Scheme / Select Region / Random Participant / VC Room / VC History." Not required for MVP loop.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `institute_id` | uuid, FK → `institutes.id` | |
| `scheme_id` | uuid, FK → `schemes.id` | |
| `participant_user_id` | uuid, FK → `users.id` | randomly selected staff/beneficiary |
| `started_at` | timestamptz | |
| `ended_at` | timestamptz, nullable | |
| `session_log_url` | text, nullable | |
| `official_notes` | text, nullable | |

### 7.2 `notifications` **[MVP]**
Matches "Notifications" pages across all four apps.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id` | |
| `type` | text | `assignment`, `alert`, `action_required`, `sync_complete` |
| `payload` | jsonb | e.g., `{"inspection_id": "..."}` |
| `is_read` | boolean, default `false` | |
| `created_at` | timestamptz | |

### 7.3 `audit_logs` **[MVP]**
Matches "Audit Logs" — MVP keeps this DB-level only (no dedicated UI, per MVP scope), populated via Postgres triggers on key tables (`institutes`, `risk_scores`, `inspections`, `actions`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `actor_id` | uuid, FK → `users.id`, nullable | null for system-triggered events |
| `action` | text | e.g., `risk_score_updated`, `inspection_assigned`, `action_taken` |
| `entity_type` | text | table name |
| `entity_id` | uuid | |
| `before` | jsonb, nullable | |
| `after` | jsonb, nullable | |
| `created_at` | timestamptz | |

---

## 8. Row-Level Security (RLS) Summary

| Table group | Government/PMU | NGO/Institute Admin | Inspector | Beneficiary |
|---|---|---|---|---|
| `institutes`, `risk_scores`, `attendance`, `cctv_*`, `reports` | full read, write via approved workflows | read/write own institute only | read own assigned institute only (during active inspection) | no access |
| `inspections`, `evidence`, `inspection_checklist_items`, `inspection_reports` | full read | read own institute's inspections | full read/write on own assigned inspections only | no access |
| `actions`, `compliance_responses` | full read/write | read/respond to own institute's actions | no access | no access |
| `complaints`, `beneficiary_feedback` | full read | read own institute's complaints | no access | write own, read own |
| `notifications` | own only | own only | own only | own only |
| `audit_logs` | full read | no access | no access | no access |

> Enforce with Supabase policies keyed off `auth.uid()` joined through `users.organization_id` / `inspectors.user_id` / `inspections.inspector_id`.

---

## 9. Notes for the Schema Owner

- Build **Section 2–5 tables first** (users, organizations, schemes, institutes, inspectors, attendance, cctv, reports, complaints, risk_scores, inspections, checklist items, evidence, inspection_reports) — this is everything Slices 1–6 in the Team Workflow Plan touch.
- **Section 6.2 (`compliance_responses`) and Section 7.1 (`vc_sessions`)** can be created as empty tables now (so migrations don't need to run mid-Phase-2) but no UI/logic should be built against them until after the MVP loop is demoed.
- Every write to `institutes`, `risk_scores`, `inspections`, and `actions` should go through a Postgres trigger appending to `audit_logs` — set this up once, right after the core tables exist, so no slice has to remember to log manually.
```

## 5. File_Structure.md

```md
# Project File Structure
## SIH 26095 — AI-Driven Continuous Monitoring & Surprise Inspection System

**Version:** 1.0
**Status:** Draft
**Repo strategy:** Single monorepo, three deployable apps (`web`, `mobile`, `ai-service`) + shared `supabase` config + `docs`.

> One repo instead of four separate ones because your team is working **vertically by feature slice** (per `Team_Workflow_Plan.md`) — everyone touching one slice needs to see and edit web + mobile + AI code together without switching repos.

---

## 1. Top-Level Layout

```
sih-monitoring-system/
├── apps/
│   ├── web/                  # Next.js — Government + NGO/Institute + Beneficiary portals
│   ├── mobile/                # React Native (Expo) — Inspector App
│   └── ai-service/            # Python FastAPI — Risk Engine
├── supabase/
│   ├── migrations/            # SQL migration files (schema changes, versioned)
│   ├── policies.sql           # RLS policies, kept separate for readability
│   └── seed.sql                # Demo data for the hackathon run-through
├── packages/
│   └── shared/                 # Shared constants/types used by web + mobile (checklist fields, risk bands, etc.)
├── docs/
│   ├── PRD.md
│   ├── MVP.md
│   ├── Tech_Stack.md
│   ├── Team_Workflow_Plan.md
│   ├── Database_Schema.md
│   └── File_Structure.md       # this file
├── .env.example
├── package.json                 # workspace root (npm/pnpm workspaces)
└── README.md
```

---

## 2. `apps/web` — Next.js (Government + NGO/Institute + Beneficiary Portals)

One Next.js app, split into **route groups per portal**, each protected by role-based middleware reading the Supabase session. This avoids maintaining three separate web codebases while still matching the sitemap's three distinct "Applications."

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx
│   │   ├── mfa/page.jsx
│   │   └── otp/page.jsx                     # shared OTP flow (Beneficiary + others)
│   │
│   ├── (gov)/                                 # Government Web
│   │   ├── layout.jsx                         # role guard: government, pmu, system_admin
│   │   ├── dashboard/page.jsx
│   │   ├── monitoring/
│   │   │   ├── page.jsx                        # All Projects
│   │   │   ├── [instituteId]/page.jsx          # Project/Institute Details
│   │   │   ├── state-view/page.jsx
│   │   │   ├── district-view/page.jsx
│   │   │   ├── map-view/page.jsx
│   │   │   └── live-monitoring/page.jsx
│   │   ├── risk-alerts/
│   │   │   ├── page.jsx                        # Risk Dashboard
│   │   │   ├── high-risk/page.jsx
│   │   │   ├── anomaly-alerts/page.jsx
│   │   │   ├── attendance-alerts/page.jsx
│   │   │   ├── cctv-alerts/page.jsx
│   │   │   └── complaint-alerts/page.jsx
│   │   ├── cctv/
│   │   │   ├── page.jsx                        # Camera Dashboard
│   │   │   ├── live-feeds/page.jsx             # Phase 2+
│   │   │   ├── [cameraId]/page.jsx
│   │   │   └── health/page.jsx
│   │   ├── video-conferencing/                 # Phase 2+
│   │   │   ├── page.jsx                        # Start Random VC
│   │   │   ├── select-scheme/page.jsx
│   │   │   ├── select-region/page.jsx
│   │   │   ├── room/[sessionId]/page.jsx
│   │   │   └── history/page.jsx
│   │   ├── inspections/
│   │   │   ├── page.jsx                        # Inspection Dashboard
│   │   │   ├── pending/page.jsx
│   │   │   ├── scheduled/page.jsx
│   │   │   ├── surprise/page.jsx               # "Surprise Inspection" trigger — Random Assignment Flow entry point
│   │   │   ├── [inspectionId]/page.jsx          # Details, tracking, evidence viewer, action buttons
│   │   │   └── history/page.jsx
│   │   ├── reports/
│   │   │   ├── inspection-reports/page.jsx
│   │   │   ├── compliance-reports/page.jsx
│   │   │   ├── attendance-reports/page.jsx
│   │   │   ├── project-reports/page.jsx
│   │   │   ├── ai-analytics/page.jsx
│   │   │   └── export/page.jsx
│   │   ├── complaints/
│   │   │   ├── page.jsx                        # Complaint Dashboard
│   │   │   └── [complaintId]/page.jsx
│   │   ├── compliance/
│   │   │   ├── pending-actions/page.jsx
│   │   │   ├── notices/page.jsx                 # Phase 2+
│   │   │   ├── corrective-actions/page.jsx
│   │   │   └── closure/page.jsx
│   │   ├── users/
│   │   │   ├── government-users/page.jsx
│   │   │   ├── pmu/page.jsx
│   │   │   ├── inspectors/page.jsx
│   │   │   ├── ngos/page.jsx
│   │   │   ├── institutes/page.jsx
│   │   │   └── beneficiaries/page.jsx
│   │   ├── audit-logs/page.jsx                  # DB-level for MVP; simple read-only table view
│   │   └── settings/page.jsx
│   │
│   ├── (ngo)/                                   # NGO / Institute Web
│   │   ├── layout.jsx                           # role guard: ngo_admin, institute_admin
│   │   ├── attendance/
│   │   │   ├── page.jsx                          # Daily Attendance
│   │   │   ├── history/page.jsx
│   │   │   └── analytics/page.jsx
│   │   ├── cctv/
│   │   │   ├── page.jsx                          # Cameras
│   │   │   ├── add/page.jsx
│   │   │   └── status/page.jsx
│   │   ├── reports/page.jsx
│   │   ├── inspections/
│   │   │   ├── upcoming/page.jsx
│   │   │   ├── active/page.jsx
│   │   │   ├── previous/page.jsx
│   │   │   └── findings/page.jsx
│   │   ├── compliance/
│   │   │   ├── pending-issues/page.jsx
│   │   │   └── submit-action/page.jsx
│   │   ├── notifications/page.jsx
│   │   └── profile/page.jsx
│   │
│   ├── (beneficiary)/                            # Beneficiary App/Web — Phase 2+ features, schema reserved now
│   │   ├── layout.jsx                            # role guard: beneficiary
│   │   ├── home/page.jsx
│   │   ├── my-services/page.jsx
│   │   ├── attendance/page.jsx
│   │   ├── feedback/page.jsx
│   │   ├── complaint/page.jsx
│   │   └── survey/page.jsx
│   │
│   └── api/
│       ├── assignment/route.js                    # Random Inspection Assignment Flow logic
│       ├── risk/
│       │   ├── trigger/route.js                    # calls ai-service on new data
│       │   └── re-analyze/route.js                 # post-inspection re-scoring
│       ├── ingest/
│       │   ├── attendance/route.js
│       │   ├── report/route.js
│       │   └── cctv-status/route.js
│       └── actions/route.js                        # corrective action / close / re-inspect
│
├── components/
│   ├── shared/                                     # buttons, tables, modals
│   ├── gov/                                        # risk badges, alert cards, map widgets
│   ├── ngo/                                        # attendance forms, compliance forms
│   └── beneficiary/
├── lib/
│   ├── supabaseClient.js
│   ├── roleGuard.js
│   └── constants.js                                 # risk bands, weights (mirrors ai-service for display only)
├── styles/
│   └── globals.css                                   # Tailwind base
├── public/
├── next.config.js
└── package.json
```

---

## 3. `apps/mobile` — React Native (Expo) — Inspector App

Structured with **Expo Router**, matching the Inspector Mobile Detailed Flow, Checklist Flow, and Offline Flow from the diagram.

```
apps/mobile/
├── app/
│   ├── index.jsx                          # Splash
│   ├── (auth)/
│   │   ├── login.jsx
│   │   └── otp.jsx                        # OTP/MFA
│   ├── location-permission.jsx
│   ├── (main)/
│   │   ├── dashboard.jsx                  # Assigned Inspections
│   │   ├── inspection/
│   │   │   ├── [id]/
│   │   │   │   ├── details.jsx            # Inspection Details, Accept
│   │   │   │   ├── navigate.jsx           # Navigate to Location
│   │   │   │   ├── gps-verify.jsx         # GPS Check / Inside Allowed Radius gate
│   │   │   │   ├── checklist.jsx          # Infrastructure/Staff/Beneficiaries/Attendance/Documents/CCTV/Scheme Compliance
│   │   │   │   ├── evidence.jsx           # Photo/Video/Audio/Document capture
│   │   │   │   ├── review.jsx             # Review Evidence
│   │   │   │   ├── report.jsx             # Complete Report + Overall Assessment
│   │   │   │   ├── declaration.jsx        # Digital Declaration
│   │   │   │   └── submit.jsx             # Submit → Sync
│   │   │   └── history.jsx                # Inspection History
│   │   ├── notifications.jsx
│   │   ├── offline-queue.jsx              # Pending Sync list, matches Offline Flow
│   │   └── profile.jsx
├── components/
│   ├── ChecklistItem.jsx
│   ├── EvidenceCapture.jsx
│   ├── GpsGate.jsx
│   └── SyncStatusBadge.jsx
├── lib/
│   ├── supabaseClient.js
│   ├── offlineDb.js                        # expo-sqlite wrapper — local save + Pending Sync state
│   ├── syncManager.js                      # auto-upload on reconnect logic (Offline Flow: Internet Restored → Sync → Server)
│   ├── location.js                         # expo-location helpers, radius check
│   └── camera.js                           # expo-camera / expo-image-picker helpers
├── constants/
│   └── checklist.js                        # fixed checklist questions per category (single source of truth)
├── assets/
├── app.json                                  # Expo config
└── package.json
```

---

## 4. `apps/ai-service` — Python FastAPI — Risk Engine

```
apps/ai-service/
├── app/
│   ├── main.py                             # FastAPI app entrypoint
│   ├── routers/
│   │   ├── score.py                         # POST /score — weighted risk scoring
│   │   ├── similarity.py                    # POST /similarity — report text-similarity check
│   │   └── reanalyze.py                     # POST /reanalyze — post-inspection re-scoring
│   ├── services/
│   │   ├── risk_engine.py                   # scoring formula + banding logic
│   │   ├── text_similarity.py               # cosine similarity / diff ratio
│   │   └── reasons.py                       # builds the "reason list" jsonb for alerts
│   ├── models/
│   │   └── schemas.py                       # Pydantic request/response models
│   └── config.py                            # Supabase service-role client, weights config
├── tests/
│   └── test_risk_engine.py
├── requirements.txt
└── Dockerfile                                # optional, for Render/Railway deploy
```

---

## 5. `supabase/`

```
supabase/
├── migrations/
│   ├── 0001_core_tables.sql                 # users, organizations, schemes, institutes, inspectors
│   ├── 0002_monitoring_signals.sql          # attendance, cctv_cameras, cctv_status_log, reports, complaints
│   ├── 0003_risk_and_inspections.sql        # risk_scores, inspections, checklist_items, evidence, inspection_reports
│   ├── 0004_actions_and_notifications.sql   # actions, notifications, audit_logs
│   └── 0005_phase2_reserved.sql             # compliance_responses, vc_sessions, beneficiary_feedback (empty tables)
├── policies.sql                              # all RLS policies, one block per table
└── seed.sql                                  # demo institutes/inspectors/scores for the hackathon run-through
```

---

## 6. `packages/shared`

Small shared package so the checklist fields, risk bands, and action types are defined **once** and imported by both `apps/web` and `apps/mobile` — prevents the two frontends from drifting apart on what a "yes/no checklist item" or "risk band" actually is.

```
packages/shared/
├── constants/
│   ├── checklistFields.js     # matches inspection_checklist_items categories
│   ├── riskBands.js           # LOW/MEDIUM/HIGH/CRITICAL thresholds
│   └── actionTypes.js         # corrective_action / close_case / re_inspection
├── types/                      # JSDoc typedefs or lightweight TS types if adopted later
└── package.json
```

---

## 7. How This Maps to the Team Workflow Plan's Slices

| Slice | Folders touched |
|---|---|
| 1 — Registration + Dashboard Shell | `apps/web/app/(gov)/dashboard`, `apps/web/app/(gov)/users`, `supabase/migrations/0001` |
| 2 — Anomaly → Risk Score → Alert | `apps/web/app/api/ingest`, `apps/ai-service/app/routers/score.py`, `apps/web/app/(gov)/risk-alerts`, `supabase/migrations/0002-0003` |
| 3 — Initiate Inspection → Assignment | `apps/web/app/api/assignment`, `apps/web/app/(gov)/inspections/surprise`, `supabase/migrations/0003` |
| 4 — Mobile Login → Assignment → GPS Gate | `apps/mobile/app/(auth)`, `apps/mobile/app/(main)/inspection/[id]/gps-verify.jsx`, `apps/mobile/lib/location.js` |
| 5 — Mobile Checklist → Evidence → Offline Sync | `apps/mobile/app/(main)/inspection/[id]/checklist.jsx`, `evidence.jsx`, `apps/mobile/lib/offlineDb.js`, `syncManager.js` |
| 6 — Re-analysis → Evidence Viewer → Official Action | `apps/ai-service/app/routers/reanalyze.py`, `apps/web/app/(gov)/inspections/[inspectionId]`, `apps/web/app/api/actions` |

---

## 8. Notes

- Route groups (`(gov)`, `(ngo)`, `(beneficiary)`) share one Next.js deployment — one Vercel project, one set of env vars, simplest for a small team.
- Everything under `(beneficiary)` and the Phase 2+ folders (`video-conferencing`, `compliance/notices`) can exist as empty page stubs from day one so the sitemap is "real" in the repo, but should stay unbuilt until after the MVP loop demo — same rule as the Phase 2+ database tables.
- `packages/shared` is optional to set up on Day 0 but pays off fast once Slice 5 (mobile checklist) and Slice 1 (web forms) both need the exact same field list.
```

## 6. SETUP.md

```md
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
```
