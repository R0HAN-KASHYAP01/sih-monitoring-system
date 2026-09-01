"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const ROLES = [
  { key: "official", label: "Official", emailLabel: "Official Email Address", placeholder: "id@gov.example.com" },
  { key: "inspector", label: "Inspector", emailLabel: "Inspector Email Address", placeholder: "id@inspector.example.com" },
  { key: "ngo_admin", label: "NGO Admin", emailLabel: "NGO Admin Email Address", placeholder: "id@ngo.example.com" },
];

// Where each role lands after a successful sign-in.
// Adjust these to match your actual dashboard routes.
const ROLE_REDIRECTS = {
  official: "/dashboard",
  inspector: "/inspector-notice",
  ngo_admin: "/ngo-dashboard",
};

function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 2 4 5v6c0 5 3.5 8.7 8 11 4.5-2.3 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function LoginArrowIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5" />
    </svg>
  );
}

function CheckBadgeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3L16 10" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("official");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeRole = ROLES.find((r) => r.key === role);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Look up the signed-in user's role so we can route them to the right
    // part of the app. Adjust "profiles" / "role" to match your schema,
    // or swap this block for your existing lib/getUserRole.js helper.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const resolvedRole = profile?.role ?? role;
    setLoading(false);
    router.push(ROLE_REDIRECTS[resolvedRole] ?? "/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left panel */}
        <div className="hidden lg:flex relative flex-col justify-between bg-slate-950 text-white p-12 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.15), transparent 45%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <ShieldIcon className="h-6 w-6" />
              Sovereign Watch
            </div>

            <h1 className="mt-10 text-4xl font-bold leading-tight max-w-md">
              Continuous Monitoring for Institutional Integrity
            </h1>
            <p className="mt-4 max-w-sm text-slate-300">
              Secure, real-time AI-driven oversight. Ensuring compliance, transparency, and
              actionable intelligence across all institutional operations.
            </p>

            <div className="mt-10 flex gap-10 border-t border-slate-800 pt-6 max-w-sm">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <CheckBadgeIcon className="h-4 w-4" />
                  Encrypted
                </div>
                <p className="mt-1 text-xs text-slate-400">End-to-End Security</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <CheckBadgeIcon className="h-4 w-4" />
                  Auditable
                </div>
                <p className="mt-1 text-xs text-slate-400">Immutable Logs</p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            © 2026 Sovereign Watch. All Rights Reserved. Authorized Access Only.
          </p>
        </div>

        {/* Right panel */}
        <div className="flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
            <p className="mt-1 text-sm text-slate-500">Access your secure dashboard.</p>

            <div className="mt-6 flex border-b border-slate-200">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className={`flex-1 pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    role === r.key
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  {activeRole.emailLabel}
                </label>
                <div className="mt-1.5 relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeRole.placeholder}
                    className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Secure Password
                </label>
                <div className="mt-1.5 relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                <LoginArrowIcon className="h-4 w-4" />
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
              New Organization?{" "}
              <Link href="/ngo-dashboard/register" className="font-medium text-blue-600 hover:text-blue-700">
                Request Account Access
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-8 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <p>© 2026 Government AI Monitoring Authority. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-700">Privacy Policy</Link>
            <Link href="/support" className="hover:text-slate-700">Support Center</Link>
            <Link href="/terms" className="hover:text-slate-700">Terms of Service</Link>
            <Link href="/security" className="hover:text-slate-700">Security Protocols</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}