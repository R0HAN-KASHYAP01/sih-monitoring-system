// FILE: apps/web/app/dashboard/institutes/[id]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RoleGuard from '../../../../lib/RoleGuard';
import { supabase } from '../../../../lib/supabaseClient';

function InstituteDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [institute, setInstitute] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('institutes')
      .select('id, name, region, state, district, status, created_at, organization_id')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setInstitute(data);
        setLoading(false);
      });
  }, [id]);

  const handleDecision = async (decision) => {
    setError('');
    const { data: { session } } = await supabase.auth.getSession();

    const updates = {
      status: decision,
      approved_by: session.user.id,
      approved_at: new Date().toISOString(),
    };
    if (decision === 'rejected') updates.rejection_reason = rejectionReason;

    const { error: updateError } = await supabase
      .from('institutes')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Notify the NGO admin who owns this institute's organization
    const { data: orgUsers } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', institute.organization_id);

    if (orgUsers?.length) {
      await supabase.from('notifications').insert(
        orgUsers.map((u) => ({
          user_id: u.id,
          type: decision === 'approved' ? 'registration_approved' : 'registration_rejected',
          payload: { institute_id: id, reason: rejectionReason || null },
        }))
      );
    }

    router.push('/dashboard/pending');
  };

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading...</p>;
  if (!institute) return <p className="p-8 text-sm text-red-600">Institute not found.</p>;

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-xl font-semibold">{institute.name}</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 space-y-2 text-sm">
        <p><span className="text-gray-500">Region:</span> {institute.region}</p>
        <p><span className="text-gray-500">State:</span> {institute.state}</p>
        <p><span className="text-gray-500">District:</span> {institute.district}</p>
        <p><span className="text-gray-500">Status:</span> {institute.status}</p>
        <p><span className="text-gray-500">Submitted:</span> {new Date(institute.created_at).toLocaleString()}</p>
      </div>

      {institute.status === 'pending' && (
        <div className="space-y-3">
          <button
            onClick={() => handleDecision('approved')}
            className="w-full rounded bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Approve
          </button>

          {!showRejectBox ? (
            <button
              onClick={() => setShowRejectBox(true)}
              className="w-full rounded border border-red-600 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Reject
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                onClick={() => handleDecision('rejected')}
                className="w-full rounded bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InstituteDetailPage() {
  return (
    <RoleGuard allowedRoles={['government', 'pmu', 'system_admin']}>
      <InstituteDetail />
    </RoleGuard>
  );
}