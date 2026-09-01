// FILE: apps/web/app/dashboard/institutes/[id]/initiate-inspection/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RoleGuard from '../../../../../lib/RoleGuard';
import { supabase } from '../../../../../lib/supabaseClient';

function InitiateInspectionForm() {
  const { id } = useParams();
  const router = useRouter();
  const [institute, setInstitute] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from('institutes')
      .select('id, name, region, state, district')
      .eq('id', id)
      .single()
      .then(({ data }) => setInstitute(data));
  }, [id]);

  const handleInitiate = async () => {
    setError('');
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();

    // Note: inspector_id is left null here — Phase 7's assignment engine fills this in.
    const { data: inspection, error: insertError } = await supabase
      .from('inspections')
      .insert({
        institute_id: id,
        type: 'surprise',
        status: 'assigned',
        initiated_by: session.user.id,
      })
      .select()
      .single();

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(`/dashboard/inspections/${inspection.id}`);
  };

  if (!institute) return <p className="p-8 text-sm text-gray-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-2 text-xl font-semibold">Initiate Surprise Inspection</h1>
      <p className="mb-6 text-sm text-gray-500">
        {institute.name} — {institute.region}, {institute.district}, {institute.state}
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <p className="mb-6 text-sm text-gray-600">
        This creates an inspection record for this institute. An inspector will be assigned in the next step.
      </p>

      <button
        onClick={handleInitiate}
        disabled={submitting}
        className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Initiating...' : 'Confirm: Initiate Inspection'}
      </button>
    </div>
  );
}

export default function InitiateInspectionPage() {
  return (
    <RoleGuard allowedRoles={['government', 'pmu', 'system_admin']}>
      <InitiateInspectionForm />
    </RoleGuard>
  );
}