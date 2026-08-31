import { supabase } from './supabaseClient';

// Ensures the logged-in NGO admin has an organization row, creating one if needed,
// and links it back onto their users row.
export async function getOrCreateOrganization(userId, orgName) {
  const { data: userRow } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (userRow?.organization_id) {
    return userRow.organization_id;
  }

  const { data: newOrg, error: orgError } = await supabase
  .from('organizations')
  .insert({ name: orgName, type: 'ngo', registration_status: 'pending', created_by: userId })
  .select()
  .single();

  if (orgError) throw orgError;

  const { error: linkError } = await supabase
    .from('users')
    .update({ organization_id: newOrg.id })
    .eq('id', userId);

  if (linkError) throw linkError;

  return newOrg.id;
}