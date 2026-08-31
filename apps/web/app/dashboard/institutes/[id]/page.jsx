// FILE: apps/web/app/dashboard/institutes/[id]/page.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RoleGuard from '../../../../lib/RoleGuard';
import { supabase } from '../../../../lib/supabaseClient';
import StatusBadge from '../../../../components/dashboard/dashboard/StatusBadge';

const MIN_REJECTION_REASON_LENGTH = 10;

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-36 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value || <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-3 h-3 w-48 rounded bg-gray-200" />
            <div className="mb-2 h-7 w-72 rounded bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-200" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-gray-100" />
            ))}
          </div>
        </div>
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
          <div className="h-10 w-full rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

/** Rejection modal — required reason, validation, double-submit protection */
function RejectionModal({ open, onClose, onConfirm, submitting, error }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setTouched(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const trimmedLength = reason.trim().length;
  const isValid = trimmedLength >= MIN_REJECTION_REASON_LENGTH;

  const handleConfirm = () => {
    setTouched(true);
    if (!isValid || submitting) return;
    onConfirm(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 id="reject-modal-title" className="text-base font-semibold text-gray-900">
          Reject Registration
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Provide a clear reason. This will be shared with the institute&apos;s administrator.
        </p>

        <div className="mt-4">
          <label htmlFor="rejection-reason" className="mb-1 block text-xs font-medium text-gray-500">
            Reason for rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            id="rejection-reason"
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={submitting}
            rows={4}
            placeholder="e.g. Submitted documents do not match the registered address on file."
            className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-50 ${
              touched && !isValid
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          <div className="mt-1 flex items-center justify-between">
            {touched && !isValid ? (
              <p className="text-xs text-red-600">
                Please provide at least {MIN_REJECTION_REASON_LENGTH} characters explaining the decision.
              </p>
            ) : (
              <p className="text-xs text-gray-400">Minimum {MIN_REJECTION_REASON_LENGTH} characters.</p>
            )}
            <p className="text-xs text-gray-400">{trimmedLength}</p>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || (touched && !isValid)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {submitting ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InstituteDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [institute, setInstitute] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const submitLockRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setFatalError(null);

    const { data, error } = await supabase
      .from('institutes')
      .select(
        'id, name, region, state, district, status, created_at, organization_id, approved_by, approved_at, rejection_reason'
      )
      .eq('id', id)
      .single();

    if (error) {
      setFatalError(error.message || 'Failed to load this institute.');
      setLoading(false);
      return;
    }

    setInstitute(data);

    if (data?.organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, type')
        .eq('id', data.organization_id)
        .maybeSingle();
      setOrganization(orgData || null);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDecision = async (decision, rejectionReason = '') => {
    // Double-submit protection: hard lock in addition to the disabled button state
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    setSubmittingDecision(true);
    setDecisionError('');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const updates = {
        status: decision,
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
      };
      if (decision === 'rejected') updates.rejection_reason = rejectionReason;

      const { error: updateError } = await supabase.from('institutes').update(updates).eq('id', id);

      if (updateError) throw updateError;

      // Notify the NGO admin(s) who own this institute's organization
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

      setSuccessMessage(decision === 'approved' ? 'Institute approved. Redirecting…' : 'Institute rejected. Redirecting…');
      setShowRejectModal(false);
      setTimeout(() => router.push('/dashboard/pending'), 700);
    } catch (err) {
      setDecisionError(err?.message || 'Something went wrong. Please try again.');
      submitLockRef.current = false;
      setSubmittingDecision(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (fatalError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm font-medium text-red-700">Couldn&apos;t load this institute</p>
        <p className="mt-1 text-sm text-gray-500">{fatalError}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={load}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Retry
          </button>
          <Link
            href="/dashboard/pending"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Back to Pending
          </Link>
        </div>
      </div>
    );
  }

  if (!institute) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm font-medium text-gray-900">Institute not found.</p>
        <Link
          href="/dashboard/pending"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Back to Pending
        </Link>
      </div>
    );
  }

  const isPending = institute.status === 'pending';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/dashboard" className="transition-colors hover:text-gray-700">
              Dashboard
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/dashboard/pending" className="transition-colors hover:text-gray-700">
              Pending Registrations
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-gray-700">{institute.name}</span>
          </nav>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{institute.name}</h1>
                <StatusBadge status={institute.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {[institute.region, institute.district, institute.state].filter(Boolean).join(', ') || 'Location not set'}
              </p>
            </div>

            <Link
              href="/dashboard/pending"
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <span aria-hidden="true">←</span>
              Back to Pending
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25 6-6" />
            </svg>
            {successMessage}
          </div>
        )}

        {decisionError && !showRejectModal && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {decisionError}
          </div>
        )}

        {/* Institute information */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Institute Information</h2>
          <dl className="divide-y divide-gray-100">
            <InfoRow label="Region" value={institute.region} />
            <InfoRow label="State" value={institute.state} />
            <InfoRow label="District" value={institute.district} />
            <InfoRow
              label="Submitted"
              value={institute.created_at ? new Date(institute.created_at).toLocaleString() : null}
            />
          </dl>
        </section>

        {/* Organization information */}
        {institute.organization_id && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Organization</h2>
            <dl className="divide-y divide-gray-100">
              <InfoRow label="Name" value={organization?.name} />
              <InfoRow
                label="Type"
                value={organization?.type ? organization.type.toUpperCase() : null}
              />
            </dl>
          </section>
        )}

        {/* Prior decision (if already reviewed) */}
        {!isPending && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Administrative Decision</h2>
            <dl className="divide-y divide-gray-100">
              <InfoRow
                label="Decision"
                value={<StatusBadge status={institute.status} compact />}
              />
              <InfoRow
                label="Decided at"
                value={institute.approved_at ? new Date(institute.approved_at).toLocaleString() : null}
              />
              {institute.status === 'rejected' && (
                <InfoRow label="Reason" value={institute.rejection_reason} />
              )}
            </dl>
          </section>
        )}

        {/* Administrative decision area */}
        {isPending && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-1 text-sm font-semibold text-gray-900">Administrative Decision</h2>
            <p className="mb-4 text-sm text-gray-500">
              Approve to activate this institute, or reject with a documented reason.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => handleDecision('approved')}
                disabled={submittingDecision}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingDecision && (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {submittingDecision ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => {
                  setDecisionError('');
                  setShowRejectModal(true);
                }}
                disabled={submittingDecision}
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </section>
        )}
      </main>

      <RejectionModal
        open={showRejectModal}
        onClose={() => {
          if (!submittingDecision) setShowRejectModal(false);
        }}
        onConfirm={(reason) => handleDecision('rejected', reason)}
        submitting={submittingDecision}
        error={decisionError}
      />
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