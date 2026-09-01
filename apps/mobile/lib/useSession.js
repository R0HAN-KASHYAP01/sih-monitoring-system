// FILE: apps/mobile/lib/useSession.js

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useSession() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setRole(null);
      return;
    }

    setRoleLoading(true);
    supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        setRole(error ? null : data?.role ?? null);
        setRoleLoading(false);
      });
  }, [session?.user?.id]);

  return { session, role, loading: session === undefined || (!!session && roleLoading) };
}