'use client';

import Link from 'next/link';
import RoleGuard from '../../lib/RoleGuard';

export default function NgoDashboard() {
  return (
    <RoleGuard allowedRoles={['ngo_admin', 'institute_admin']}>
      <div className="p-8">
        <h1 className="mb-4 text-xl">NGO / Institute Dashboard</h1>
        <Link href="/ngo-dashboard/register" className="text-blue-600 underline">
          + Register a new institute
        </Link>
      </div>
    </RoleGuard>
  );
}