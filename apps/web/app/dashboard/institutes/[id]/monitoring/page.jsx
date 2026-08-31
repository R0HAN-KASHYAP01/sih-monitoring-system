// FILE: apps/web/app/dashboard/institutes/[id]/monitoring/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RoleGuard from '../../../../../lib/RoleGuard';
import { supabase } from '../../../../../lib/supabaseClient';

function InstituteMonitoringView() {
  const { id } = useParams();
  const [institute, setInstitute] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [reports, setReports] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [instRes, attRes, repRes, camRes] = await Promise.all([
        supabase.from('institutes').select('id, name, region, state, district, status').eq('id', id).single(),
        supabase.from('attendance').select('id, date, reported_count, historical_average')
          .eq('institute_id', id).order('date', { ascending: false }).limit(10),
        supabase.from('reports').select('id, content_text, similarity_score, created_at')
          .eq('institute_id', id).order('created_at', { ascending: false }).limit(10),
        supabase.from('cctv_cameras').select('id, label, cctv_status_log(status, checked_at)')
          .eq('institute_id', id),
      ]);

      setInstitute(instRes.data);
      setAttendance(attRes.data || []);
      setReports(repRes.data || []);
      setCameras(camRes.data || []);
      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading...</p>;
  if (!institute) return <p className="p-8 text-sm text-red-600">Institute not found.</p>;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-1 text-xl font-semibold">{institute.name}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {institute.region}, {institute.district}, {institute.state} — Status: {institute.status}
      </p>

      {/* Attendance */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold">Attendance (last 10)</h2>
        {attendance.length === 0 ? (
          <p className="text-sm text-gray-500">No attendance submitted yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Date</th>
                <th className="py-2">Reported</th>
                <th className="py-2">Historical Avg</th>
                <th className="py-2">Deviation</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => {
                const deviation = row.historical_average
                  ? Math.round((Math.abs(row.reported_count - row.historical_average) / row.historical_average) * 100)
                  : null;
                return (
                  <tr key={row.id} className="border-b">
                    <td className="py-2">{row.date}</td>
                    <td className="py-2">{row.reported_count}</td>
                    <td className="py-2">{row.historical_average ?? '—'}</td>
                    <td className={`py-2 ${deviation >= 30 ? 'font-medium text-orange-600' : ''}`}>
                      {deviation !== null ? `${deviation}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Reports */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold">Reports (last 10)</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500">No reports submitted yet.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded border border-gray-200 p-3 text-sm">
                <p className="mb-1 text-gray-500">{new Date(r.created_at).toLocaleString()}</p>
                <p>{r.content_text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* CCTV */}
      <section>
        <h2 className="mb-3 text-base font-semibold">CCTV Cameras</h2>
        {cameras.length === 0 ? (
          <p className="text-sm text-gray-500">No cameras registered.</p>
        ) : (
          <ul className="space-y-2">
            {cameras.map((cam) => {
              const latest = cam.cctv_status_log?.[0];
              const status = latest?.status || 'unknown';
              return (
                <li key={cam.id} className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm">
                  <span>{cam.label}</span>
                  <span className={status === 'online' ? 'text-green-600' : 'text-red-600'}>{status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
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