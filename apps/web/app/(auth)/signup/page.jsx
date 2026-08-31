'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { dashboardPathForRole } from '../../../lib/getUserRole';

// TEMP FOR DEMO ONLY: real deployment should remove government/pmu/system_admin/inspector
// from self-service signup — those get created by an Admin instead.
const ROLE_OPTIONS = [
  { value: 'government', label: 'Government Official' },
  { value: 'pmu', label: 'PMU' },
  { value: 'ngo_admin', label: 'NGO / Institute Admin' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'beneficiary', label: 'Beneficiary' },
];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('beneficiary');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const userId = data.user.id;

    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      full_name: fullName,
      email,
      role,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(dashboardPathForRole(role));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-xl font-semibold text-gray-800">
          Create account
        </h1>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <label className="mb-1 block text-sm text-gray-600">Full name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm text-gray-600">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm text-gray-600">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm text-gray-600">Role (demo only)</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mb-6 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
    </div>
  );
}