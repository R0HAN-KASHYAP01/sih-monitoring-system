// FILE: apps/web/app/dashboard/pending/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '../../../lib/RoleGuard';
import { supabase } from '../../../lib/supabaseClient';
import StatusBadge from '../../../components/dashboard/dashboard/StatusBadge';

function daysAgo(dateStr) {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function PendingTableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-4 px-4 py-4">
          <div className="col-span-2 h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 w-20 justify-self-end rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function PendingList() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const loadPending = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('institutes')
      .select('id, name, region, state, district, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message || 'Failed to load pending registrations.');
      setInstitutes([]);
    } else {
      setInstitutes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPending();
  }, []);

  const availableStates = useMemo(() => {
    const set = new Set(institutes.map((i) => i.state).filter(Boolean));
    return Array.from(set).sort();
  }, [institutes]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return institutes.filter((inst) => {
      const matchesSearch = term ? (inst.name || '').toLowerCase().includes(term) : true;
      const matchesState = stateFilter ? inst.state === stateFilter : true;
      return matchesSearch && matchesState;
    });
  }, [institutes, search, stateFilter]);

  const hasActiveFilters = Boolean(search || stateFilter);
  const clearFilters = () => {
    setSearch('');
    setStateFilter('');
  };

  const total = institutes.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/dashboard" className="transition-colors hover:text-gray-700">
              Dashboard
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-gray-700">Pending Registrations</span>
          </nav>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Pending Registrations</h1>
                {!loading && !error && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                    {total} awaiting review
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Review new institute registrations before they go live in the system.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error state */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>Couldn&apos;t load pending registrations: {error}</span>
            <button
              onClick={loadPending}
              className="ml-4 shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters */}
        {!error && (total > 0 || loading) && (
          <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="search" className="mb-1 block text-xs font-medium text-gray-500">
                  Search by name
                </label>
                <input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search institutes..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="state" className="mb-1 block text-xs font-medium text-gray-500">
                  State
                </label>
                <select
                  id="state"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All states</option>
                  {availableStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {loading ? 'Loading...' : `${filtered.length} of ${total} registration${total === 1 ? '' : 's'}`}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          </section>
        )}

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {loading ? (
            <PendingTableSkeleton />
          ) : !error && filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25 6-6m-9.5-6h9.5A2.25 2.25 0 0121.5 5.25v13.5A2.25 2.25 0 0119.25 21H4.75A2.25 2.25 0 012.5 18.75V5.25A2.25 2.25 0 014.75 3z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {total === 0 ? 'No pending registrations' : 'No registrations match your filters'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {total === 0
                  ? 'New institute registrations will appear here for review.'
                  : 'Try adjusting or clearing your filters.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : !error ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Institute</th>
                    <th className="px-4 py-3">Region / State</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((inst) => {
                    const waitDays = daysAgo(inst.created_at);
                    return (
                      <tr key={inst.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <Link
                            href={`/dashboard/institutes/${inst.id}`}
                            className="text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                          >
                            {inst.name || 'Untitled institute'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {[inst.region, inst.state].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{inst.district || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {inst.created_at ? new Date(inst.created_at).toLocaleDateString() : '—'}
                          {waitDays !== null && waitDays >= 3 && (
                            <span className="ml-2 text-xs font-medium text-amber-600">
                              ({waitDays}d waiting)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status="pending" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/institutes/${inst.id}`}
                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default function PendingPage() {
  return (
    <RoleGuard allowedRoles={['government', 'pmu', 'system_admin']}>
      <PendingList />
    </RoleGuard>
  );
}