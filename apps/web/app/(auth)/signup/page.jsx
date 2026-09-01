'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ChevronDown,
  User,
  Lock,
  ShieldCheck,
  Activity,
  ClipboardCheck,
  ShieldAlert,
  CheckCircle2,
  Bell,
  CircleUserRound,
  UserRoundCheck,
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { dashboardPathForRole } from '../../../lib/getUserRole';

// TEMP FOR DEMO ONLY: real deployment should not let organizations self-assign
// a type that grants elevated dashboard access (e.g. government/system_admin).
// Those should be provisioned by an Admin after manual verification.
const ORG_TYPE_OPTIONS = [
  { value: '', label: 'Select Type' },
  { value: 'government', label: 'Government Agency' },
  { value: 'ngo', label: 'NGO / Non-Profit' },
  { value: 'research_institute', label: 'Research Institute' },
  { value: 'private_sector', label: 'Private Sector' },
  { value: 'academic', label: 'Academic Institution' },
];

function passwordStrength(password) {
  if (!password) return { label: '', percent: 0, color: 'bg-gray-200' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;

  if (score <= 1) return { label: 'Weak', percent: 20, color: 'bg-red-500' };
  if (score <= 3) return { label: 'Moderate', percent: 45, color: 'bg-amber-500' };
  return { label: 'Strong', percent: 100, color: 'bg-emerald-500' };
}

export default function SignupPage() {
  const router = useRouter();

  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');

  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

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

    const { error: insertError } = await supabase.from('organizations').insert({
      id: userId,
      organization_name: orgName,
      organization_type: orgType,
      registration_number: registrationNumber,
      contact_full_name: fullName,
      contact_designation: designation,
      contact_email: email,
      contact_phone: phone,
      role: orgType,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(dashboardPathForRole(orgType));
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top nav */}
      <header className="flex items-center justify-between border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-10">
          <span className="text-lg font-bold tracking-tight">Sovereign Watch</span>
          <nav className="flex items-center gap-7 text-sm text-gray-700">
            <a href="#" className="hover:text-gray-900">Dashboard</a>
            <a href="#" className="hover:text-gray-900">Inspections</a>
            <a href="#" className="hover:text-gray-900">Reports</a>
            <a href="#" className="hover:text-gray-900">Institutes</a>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-gray-700">
          <Bell className="h-5 w-5" />
          <CircleUserRound className="h-6 w-6" />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
        {/* Form card */}
        <form
          onSubmit={handleSignup}
          className="rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 bg-gray-50 px-8 py-7">
            <h1 className="text-2xl font-bold">Register Your Organization</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-600">
              Complete the form below to initiate the secure onboarding process for
              Sovereign Watch monitoring integration.
            </p>
          </div>

          {error && (
            <p className="mx-8 mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="px-8 py-7">
            {/* Organization details */}
            <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Building2 className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold">Organization Details</h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-gray-700">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Global Tech Institute"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-gray-700">
                  Organization Type
                </label>
                <div className="relative">
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    required
                    className="w-full appearance-none rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    {ORG_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-sm text-gray-700">
                Registration Number (ID)
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="SW-XXXX-YYYY"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>

            {/* Primary contact */}
            <div className="mb-3 mt-9 flex items-center gap-2 border-b border-gray-100 pb-3">
              <User className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold">Primary Contact</h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-gray-700">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-gray-700">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-gray-700">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
            </div>

            {/* Security setup */}
            <div className="mb-3 mt-9 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Lock className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold">Security Setup</h2>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-sm text-gray-700">
                Create Master Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />

              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all ${strength.color}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs text-gray-500">
                  {strength.label}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Requires 12+ characters, numbers, and symbols for high security.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-8 py-6">
            <a href="/login" className="text-sm text-blue-600 hover:underline">
              Already have an account? Log in
            </a>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <UserRoundCheck className="h-4 w-4" />
              {loading ? 'Registering...' : 'Register Organization'}
            </button>
          </div>
        </form>

        {/* Sidebar */}
        <aside className="h-fit rounded-xl border border-gray-200 bg-gray-50 p-7">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gray-900" />
            <h3 className="text-base font-bold">Why Register?</h3>
          </div>

          <div className="space-y-6">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Real-time Monitoring</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  Gain immediate access to live telemetry and integrity checksums
                  for all deployed AI assets within your jurisdiction.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Streamlined Compliance</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  Automate reporting and simplify auditing with built-in
                  regulatory checklists and unalterable evidence logs.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
                <ShieldAlert className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Sovereign Security</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  Operate within a highly secure, government-grade environment
                  ensuring data sovereignty and strict access controls.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold">System Status</p>
              <p className="font-mono text-xs text-emerald-600">
                Registration Gateway Online
              </p>
            </div>
          </div>
        </aside>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50 px-8 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row">
          <p>© 2024 Government AI Monitoring Authority. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-700">Privacy Policy</a>
            <a href="#" className="hover:text-gray-700">Support Center</a>
            <a href="#" className="hover:text-gray-700">Terms of Service</a>
            <a href="#" className="hover:text-gray-700">Security Protocols</a>
          </div>
        </div>
      </footer>
    </div>
  );
}