-- FILE: supabase/migrations/0007_inspector_registry_rls.sql

alter table inspectors enable row level security;

create policy "Government manages all inspectors"
on inspectors for all
using (
  exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
)
with check (
  exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);

create policy "Inspector reads own profile"
on inspectors for select
using (user_id = auth.uid());