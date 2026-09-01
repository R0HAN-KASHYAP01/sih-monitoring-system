// FILE: apps/web/app/ngo-dashboard/page.jsx
// (full replacement)

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ShieldCheck,
  Video,
  Users,
  AlertTriangle,
  Info,
  CalendarDays,
  ArrowRight,
  Bell,
  CircleUserRound,
  ChevronDown,
  Plus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import RoleGuard from '../../lib/RoleGuard';

// Quick links preserved from the original nav-list dashboard so the flows it
// pointed to (register institute, submit attendance, etc.) stay reachable
// from the new overview layout.
const QUICK_ACTIONS = [
  { href: '/ngo-dashboard/register', label: 'Register a new institute', icon: Plus },
  { href: '/ngo-dashboard/attendance', label: 'Submit attendance', icon: Users },
  { href: '/ngo-dashboard/attendance/history', label: 'Attendance history', icon: CalendarDays },
  { href: '/ngo-dashboard/reports', label: 'Submit a report', icon: Info },
  { href: '/ngo-dashboard/cctv', label: 'Manage CCTV', icon: Video },
];

const RISK_STYLES = {
  LOW: { text: 'text-emerald-600', dot: 'text-emerald-500', label: 'Normal' },
  MEDIUM: { text: 'text-amber-600', dot: 'text-amber-500', label: 'Watch' },
  HIGH: { text: 'text-orange-600', dot: 'text-orange-500', label: 'Elevated' },
  CRITICAL: { text: 'text-red-600', dot: 'text-red-500', label: 'Urgent' },
};

const CAMERA_HEALTH_THRESHOLD_HOURS = 4; // below this while "online" reads as degraded, not just up/down

function shortInstituteCode(id) {
  if (!id) return '—';
  return `INST-${id.replace(/-/g, '').slice(0, 3).toUpperCase()}-${id
    .replace(/-/g, '')
    .slice(3, 5)
    .toUpperCase()}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function timeAgo(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function NgoDashboard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState(null);

  const [institutes, setInstitutes] = useState([]);
  const [instituteId, setInstituteId] = useState(null);

  const [riskScore, setRiskScore] = useState(null);
  const [cameras, setCameras] = useState([]); // [{ ...camera, latestStatus }]
  const [attendanceWeek, setAttendanceWeek] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [upcomingInspections, setUpcomingInspections] = useState([]);
  const [recentReports, setRecentReports] = useState([]);

  const institute = useMemo(
    () => institutes.find((i) => i.id === instituteId) || null,
    [institutes, instituteId]
  );

  // Step 1: find the institute(s) this NGO admin's organization owns.
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        setError('Could not resolve your organization. Contact an administrator.');
        setLoading(false);
        return;
      }

      const { data: instituteRows, error: instituteError } = await supabase
        .from('institutes')
        .select('id, name, region, state, district, status, created_at')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: true });

      if (instituteError) {
        setError(instituteError.message);
        setLoading(false);
        return;
      }

      setInstitutes(instituteRows || []);
      setInstituteId(instituteRows?.[0]?.id ?? null);

      if (!instituteRows?.length) setLoading(false);
    })();
  }, []);

  // Step 2: load everything the overview needs for the selected institute.
  const loadInstituteData = useCallback(async (id) => {
    if (!id) return;
    setSyncing(true);
    setError('');

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

      const [
        riskRes,
        camerasRes,
        attendanceRes,
        alertsRes,
        inspectionsRes,
        reportsRes,
      ] = await Promise.all([
        supabase
          .from('risk_scores')
          .select('score, band, reasons, computed_at')
          .eq('institute_id', id)
          .order('computed_at', { ascending: false })
          .limit(1),
        supabase.from('cctv_cameras').select('id, label, installed_at').eq('institute_id', id),
        supabase
          .from('attendance')
          .select('date, reported_count, historical_average')
          .eq('institute_id', id)
          .gte('date', sevenDaysAgoStr)
          .order('date', { ascending: true }),
        supabase
          .from('actions')
          .select('id, type, status, notes, created_at')
          .eq('institute_id', id)
          .in('status', ['open', 'awaiting_response'])
          .order('created_at', { ascending: false }),
        // Only ever surface pre-announced, scheduled inspections here.
        // Surprise inspections must stay hidden from the institute until the
        // inspector is on-site — showing them in advance would defeat the
        // whole point of unpredictable inspections (see PRD §1, §7 Risks).
        supabase
          .from('inspections')
          .select('id, type, status, assigned_at')
          .eq('institute_id', id)
          .eq('type', 'scheduled')
          .in('status', ['assigned', 'en_route', 'gps_verified', 'in_progress'])
          .order('assigned_at', { ascending: true })
          .limit(5),
        supabase
          .from('inspection_reports')
          .select(
            `id, submitted_at, declaration_confirmed,
             inspections!inner ( id, type, institute_id, inspector_id,
               inspectors ( users ( full_name ) ) )`
          )
          .eq('inspections.institute_id', id)
          .order('submitted_at', { ascending: false })
          .limit(5),
      ]);

      if (riskRes.error) throw riskRes.error;
      setRiskScore(riskRes.data?.[0] ?? null);

      if (camerasRes.error) throw camerasRes.error;
      const cameraList = camerasRes.data || [];

      let camerasWithStatus = cameraList.map((c) => ({ ...c, latestStatus: null }));
      if (cameraList.length) {
        const { data: statusRows, error: statusError } = await supabase
          .from('cctv_status_log')
          .select('camera_id, status, active_hours_today, checked_at')
          .in(
            'camera_id',
            cameraList.map((c) => c.id)
          )
          .order('checked_at', { ascending: false });
        if (statusError) throw statusError;

        const latestByCamera = new Map();
        for (const row of statusRows || []) {
          if (!latestByCamera.has(row.camera_id)) latestByCamera.set(row.camera_id, row);
        }
        camerasWithStatus = cameraList.map((c) => ({
          ...c,
          latestStatus: latestByCamera.get(c.id) ?? null,
        }));
      }
      setCameras(camerasWithStatus);

      if (attendanceRes.error) throw attendanceRes.error;
      setAttendanceWeek(attendanceRes.data || []);

      if (alertsRes.error) throw alertsRes.error;
      setAlerts(alertsRes.data || []);

      if (inspectionsRes.error) throw inspectionsRes.error;
      setUpcomingInspections(inspectionsRes.data || []);

      if (reportsRes.error) throw reportsRes.error;
      setRecentReports(reportsRes.data || []);

      setLastSynced(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load institute data.');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (instituteId) loadInstituteData(instituteId);
  }, [instituteId, loadInstituteData]);

  const cameraOnlineCount = cameras.filter((c) => c.latestStatus?.status === 'online').length;

  const todayAttendance = attendanceWeek[attendanceWeek.length - 1] ?? null;
  // No capacity field exists on `institutes` yet — approximate a target from
  // the historical baseline until one is added to the schema.
  const attendanceTarget = todayAttendance?.historical_average
    ? Math.ceil(todayAttendance.historical_average / 10) * 10
    : null;

  const chartData = attendanceWeek.map((row) => ({
    day: new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' }),
    count: row.reported_count,
  }));

  const riskStyle = RISK_STYLES[riskScore?.band] ?? RISK_STYLES.LOW;

  return (
    <RoleGuard allowedRoles={['ngo_admin', 'institute_admin']}>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {/* Top nav */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <div className="flex items-center gap-10">
            <span className="text-lg font-bold tracking-tight">Sovereign Watch</span>
            <nav className="flex items-center gap-7 text-sm text-gray-700">
              <span className="border-b-2 border-blue-600 pb-1 font-medium text-blue-600">
                Dashboard
              </span>
              <Link href="/ngo-dashboard/inspections" className="hover:text-gray-900">
                Inspections
              </Link>
              <Link href="/ngo-dashboard/reports" className="hover:text-gray-900">
                Reports
              </Link>
              <Link href="/ngo-dashboard/institutes" className="hover:text-gray-900">
                Institutes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-gray-700">
            <Bell className="h-5 w-5" />
            <CircleUserRound className="h-6 w-6" />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-8">
          {error && (
            <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          {!loading && institutes.length === 0 && !error && (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
              <p className="text-gray-600">
                No institutes registered yet under your organization.
              </p>
              <Link
                href="/ngo-dashboard/register"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Register a new institute
              </Link>
            </div>
          )}

          {institutes.length > 0 && (
            <>
              {/* Page header */}
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Institute Overview</h1>
                    {institutes.length > 1 && (
                      <div className="relative">
                        <select
                          value={instituteId ?? ''}
                          onChange={(e) => setInstituteId(e.target.value)}
                          className="appearance-none rounded-md border border-gray-300 bg-white py-1 pl-3 pr-8 text-sm"
                        >
                          {institutes.map((inst) => (
                            <option key={inst.id} value={inst.id}>
                              {inst.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-sm text-gray-500">
                    ID: {shortInstituteCode(institute?.id)} &nbsp;|&nbsp; Last Synced:{' '}
                    {lastSynced ? timeAgo(lastSynced) : '—'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="group relative">
                    <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Quick Actions
                    </button>
                    <div className="invisible absolute right-0 z-10 mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                      {QUICK_ACTIONS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <item.icon className="h-4 w-4 text-gray-400" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => loadInstituteData(instituteId)}
                    disabled={syncing}
                    className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    Sync Data
                  </button>
                </div>
              </div>

              {/* Stat cards */}
              <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-gray-500">
                      CURRENT RISK LEVEL
                    </span>
                    <ShieldCheck className={`h-5 w-5 ${riskStyle.dot}`} />
                  </div>
                  <p className={`text-4xl font-bold ${riskStyle.text}`}>
                    {riskScore?.band ?? 'LOW'}{' '}
                    <span className="text-base font-normal text-gray-500">
                      {riskStyle.label}
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-gray-500">
                      ACTIVE CCTV CAMERAS
                    </span>
                    <Video className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold">
                    {cameraOnlineCount}/{cameras.length}{' '}
                    <span className="text-base font-normal text-gray-500">Online</span>
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: cameras.length
                          ? `${(cameraOnlineCount / cameras.length) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-gray-500">
                      TODAY&apos;S ATTENDANCE
                    </span>
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-4xl font-bold">
                    {todayAttendance?.reported_count ?? '—'}
                    {attendanceTarget && (
                      <span className="text-base font-normal text-gray-500">
                        {' '}
                        /{attendanceTarget}
                      </span>
                    )}
                  </p>
                  {attendanceTarget && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${Math.min(
                            100,
                            ((todayAttendance?.reported_count ?? 0) / attendanceTarget) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Analytics + Compliance */}
              <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-bold">Attendance Analytics (7 Days)</h2>
                  <div className="h-64">
                    {chartData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                          <defs>
                            <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#2563eb"
                            strokeWidth={2}
                            fill="url(#attendanceFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        No attendance submitted in the last 7 days.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Compliance Alerts</h2>
                    {alerts.length > 0 && (
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                        {alerts.length} PENDING
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {alerts.length === 0 && (
                      <p className="text-sm text-gray-500">No open compliance items.</p>
                    )}
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-800">
                            {alert.type.replace(/_/g, ' ')}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-600">{alert.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/ngo-dashboard/actions"
                    className="mt-5 block rounded-md border border-gray-200 py-2 text-center text-sm font-medium text-blue-600 hover:bg-gray-50"
                  >
                    View All Notices
                  </Link>
                </div>
              </div>

              {/* CCTV + Inspections */}
              <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 border-b border-gray-100 pb-3 text-lg font-bold">
                    CCTV Health Matrix
                  </h2>
                  {cameras.length === 0 ? (
                    <p className="text-sm text-gray-500">No cameras registered.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {cameras.map((cam, idx) => {
                        const status = cam.latestStatus?.status;
                        const hours = cam.latestStatus?.active_hours_today;
                        const degraded =
                          status === 'online' &&
                          typeof hours === 'number' &&
                          hours < CAMERA_HEALTH_THRESHOLD_HOURS;
                        const dotColor =
                          status === 'offline'
                            ? 'bg-red-500'
                            : degraded
                            ? 'bg-amber-500'
                            : 'bg-emerald-500';
                        return (
                          <div
                            key={cam.id}
                            className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2.5"
                          >
                            <span className="flex items-center gap-2 text-sm">
                              <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                              {cam.label}
                            </span>
                            <span className="font-mono text-xs text-gray-400">
                              CH-{String(idx + 1).padStart(2, '0')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                    <h2 className="text-lg font-bold">Upcoming Inspections</h2>
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                  </div>
                  {upcomingInspections.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No scheduled inspections on the calendar right now.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingInspections.map((insp) => (
                        <div key={insp.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase text-blue-600">
                              {formatDate(insp.assigned_at)}
                            </p>
                            <p className="text-sm text-gray-800">
                              Scheduled Inspection
                            </p>
                          </div>
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                            {insp.status === 'assigned' ? 'Scheduled' : 'In progress'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-xs text-gray-400">
                    Surprise inspections are not shown here in advance — inspectors verify
                    on arrival.
                  </p>
                </div>
              </div>

              {/* Recent reports */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Recent Reports</h2>
                  <Link
                    href="/ngo-dashboard/reports"
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                  >
                    View Archive <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {recentReports.length === 0 ? (
                  <p className="text-sm text-gray-500">No inspection reports yet.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                        <th className="pb-2 font-medium">Report ID</th>
                        <th className="pb-2 font-medium">Type</th>
                        <th className="pb-2 font-medium">Submitted Date</th>
                        <th className="pb-2 font-medium">Inspector</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((report) => (
                        <tr key={report.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-3 font-mono text-gray-500">
                            RPT-{report.id.replace(/-/g, '').slice(0, 4).toUpperCase()}
                          </td>
                          <td className="py-3 capitalize text-gray-800">
                            {report.inspections?.type
                              ? `${report.inspections.type} inspection`
                              : 'Inspection report'}
                          </td>
                          <td className="py-3 text-gray-600">{formatDate(report.submitted_at)}</td>
                          <td className="py-3 text-gray-600">
                            {report.inspections?.inspectors?.users?.full_name ?? '—'}
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                                report.declaration_confirmed
                                  ? 'border-emerald-200 text-emerald-600'
                                  : 'border-gray-200 text-gray-500'
                              }`}
                            >
                              {report.declaration_confirmed ? 'VERIFIED' : 'UNDER REVIEW'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </main>

        <footer className="border-t border-gray-200 bg-gray-50 px-8 py-5">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row">
            <p className="font-semibold text-gray-700">Sovereign Watch</p>
            <p>© 2024 Government AI Monitoring Authority. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-700">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700">Support Center</a>
              <a href="#" className="hover:text-gray-700">Terms of Service</a>
              <a href="#" className="hover:text-gray-700">Security Protocols</a>
            </div>
          </div>
        </footer>
      </div>
    </RoleGuard>
  );
}