// FILE: apps/web/app/ngo-dashboard/attendance/page.jsx
'use client';

import { useEffect, useState } from 'react';
import RoleGuard from '../../../lib/RoleGuard';
import { supabase } from '../../../lib/supabaseClient';
import { getMyApprovedInstitutes } from '../../../lib/getMyApprovedInstitutes';

function AttendanceUploadForm() {
  const [institutes, setInstitutes] = useState([]);
  const [instituteId, setInstituteId] = useState('');
  const [date, setDate] = useState('');
  const [reportedCount, setReportedCount] = useState('');
  const [historicalAverage, setHistoricalAverage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMyApprovedInstitutes().then(setInstitutes).catch((err) => setError(err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    const { error: insertError } = await supabase.from('attendance').insert({
      institute_id: instituteId,
      date,
      reported_count: parseInt(reportedCount, 10),
      historical_average: historicalAverage ? parseFloat(historicalAverage) : null,
      submitted_by: session.user.id,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess('Attendance submitted.');
    setReportedCount('');
    setDate('');
  };

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-xl font-semibold">Daily Attendance</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Institute</label>
          <select value={instituteId} onChange={(e) => setInstituteId(e.target.value)} required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select an institute</option>
            {institutes.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Reported attendance count</label>
          <input type="number" min="0" value={reportedCount} onChange={(e) => setReportedCount(e.target.value)} required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">
            Historical average (optional — used later by the risk engine)
          </label>
          <input type="number" min="0" step="0.1" value={historicalAverage} onChange={(e) => setHistoricalAverage(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Attendance'}
        </button>
      </form>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <RoleGuard allowedRoles={['ngo_admin', 'institute_admin']}>
      <AttendanceUploadForm />
    </RoleGuard>
  );
}