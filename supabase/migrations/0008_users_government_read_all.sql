-- FILE: supabase/migrations/0008_users_government_read_all.sql

create policy "Government reads all users"
on users for select
using (
  exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);