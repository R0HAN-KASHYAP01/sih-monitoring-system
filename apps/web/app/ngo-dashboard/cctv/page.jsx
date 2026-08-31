// FILE: apps/web/app/ngo-dashboard/cctv/page.jsx
'use client';

import { useEffect, useState } from 'react';
import RoleGuard from '../../../lib/RoleGuard';
import { supabase } from '../../../lib/supabaseClient';
import { getMyApprovedInstitutes } from '../../../lib/getMyApprovedInstitutes';

function CctvManager() {
  const [institutes, setInstitutes] = useState([]);
  const [instituteId, setInstituteId] = useState('');
  const [cameras, setCameras] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getMyApprovedInstitutes().then(setInstitutes).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!instituteId) {
      setCameras([]);
      return;
    }
    loadCameras();
  }, [instituteId]);

  const loadCameras = async () => {
    const { data } = await supabase
      .from('cctv_cameras')
      .select('id, label, cctv_status_log(status, checked_at)')
      .eq('institute_id', instituteId)
      .order('installed_at', { ascending: false });
    setCameras(data || []);
  };

  const handleAddCamera = async (e) => {
    e.preventDefault();
    setError('');

    const { error: insertError } = await supabase.from('cctv_cameras').insert({
      institute_id: instituteId,
      label: newLabel,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNewLabel('');
    loadCameras();
  };

  const toggleStatus = async (cameraId, currentStatus) => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';

    const { error: insertError } = await supabase.from('cctv_status_log').insert({
      camera_id: cameraId,
      status: newStatus,
      active_hours_today: newStatus === 'online' ? 16 : 0, // MVP placeholder value
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    loadCameras();
  };

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-xl font-semibold">CCTV Management</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6">
        <label className="mb-1 block text-sm text-gray-600">Institute</label>
        <select value={instituteId} onChange={(e) => setInstituteId(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="">Select an institute</option>
          {institutes.map((inst) => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </select>
      </div>

      {instituteId && (
        <>
          <form onSubmit={handleAddCamera} className="mb-6 flex gap-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Camera label (e.g. Main Hall)"
              required
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Add
            </button>
          </form>

          {cameras.length === 0 ? (
            <p className="text-sm text-gray-500">No cameras registered.</p>
          ) : (
            <ul className="space-y-2">
              {cameras.map((cam) => {
                const latest = cam.cctv_status_log?.[0];
                const status = latest?.status || 'unknown';
                return (
                  <li key={cam.id} className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm">
                    <span>{cam.label} — <span className={status === 'online' ? 'text-green-600' : 'text-red-600'}>{status}</span></span>
                    <button
                      onClick={() => toggleStatus(cam.id, status)}
                      className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                    >
                      Mark {status === 'online' ? 'Offline' : 'Online'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function CctvPage() {
  return (
    <RoleGuard allowedRoles={['ngo_admin', 'institute_admin']}>
      <CctvManager />
    </RoleGuard>
  );
}