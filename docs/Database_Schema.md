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
