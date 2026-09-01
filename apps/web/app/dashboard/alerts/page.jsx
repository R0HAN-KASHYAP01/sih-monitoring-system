// FILE: apps/web/app/dashboard/alerts/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '../../../lib/RoleGuard';
import { supabase } from '../../../lib/supabaseClient';

const BAND_COLORS = {
  HIGH: 'bg-orange-50 text-orange-700 border border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border border-red-200',
};

function AlertFeed() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);

    const { data: institutes } = await supabase
      .from('institutes')
      .select('id, name, region, state, district');

    const withRisk = await Promise.all(
      (institutes || []).map(async (inst) => {
        const { data: riskRows } = await supabase
          .from('risk_scores')
          .select('score, band, reasons, computed_at')
          .eq('institute_id', inst.id)
          .order('computed_at', { ascending: false })
          .limit(1);

        return { ...inst, latestRisk: riskRows?.[0] || null };
      })
    );

    const highRisk = withRisk
      .filter((inst) => ['HIGH', 'CRITICAL'].includes(inst.latestRisk?.band))
      .sort((a, b) => b.latestRisk.score - a.latestRisk.score);

    setAlerts(highRisk);
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // Live updates: re-check alerts whenever a new risk score comes in
  useEffect(() => {
    const channel = supabase
      .channel('alerts_risk_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'risk_scores' }, () => {
        loadAlerts();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading alerts...</p>;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-semibold">High / Critical Risk Alerts</h1>

      {alerts.length === 0 ? (
        <p className="text-sm text-gray-500">No institutes currently at HIGH or CRITICAL risk.</p>
      ) : (
        <div className="space-y-4">
          {alerts.map((inst) => (
            <div key={inst.id} className={`rounded-lg p-4 ${BAND_COLORS[inst.latestRisk.band]}`}>
              <div className="mb-2 flex items-center justify-between">
                <Link href={`/dashboard/institutes/${inst.id}/monitoring`} className="font-semibold underline">
                  {inst.name}
                </Link>
                <span className="text-sm font-medium">{inst.latestRisk.score} · {inst.latestRisk.band}</span>
              </div>
              <p className="mb-2 text-xs text-gray-600">
                {inst.region}, {inst.district}, {inst.state}
              </p>
              {inst.latestRisk.reasons?.length > 0 && (
                <ul className="mb-3 list-disc pl-5 text-sm">
                  {inst.latestRisk.reasons.map((r, i) => (
                    <li key={i}>{r.detail}</li>
                  ))}
                </ul>
              )}
              <Link
                href={`/dashboard/institutes/${inst.id}/initiate-inspection`}
                className="inline-block rounded bg-white px-4 py-2 text-sm font-medium underline hover:bg-gray-50"
              >
                Initiate Inspection →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  return (
    <RoleGuard allowedRoles={['government', 'pmu', 'system_admin']}>
      <AlertFeed />
    </RoleGuard>
  );
}