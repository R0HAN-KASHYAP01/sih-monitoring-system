import { supabase } from './supabaseClient';

export async function getUserRole() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error) return null;
  return data.role;
}

export function dashboardPathForRole(role) {
  switch (role) {
    case 'government':
    case 'pmu':
    case 'system_admin':
      return '/dashboard';
    case 'ngo_admin':
    case 'institute_admin':
      return '/ngo-dashboard';
    case 'beneficiary':
      return '/beneficiary-home';
    case 'inspector':
      return '/inspector-notice'; // web has no inspector UI — mobile app only
    default:
      return '/login';
  }
}