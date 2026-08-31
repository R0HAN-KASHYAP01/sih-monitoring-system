'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { getOrCreateOrganization } from '../../../lib/getOrCreateOrganization';
import RoleGuard from '../../../lib/RoleGuard';

function RegisterInstituteForm() {
  const router = useRouter();
  const [schemes, setSchemes] = useState([]);
  const [orgName, setOrgName] = useState('');
  const [name, setName] = useState('');
  const [schemeId, setSchemeId] = useState('');
  const [region, setRegion] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('schemes').select('id, name').then(({ data }) => {
      if (data) setSchemes(data);
    });
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const orgId = await getOrCreateOrganization(session.user.id, orgName);

    // Check for duplicates BEFORE inserting
    const { data: existing } = await supabase
      .from('institutes')
      .select('id')
      .eq('organization_id', orgId)
      .ilike('name', name)
      .maybeSingle();

    if (existing) {
      setError('An institute with this name is already registered under your organization.');
      setLoading(false);
      return;
    }

    // Only insert if no duplicate was found
    const { error: instituteError } = await supabase.from('institutes').insert({
      organization_id: orgId,
      scheme_id: schemeId,
      name,
      region,
      state,
      district,
      status: 'active',
    });

    if (instituteError) throw instituteError;

    router.push('/ngo-dashboard');
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-xl font-semibold">Register Institute</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Organization name</label>
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)} required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Institute name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Scheme</label>
          <select value={schemeId} onChange={(e) => setSchemeId(e.target.value)} required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select a scheme</option>
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Region</label>
          <input value={region} onChange={(e) => setRegion(e.target.value)} required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600">State</label>
            <input value={state} onChange={(e) => setState(e.target.value)} required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">District</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Registering...' : 'Register Institute'}
        </button>
      </form>
    </div>
  );
}

export default function RegisterInstitutePage() {
  return (
    <RoleGuard allowedRoles={['ngo_admin', 'institute_admin']}>
      <RegisterInstituteForm />
    </RoleGuard>
  );
}