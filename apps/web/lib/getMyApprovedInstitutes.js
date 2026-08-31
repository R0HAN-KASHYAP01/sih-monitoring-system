// FILE: apps/web/lib/getMyApprovedInstitutes.js

import { supabase } from './supabaseClient';

// Only approved/active institutes should receive data uploads —
// this is where that rule is enforced, since RLS alone doesn't check institute status.
export async function getMyApprovedInstitutes() {
  const { data: { session } } = await supabase.auth.getSession();

  const { data: userRow } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', session.user.id)
    .single();

  const { data: institutes, error } = await supabase
    .from('institutes')
    .select('id, name')
    .eq('organization_id', userRow.organization_id)
    .in('status', ['approved', 'active']);

  if (error) throw error;
  return institutes || [];
}