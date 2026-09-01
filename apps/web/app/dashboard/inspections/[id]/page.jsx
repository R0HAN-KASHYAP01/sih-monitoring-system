// FILE: apps/web/app/dashboard/inspections/[id]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RoleGuard from '../../../../lib/RoleGuard';
import { supabase } from '../../../../lib/supabaseClient';

function InspectionDetail() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [inspectorProfile, setInspectorProfile] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  const loadInspection = async () => {
    const { data } = await supabase
      .from('inspections')
      .select(
        'id, status, type, assigned_at, assignment_reason, inspector_id, institutes(name, region, district, state), users:inspector_id(full_name, phone)'
      )
      .eq('id', id)
      .single();

    setInspection(data);

    if (data?.inspector_id) {
      const { data: profile } = await supabase
        .from('inspectors')
        .select('home_region, specialization, current_workload')
        .eq('user_id', data.inspector_id)
        .single();
      setInspectorProfile(profile);
    } else {
      setInspectorProfile(null);
    }
  };

  useEffect(() => {
    loadInspection();
  }, [id]);

  const handleAssign = async () => {
    setAssigning(true);
    setError('');

    const res = await fetch('/api/assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspection_id: id }),
    });
    const result = await res.json();

    setAssigning(false);

    if (!res.ok) {
      setError(result.error || 'Assignment failed');
      return;
    }

    loadInspection();
  };

  if (!inspection) return <p className="p-8 text-sm text-gray-500">Loading...</p>;

  const reason = inspection.assignment_reason;

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-2 text-xl font-semibold">Inspection: {inspection.institutes?.name}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {inspection.institutes?.region}, {inspection.institutes?.district}, {inspection.institutes?.state}
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-2 text-sm">
        <p><span className="text-gray-500">Status:</span> {inspection.status}</p>
        <p><span className="text-gray-500">Type:</span> {inspection.type}</p>
        <p><span className="text-gray-500">Assigned at:</span> {new Date(inspection.assigned_at).toLocaleString()}</p>
      </div>

      <div className="mt-6 rounded border border-gray-200 p-4">
        <h2 className="mb-2 text-sm font-medium">Inspector Assignment</h2>

        {!inspection.inspector_id ? (
          <div>
            <p className="mb-3 text-sm text-gray-500">No inspector assigned yet.</p>
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : 'Assign Inspector'}
            </button>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">Inspector:</span> {inspection.users?.full_name || '—'}</p>
            <p><span className="text-gray-500">Phone:</span> {inspection.users?.phone || '—'}</p>
            <p><span className="text-gray-500">Home region:</span> {inspectorProfile?.home_region || '—'}</p>
            <p><span className="text-gray-500">Specialization:</span> {inspectorProfile?.specialization || '—'}</p>
            {reason && (
              <div className="mt-3 rounded bg-gray-50 p-3 text-xs text-gray-600">
                <p className="mb-1 font-medium text-gray-700">Why this inspector:</p>
                <p>Selection method: {reason.method}</p>
                {typeof reason.matchTier === 'number' && (
                  <p>Region match tier: {reason.matchTier} (3 = district, 2 = region, 1 = state, 0 = none)</p>
                )}
                {typeof reason.poolSize === 'number' && <p>Random tie-break pool size: {reason.poolSize}</p>}
                {reason.excludedForConflict?.length > 0 && (
                  <p>Excluded for conflict of interest: {reason.excludedForConflict.length} inspector(s)</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InspectionDetailPage() {
  return (
    <RoleGuard allowedRoles={['government', 'pmu', 'system_admin']}>
      <InspectionDetail />
    </RoleGuard>
  );
}