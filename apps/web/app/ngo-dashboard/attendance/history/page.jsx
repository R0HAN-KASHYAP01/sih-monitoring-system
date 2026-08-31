// FILE: apps/web/app/ngo-dashboard/attendance/history/page.jsx
'use client';

import { useEffect, useState } from 'react';
import RoleGuard from '../../../../lib/RoleGuard';
import { supabase } from '../../../../lib/supabaseClient';

function AttendanceHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('attendance')
      .select('id, date, reported_count, historical_average, institutes(name)')
      .order('date', { ascending: false })
      .then(({ data }) => {
        setRows(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading...</p>;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-semibold">Attendance History</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No attendance submitted yet.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">Institute</th>
              <th className="py-2">Date</th>
              <th className="py-2">Reported</th>
              <th className="py-2">Historical Avg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="py-2">{row.institutes?.name}</td>
                <td className="py-2">{row.date}</td>
                <td className="py-2">{row.reported_count}</td>
                <td className="py-2">{row.historical_average ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AttendanceHistoryPage() {
  return (
    <RoleGuard allowedRoles={['ngo_admin', 'institute_admin']}>
      <AttendanceHistory />
    </RoleGuard>
  );
}