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
