'use client';

import { useEffect, useState } from 'react';
import RoleGuard from '../../lib/RoleGuard';
import { supabase } from '../../lib/supabaseClient';

function InstituteList() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading institutes...</p>;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-semibold">Registered Institutes</h1>

      {institutes.length === 0 ? (
        <p className="text-sm text-gray-500">No institutes registered yet.</p>
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
            {institutes.map((inst) => (
              <tr key={inst.id} className="border-b">
                <td className="py-2">{inst.name}</td>
                <td className="py-2">{inst.region}</td>
                <td className="py-2">{inst.state}</td>
                <td className="py-2">{inst.district}</td>
                <td className="py-2">{inst.status}</td>
                <td className="py-2 text-gray-400">— (Slice 2)</td>
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