-- FILE: supabase/migrations/0006_inspections.sql

create table inspections (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id) not null,
  inspector_id uuid references users(id), -- nullable until Phase 7 assigns one
  type text default 'surprise' check (type in ('surprise', 'scheduled')),
  status text default 'assigned' check (status in ('assigned', 'en_route', 'gps_verified', 'in_progress', 'submitted', 'pending_sync', 'synced', 'closed')),
  assignment_reason jsonb,
  gps_verified boolean default false,
  arrival_latitude numeric,
  arrival_longitude numeric,
  distance_from_institute_m numeric,
  initiated_by uuid references users(id),
  assigned_at timestamptz default now(),
  submitted_at timestamptz,
  synced_at timestamptz
);

alter table inspections enable row level security;

create policy "Government can create inspections"
on inspections for insert
with check (
  exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);

create policy "Government reads all inspections, org reads own institute's inspections"
on inspections for select
using (
  exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
  or institute_id in (select id from institutes where organization_id in (select organization_id from users where id = auth.uid()))
);

create policy "Government can update inspections"
on inspections for update
using (
  exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
)
with check (
  exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);

-- Extend the audit trigger pattern to inspections too
create or replace function log_inspection_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_logs (actor_id, action, entity_type, entity_id, before, after)
    values (
      auth.uid(),
      'inspection_status_changed',
      'inspections',
      new.id,
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger inspections_status_audit
after update on inspections
for each row execute function log_inspection_status_change();