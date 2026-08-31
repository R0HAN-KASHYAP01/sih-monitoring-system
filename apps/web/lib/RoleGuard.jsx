'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';
import { dashboardPathForRole } from './getUserRole';

export default function RoleGuard({ allowedRoles, children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: userRow, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !userRow) {
        router.replace('/login');
        return;
      }

      if (!allowedRoles.includes(userRow.role)) {
        // Logged in, but wrong role for this page — send them to their own dashboard
        router.replace(dashboardPathForRole(userRow.role));
        return;
      }

      setChecking(false);
    };

    checkAccess();
  }, [router, allowedRoles]);

  if (checking) {
    return <div className="p-8 text-sm text-gray-500">Checking access...</div>;
  }

  return children;
}