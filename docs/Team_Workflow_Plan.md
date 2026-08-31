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
