// FILE: apps/web/app/dashboard/pending/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '../../../lib/RoleGuard';
import { supabase } from '../../../lib/supabaseClient';

function PendingList() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('institutes')
      .select('id, name, region, state, district, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setInstitutes(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading...</p>;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-semibold">Pending Registrations</h1>

      {institutes.length === 0 ? (
        <p className="text-sm text-gray-500">No pending registrations.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">Name</th>
              <th className="py-2">Region</th>
              <th className="py-2">Submitted</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {institutes.map((inst) => (
              <tr key={inst.id} className="border-b">
                <td className="py-2">{inst.name}</td>
                <td className="py-2">{inst.region}, {inst.state}</td>
                <td className="py-2">{new Date(inst.created_at).toLocaleDateString()}</td>
                <td className="py-2">
                  <Link href={`/dashboard/institutes/${inst.id}`} className="text-blue-600 underline">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function PendingPage() {
  return (
    <RoleGuard allowedRoles={['government', 'pmu', 'system_admin']}>
      <PendingList />
    </RoleGuard>
  );
}