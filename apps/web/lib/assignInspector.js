// FILE: apps/web/lib/assignInspector.js

/**
 * Pure assignment function — no I/O, fully testable with fake data.
 * Order: candidates are assumed pre-filtered to availability_status === 'available'.
 * This function: excludes conflict-of-interest -> ranks by region-match tier + workload
 * -> random tie-break among the top pool (max 3).
 *
 * @param {{ id: string, region: string, state: string, district: string }} params.institute
 * @param {Array<{ id: string, user_id: string, home_region: string, specialization: string, current_workload: number }>} params.candidateInspectors
 * @param {string[]} params.priorInspectorIdsForInstitute - users.id values previously assigned to this institute
 */
export function assignInspector({ institute, candidateInspectors, priorInspectorIdsForInstitute }) {
  const priorSet = new Set(priorInspectorIdsForInstitute || []);

  const excludedForConflict = (candidateInspectors || [])
    .filter((inspector) => priorSet.has(inspector.user_id))
    .map((inspector) => inspector.id);

  const withoutConflict = (candidateInspectors || []).filter(
    (inspector) => !priorSet.has(inspector.user_id)
  );

  if (withoutConflict.length === 0) {
    return {
      assignedInspector: null,
      reason: {
        method: 'no_eligible_inspector',
        totalCandidatesConsidered: (candidateInspectors || []).length,
        excludedForConflict,
      },
    };
  }

  const norm = (s) => (s || '').trim().toLowerCase();
  const matchTier = (inspector) => {
    const region = norm(inspector.home_region);
    if (!region) return 0;
    if (region === norm(institute.district)) return 3;
    if (region === norm(institute.region)) return 2;
    if (region === norm(institute.state)) return 1;
    return 0;
  };

  const ranked = [...withoutConflict].sort((a, b) => {
    const tierDiff = matchTier(b) - matchTier(a);
    if (tierDiff !== 0) return tierDiff;
    return (a.current_workload || 0) - (b.current_workload || 0);
  });

  const pool = ranked.slice(0, Math.min(3, ranked.length));
  const assignedInspector = pool[Math.floor(Math.random() * pool.length)];

  return {
    assignedInspector,
    reason: {
      method: pool.length > 1 ? 'random_tiebreak_top_pool' : 'single_eligible_candidate',
      matchTier: matchTier(assignedInspector),
      workloadAtAssignment: assignedInspector.current_workload || 0,
      poolSize: pool.length,
      poolInspectorIds: pool.map((i) => i.id),
      totalCandidatesConsidered: (candidateInspectors || []).length,
      excludedForConflict,
    },
  };
}