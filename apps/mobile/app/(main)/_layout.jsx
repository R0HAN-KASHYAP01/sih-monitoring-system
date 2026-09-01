// FILE: apps/mobile/app/(main)/_layout.jsx

import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../lib/useSession';
import { supabase } from '../../lib/supabaseClient';

export default function MainLayout() {
  const { session, role, loading } = useSession();

  useEffect(() => {
    // Only sign out once we're SURE the role check finished and failed —
    // never sign out while role is still loading, or we recreate the same race.
    if (!loading && session && role !== null && role !== 'inspector') {
      supabase.auth.signOut();
    }
  }, [loading, session, role]);

  if (loading) return null; // could show a spinner here

  if (!session) return <Redirect href="/login" />;
  if (role !== 'inspector') return null; // signOut triggers redirect via root layout

  return <Stack screenOptions={{ headerShown: false }} />;
}