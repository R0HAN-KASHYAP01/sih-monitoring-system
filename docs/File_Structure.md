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
