// FILE: apps/web/app/dashboard/page.jsx
// (full replacement of the InstituteList function)

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '../../lib/RoleGuard';
import { supabase } from '../../lib/supabaseClient';

function InstituteList() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  useEffect(() => {
    supabase
      .from('institutes')
      .select('id, name, region, state, district, status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setInstitutes(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = institutes.filter((inst) => {
    const matchesState = stateFilter ? inst.state?.toLowerCase().includes(stateFilter.toLowerCase()) : true;
    const matchesDistrict = districtFilter ? inst.district?.toLowerCase().includes(districtFilter.toLowerCase()) : true;
    return matchesState && matchesDistrict;
  });

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading institutes...</p>;

  return (
    <div className="p-8">
      <Link href="/dashboard/pending" className="mb-4 inline-block text-sm text-blue-600 underline">
        View Pending Registrations →
      </Link>

      <h1 className="mb-4 text-xl font-semibold">Registered Institutes</h1>

      <div className="mb-4 flex gap-4">
        <input
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          placeholder="Filter by state"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          placeholder="Filter by district"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No institutes match this filter.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">Name</th>
              <th className="py-2">Region</th>
              <th className="py-2">State</th>
              <th className="py-2">District</th>
              <th className="py-2">Status</th>
              <th className="py-2">Risk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inst) => (
              <tr key={inst.id} className="border-b">
                <td className="py-2">
                  <Link href={`/dashboard/institutes/${inst.id}/monitoring`} className="text-blue-600 underline">
                    {inst.name}
                  </Link>
                </td>
                <td className="py-2">{inst.region}</td>
                <td className="py-2">{inst.state}</td>
                <td className="py-2">{inst.district}</td>
                <td className="py-2">{inst.status}</td>
                <td className="py-2 text-gray-400">— (Phase 5)</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function GovDashboard() {
  return (
    <RoleGuard allowedRoles={['government', 'pmu', 'system_admin']}>
      <InstituteList />
    </RoleGuard>
  );
}