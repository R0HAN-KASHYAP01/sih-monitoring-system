// FILE: apps/mobile/app/_layout.jsx

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabaseClient';

export default function RootLayout() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still loading

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/dashboard');
    }
  }, [session, segments]);

  if (session === undefined) return null; // could show a splash/loading screen here

  return <Stack screenOptions={{ headerShown: false }} />;
}