// FILE: apps/web/app/ngo-dashboard/page.jsx
// (full replacement)

'use client';

import Link from 'next/link';
import RoleGuard from '../../lib/RoleGuard';

const NAV_ITEMS = [
  { href: '/ngo-dashboard/register', label: '+ Register a new institute' },
  { href: '/ngo-dashboard/attendance', label: 'Submit Attendance' },
  { href: '/ngo-dashboard/attendance/history', label: 'View Attendance History' },
  { href: '/ngo-dashboard/reports', label: 'Submit a Report' },
  { href: '/ngo-dashboard/cctv', label: 'Manage CCTV' },
];

export default function NgoDashboard() {
  return (
    <RoleGuard allowedRoles={['ngo_admin', 'institute_admin']}>
      <div className="p-8">
        <h1 className="mb-6 text-xl font-semibold">NGO / Institute Dashboard</h1>

        <ul className="space-y-3">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-blue-600 underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </RoleGuard>
  );
}