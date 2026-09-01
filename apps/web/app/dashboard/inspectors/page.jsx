// FILE: apps/web/app/dashboard/inspectors/page.jsx
'use client';

import { useEffect, useState } from 'react';
import RoleGuard from '../../../lib/RoleGuard';
import { supabase } from '../../../lib/supabaseClient';

function InspectorRegistry() {
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [unlinkedUsers, setUnlinkedUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [homeRegion, setHomeRegion] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [creating, setCreating] = useState(false);

  const loadInspectors = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('inspectors')
      .select('id, user_id, home_region, specialization, availability_status, current_workload, users(full_name, email, phone)')
      .order('current_workload', { ascending: true });

    if (fetchError) setError(fetchError.message);
    setInspectors(data || []);
    setLoading(false);
  };

  const loadUnlinkedUsers = async () => {
    const { data: allInspectorUsers } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'inspector');

    const { data: linked } = await supabase.from('inspectors').select('user_id');
    const linkedIds = new Set((linked || []).map((i) => i.user_id));

    setUnlinkedUsers((allInspectorUsers || []).filter((u) => !linkedIds.has(u.id)));
  };

  useEffect(() => {
    loadInspectors();
    loadUnlinkedUsers();
  }, []);

  const toggleAvailability = async (inspector) => {
    const next = inspector.availability_status === 'available' ? 'unavailable' : 'available';
    const { error: updateError } = await supabase
      .from('inspectors')
      .update({ availability_status: next })
      .eq('id', inspector.id);

    if (!updateError) loadInspectors();
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !homeRegion) return;
    setCreating(true);
    setError('');

    const { error: insertError } = await supabase.from('inspectors').insert({
      user_id: selectedUserId,
      home_region: homeRegion,
      specialization: specialization || null,
    });

    setCreating(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSelectedUserId('');
    setHomeRegion('');
    setSpecialization('');
    loadInspectors();
    loadUnlinkedUsers();
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-xl font-semibold">Inspector Registry</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-8 rounded border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-medium">Add Inspector Profile</h2>
        {unlinkedUsers.length === 0 ? (
          <p className="text-sm text-gray-500">
            No unlinked inspector-role users found. Ask the person to sign up with the "Inspector" role first.
          </p>
        ) : (
          <form onSubmit={handleCreateProfile} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm sm:col-span-2"
              required
            >
              <option value="">Select user...</option>
              {unlinkedUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Home region / district"
              value={homeRegion}
              onChange={(e) => setHomeRegion(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Specialization (optional)"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:col-span-4"
            >
              {creating ? 'Adding...' : 'Add Inspector Profile'}
            </button>
          </form>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-2">Name</th>
              <th className="py-2">Home Region</th>
              <th className="py-2">Specialization</th>
              <th className="py-2">Workload</th>
              <th className="py-2">Availability</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {inspectors.map((inspector) => (
              <tr key={inspector.id} className="border-b border-gray-100">
                <td className="py-2">{inspector.users?.full_name || '—'}</td>
                <td className="py-2">{inspector.home_region || '—'}</td>
                <td className="py-2">{inspector.specialization || '—'}</td>
                <td className="py-2">{inspector.current_workload}</td>
                <td className="py-2">
                  <span
                    className={
                      inspector.availability_status === 'available'
                        ? 'rounded bg-green-100 px-2 py-0.5 text-xs text-green-700'
                        : 'rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600'
                    }
                  >
                    {inspector.availability_status}
                  </span>
                </td>
                <td className="py-2">
                  <button onClick={() => toggleAvailability(inspector)} className="text-xs text-blue-600 hover:underline">
                    Toggle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function InspectorRegistryPage() {
  return (
    <RoleGuard allowedRoles={['government', 'pmu', 'system_admin']}>
      <InspectorRegistry />
    </RoleGuard>
  );
}