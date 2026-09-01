// FILE: apps/web/app/dashboard/institutes/[id]/monitoring/page.jsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RoleGuard from '../../../../../lib/RoleGuard';
import { supabase } from '../../../../../lib/supabaseClient';
import StatCard from '../../../../../components/dashboard/dashboard/StatCard';
import StatusBadge from '../../../../../components/dashboard/dashboard/StatusBadge';
import AttendanceTrendChart from '../../../../../components/dashboard/dashboard/AttendanceTrendChart';
import ReportCard from '../../../../../components/dashboard/dashboard/ReportCard';
import CameraCard from '../../../../../components/dashboard/dashboard/CameraCard';

const DEVIATION_THRESHOLD = 30; // existing business rule, percent

// Historical average is no longer a stored column — it's computed the same
// way the AI risk engine computes it: the average of every OLDER submission
// than the one being evaluated. `recordsDescByDate` must be sorted newest-first.
function computeHistoricalAverage(record, recordsDescByDate) {
  const idx = recordsDescByDate.findIndex((r) => r.id === record.id);
  const olderRecords = recordsDescByDate.slice(idx + 1);
  if (olderRecords.length === 0) return null;
  const sum = olderRecords.reduce((acc, r) => acc + (r.reported_count || 0), 0);
  return sum / olderRecords.length;
}

function computeDeviationPct(reported, historicalAverage) {
  if (typeof reported !== 'number' || typeof historicalAverage !== 'number' || historicalAverage === 0) {
    return null;
  }
  return ((reported - historicalAverage) / historicalAverage) * 100;
}

function getDeviationStatus(pct) {
  if (pct === null || pct === undefined) return 'unknown';
  return Math.abs(pct) >= DEVIATION_THRESHOLD ? 'flagged' : 'normal';
}

function formatPct(pct) {
  if (pct === null || pct === undefined) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function getLatestCameraStatus(camera) {
  const logs = camera?.cctv_status_log || [];
  if (logs.length === 0) return { status: 'unknown', checkedAt: null };
  const sorted = [...logs].sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at));
  const raw = (sorted[0]?.status || '').toLowerCase();
  const status = raw === 'online' || raw === 'offline' ? raw : 'unknown';
  return { status, checkedAt: sorted[0]?.checked_at || null };
}

function getLastUpdated(attendance, reports, cameras) {
  const timestamps = [];
  if (attendance[0]?.date) timestamps.push(new Date(attendance[0].date).getTime());
  if (reports[0]?.created_at) timestamps.push(new Date(reports[0].created_at).getTime());
  cameras.forEach((cam) => {
    (cam.cctv_status_log || []).forEach((log) => {
      if (log.checked_at) timestamps.push(new Date(log.checked_at).getTime());
    });
  });
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps));
}

function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-3 h-3 w-40 rounded bg-gray-200" />
      <div className="mb-2 h-7 w-64 rounded bg-gray-200" />
      <div className="h-4 w-80 rounded bg-gray-200" />
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 h-3 w-20 rounded bg-gray-200" />
          <div className="h-6 w-12 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 h-4 w-40 rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}

function InstituteMonitoringView() {
  const { id } = useParams();

  const [institute, setInstitute] = useState(null);
  const [attendance, setAttendance] = useState([]); // newest-first, each row enriched with computed historical_average
  const [reports, setReports] = useState([]);
  const [cameras, setCameras] = useState([]);

  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState(null);
  const [partialError, setPartialError] = useState(null);

  const load = async () => {
    setLoading(true);
    setFatalError(null);
    setPartialError(null);

    const [instRes, attRes, repRes, camRes] = await Promise.all([
      supabase.from('institutes').select('id, name, region, state, district, status').eq('id', id).single(),
      supabase
        .from('attendance')
        // historical_average column no longer selected — it's computed client-side below
        .select('id, date, reported_count, created_at')
        .eq('institute_id', id)
        .order('date', { ascending: false })
        .limit(10),
      supabase
        .from('reports')
        .select('id, content_text, similarity_score, created_at')
        .eq('institute_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('cctv_cameras')
        .select('id, label, cctv_status_log(status, checked_at)')
        .eq('institute_id', id),
    ]);

    if (instRes.error) {
      setFatalError(instRes.error.message || 'Failed to load institute.');
      setLoading(false);
      return;
    }

    setInstitute(instRes.data);

    // Enrich each attendance row with a computed historical average,
    // based on every OLDER row in this same fetched set (newest-first order).
    const rawAttendance = attRes.data || [];
    const enrichedAttendance = rawAttendance.map((record) => ({
      ...record,
      historical_average: computeHistoricalAverage(record, rawAttendance),
    }));

    setAttendance(enrichedAttendance);
    setReports(repRes.data || []);
    setCameras(camRes.data || []);

    const partialIssues = [attRes.error, repRes.error, camRes.error].filter(Boolean);
    if (partialIssues.length > 0) {
      setPartialError('Some monitoring data could not be loaded. Figures below may be incomplete.');
    }

    setLoading(false);
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const latestAttendance = attendance[0] || null;
  const latestDeviationPct = useMemo(() => {
    if (!latestAttendance) return null;
    return computeDeviationPct(latestAttendance.reported_count, latestAttendance.historical_average);
  }, [latestAttendance]);
  const latestDeviationStatus = getDeviationStatus(latestDeviationPct);

  const ascendingAttendance = useMemo(() => [...attendance].reverse(), [attendance]);

  const cameraStatuses = useMemo(() => cameras.map((cam) => getLatestCameraStatus(cam)), [cameras]);
  const onlineCount = cameraStatuses.filter((c) => c.status === 'online').length;
  const offlineCount = cameraStatuses.filter((c) => c.status === 'offline').length;

  const lastUpdated = useMemo(() => getLastUpdated(attendance, reports, cameras), [attendance, reports, cameras]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <HeaderSkeleton />
          </div>
        </div>
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <CardsSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      </div>
    );
  }

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
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!institute) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm font-medium text-gray-900">Institute not found</p>
        <p className="mt-1 text-sm text-gray-500">This institute may have been removed or the link is invalid.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/dashboard" className="transition-colors hover:text-gray-700">
              Dashboard
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
              <p className="mt-1 text-xs text-gray-400">
                {lastUpdated ? `Last updated ${lastUpdated.toLocaleString()}` : 'No monitoring activity recorded yet'}
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

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {partialError && (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>{partialError}</span>
            <button
              onClick={load}
              className="ml-4 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Monitoring summary */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Monitoring Summary</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <StatCard
              label="Attendance Status"
              value={latestAttendance ? (latestDeviationStatus === 'flagged' ? 'Flagged' : 'Normal') : 'No data'}
              tone={latestAttendance ? (latestDeviationStatus === 'flagged' ? 'rejected' : 'approved') : 'default'}
            />
            <StatCard
              label="Attendance Deviation"
              value={formatPct(latestDeviationPct)}
              tone={latestAttendance ? (latestDeviationStatus === 'flagged' ? 'rejected' : 'approved') : 'default'}
              hint={latestAttendance ? `vs. computed avg on ${new Date(latestAttendance.date).toLocaleDateString()}` : undefined}
            />
            <StatCard label="Recent Reports" value={reports.length} tone="default" hint="of last 10 fetched" />
            <StatCard label="Total Cameras" value={cameras.length} tone="default" />
            <StatCard label="Online Cameras" value={onlineCount} tone="approved" />
            <StatCard label="Offline Cameras" value={offlineCount} tone="rejected" />
          </div>
        </section>

        {/* Attendance */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Attendance (last {attendance.length || 0})</h2>
            <span className="text-xs text-gray-400">Flag threshold: ±{DEVIATION_THRESHOLD}%</span>
          </div>

          {attendance.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No attendance submitted yet.</p>
          ) : (
            <>
              {ascendingAttendance.length > 1 && (
                <div className="mb-6 border-b border-gray-100 pb-6">
                  <AttendanceTrendChart records={ascendingAttendance} />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Reported</th>
                      <th className="py-2 pr-4">Computed Avg</th>
                      <th className="py-2 pr-4">Deviation</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendance.map((record) => {
                      const pct = computeDeviationPct(record.reported_count, record.historical_average);
                      const status = getDeviationStatus(pct);
                      return (
                        <tr key={record.id} className="transition-colors hover:bg-gray-50">
                          <td className="py-2.5 pr-4 text-gray-700">
                            {record.date ? new Date(record.date).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-700">{record.reported_count ?? '—'}</td>
                          <td className="py-2.5 pr-4 text-gray-700">
                            {typeof record.historical_average === 'number' ? record.historical_average.toFixed(1) : '—'}
                          </td>
                          <td
                            className={`py-2.5 pr-4 font-medium ${
                              status === 'flagged' ? 'text-red-600' : status === 'normal' ? 'text-emerald-600' : 'text-gray-400'
                            }`}
                          >
                            {formatPct(pct)}
                          </td>
                          <td className="py-2.5">
                            <StatusBadge status={status} compact />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Computed Avg is the average of every earlier submission for this institute — the same calculation the risk engine uses. It's not a stored value, so the oldest row in this list always shows "—" (no earlier data to compare against).
              </p>
            </>
          )}
        </section>

        {/* Reports */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Reports ({reports.length})</h2>
          {reports.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No reports submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  content={report.content_text}
                  createdAt={report.created_at}
                  similarityScore={typeof report.similarity_score === 'number' ? report.similarity_score : undefined}
                />
              ))}
            </div>
          )}
        </section>

        {/* CCTV */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">CCTV Coverage ({cameras.length})</h2>
            <p className="text-xs text-gray-400">Simulated status feed — live streaming not yet integrated</p>
          </div>
          {cameras.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No cameras registered for this institute.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cameras.map((camera, i) => {
                const { status, checkedAt } = cameraStatuses[i];
                return <CameraCard key={camera.id} label={camera.label} status={status} checkedAt={checkedAt} />;
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function InstituteMonitoringPage() {
  return (
    <RoleGuard allowedRoles={['government', 'pmu', 'system_admin']}>
      <InstituteMonitoringView />
    </RoleGuard>
  );
}