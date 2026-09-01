// FILE: apps/web/lib/triggerRiskRecompute.js

// Fires the recompute in the background — doesn't block the user's form submission,
// and a failure here shouldn't stop the attendance/report/CCTV update itself from succeeding.
export function triggerRiskRecompute(instituteId) {
  fetch('/api/risk/recompute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instituteId }),
  }).catch((err) => {
    console.error('Background risk recompute failed:', err);
  });
}