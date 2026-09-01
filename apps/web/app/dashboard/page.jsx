// FILE: apps/web/app/dashboard/page.jsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '../../lib/RoleGuard';
import { supabase } from '../../lib/supabaseClient';
import StatCard from '../../components/dashboard/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/dashboard/StatusBadge';
import RiskBadge from '../../components/dashboard/dashboard/RiskBadge';

function formatStatusLabel(status) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function InstituteTableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4 px-4 py-4">
          <div className="col-span-2 h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 h-3 w-24 rounded bg-gray-200" />
      <div className="h-7 w-16 rounded bg-gray-200" />
    </div>
  );
}

function DashboardContent() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [recomputingAll, setRecomputingAll] = useState(false);
  const [recomputeSummary, setRecomputeSummary] = useState(null);

  const loadInstitutes = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('institutes')
      .select('id, name, region, state, district, status, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message || 'Failed to load institutes.');
      setInstitutes([]);
      setLoading(false);
      return;
    }

    // Attach each institute's most recent risk score, if one exists.
    const withRisk = await Promise.all(
      (data || []).map(async (inst) => {
        const { data: riskRows } = await supabase
          .from('risk_scores')
          .select('score, band, computed_at')
          .eq('institute_id', inst.id)
          .order('computed_at', { ascending: false })
          .limit(1);

        return { ...inst, latestRisk: riskRows?.[0] || null };
      })
    );

    setInstitutes(withRisk);
    setLoading(false);
  };

  useEffect(() => {
    loadInstitutes();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('risk_scores_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'risk_scores' },
        (payload) => {
          const newRisk = payload.new;
          setInstitutes((prev) =>
            prev.map((inst) =>
              inst.id === newRisk.institute_id
                ? { ...inst, latestRisk: { score: newRisk.score, band: newRisk.band, computed_at: newRisk.computed_at } }
                : inst
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Recomputes every institute's risk score, not just ones with new incoming data.
  // Runs sequentially (not Promise.all) so the AI service isn't hit with a burst
  // of simultaneous requests — fine for MVP data volumes, and the realtime
  // subscription above will update each row live as results come in.
  const handleRecomputeAll = async () => {
    setRecomputingAll(true);
    setRecomputeSummary(null);

    let succeeded = 0;
    let failed = 0;

    for (const inst of institutes) {
      try {
        const res = await fetch('/api/risk/recompute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instituteId: inst.id }),
        });
        if (res.ok) {
          succeeded += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }

    setRecomputingAll(false);
    setRecomputeSummary({ succeeded, failed, total: institutes.length });
  };

  const statusCounts = useMemo(() => {
    const counts = {};
    for (const inst of institutes) {
      const key = inst.status || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [institutes]);

  const highRiskCount = useMemo(
    () => institutes.filter((inst) => ['HIGH', 'CRITICAL'].includes(inst.latestRisk?.band)).length,
    [institutes]
  );

  const availableStatuses = useMemo(() => Object.keys(statusCounts).sort(), [statusCounts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return institutes.filter((inst) => {
      const matchesSearch = term ? (inst.name || '').toLowerCase().includes(term) : true;
      const matchesState = stateFilter
        ? (inst.state || '').toLowerCase().includes(stateFilter.toLowerCase())
        : true;
      const matchesDistrict = districtFilter
        ? (inst.district || '').toLowerCase().includes(districtFilter.toLowerCase())
        : true;
      const matchesStatus = statusFilter === 'all' ? true : inst.status === statusFilter;
      return matchesSearch && matchesState && matchesDistrict && matchesStatus;
    });
  }, [institutes, search, stateFilter, districtFilter, statusFilter]);

  const hasActiveFilters = Boolean(search || stateFilter || districtFilter || statusFilter !== 'all');

  const clearFilters = () => {
    setSearch('');
    setStateFilter('');
    setDistrictFilter('');
    setStatusFilter('all');
  };

  const total = institutes.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                Institution Monitoring Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Department of Social Justice &amp; Empowerment — registered institutions overview
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/pending"
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                View Pending Registrations
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/dashboard/alerts"
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                View High/Critical Alerts
                <span aria-hidden="true">→</span>
              </Link>

              <button
                onClick={handleRecomputeAll}
                disabled={recomputingAll || institutes.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {recomputingAll ? `Recomputing... (${recomputeSummary?.succeeded ?? 0}/${institutes.length})` : 'Recompute All Risk Scores'}
              </button>
            </div>
          </div>

          {recomputeSummary && !recomputingAll && (
            <p className="mt-3 text-xs text-gray-500">
              Recomputed {recomputeSummary.succeeded} of {recomputeSummary.total} institutes
              {recomputeSummary.failed > 0 ? ` (${recomputeSummary.failed} failed — check that the AI service is running)` : ''}.
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error state */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>Couldn&apos;t load institutes: {error}</span>
            <button
              onClick={loadInstitutes}
              className="ml-4 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI cards */}
        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Total Institutes" value={total} tone="default" />
              <StatCard label="Approved" value={statusCounts.approved || 0} tone="approved" />
              <StatCard label="Pending Registrations" value={statusCounts.pending || 0} tone="pending" />
              <StatCard label="Rejected" value={statusCounts.rejected || 0} tone="rejected" />
              <StatCard label="High / Critical Risk" value={highRiskCount} tone="rejected" />
            </>
          )}
        </section>

        {/* Status distribution — built from real counts only */}
        {!loading && !error && total > 0 && (
          <section className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Status Distribution</h2>
            <div className="mb-3 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              {availableStatuses.map((status) => {
                const count = statusCounts[status];
                const pct = total ? (count / total) * 100 : 0;
                const color =
                  status === 'approved'
                    ? 'bg-emerald-500'
                    : status === 'pending'
                    ? 'bg-amber-500'
                    : status === 'rejected'
                    ? 'bg-red-500'
                    : 'bg-gray-400';
                return (
                  <div
                    key={status}
                    className={`${color} h-full transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${formatStatusLabel(status)}: ${count}`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
              {availableStatuses.map((status) => (
                <div key={status} className="flex items-center gap-1.5">
                  <StatusBadge status={status} compact />
                  <span>
                    {statusCounts[status]} ({total ? Math.round((statusCounts[status] / total) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
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
              <input
                id="state"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                placeholder="Filter by state"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="district" className="mb-1 block text-xs font-medium text-gray-500">
                District
              </label>
              <input
                id="district"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                placeholder="Filter by district"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="mb-1 block text-xs font-medium text-gray-500">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All statuses</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {loading ? 'Loading...' : `${filtered.length} of ${total} institute${total === 1 ? '' : 's'}`}
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

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {loading ? (
            <InstituteTableSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <p className="text-sm font-medium text-gray-900">
                {total === 0 ? 'No institutes registered yet' : 'No institutes match your filters'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {total === 0
                  ? 'Registered institutes will appear here once onboarded.'
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((inst) => (
                    <tr key={inst.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link
                          href={`/dashboard/institutes/${inst.id}/monitoring`}
                          className="text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                        >
                          {inst.name || 'Untitled institute'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{inst.region || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{inst.state || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{inst.district || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inst.status} />
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge score={inst.latestRisk?.score} band={inst.latestRisk?.band} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/institutes/${inst.id}/monitoring`}
                          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Monitor
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function GovDashboard() {
  return (
    <RoleGuard allowedRoles={['government', 'pmu', 'system_admin']}>
      <DashboardContent />
    </RoleGuard>
  );
}