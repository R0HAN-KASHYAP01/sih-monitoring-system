-- FILE: supabase/migrations/0003_notifications_and_audit_logs.sql

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  type text not null,
  payload jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Users read their own notifications"
on notifications for select
using (auth.uid() = user_id);

create policy "Users mark their own notifications read"
on notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- No public insert policy: only the server (service role) creates notifications.


-- FILE: supabase/migrations/0003_notifications_and_audit_logs.sql (append to same file)

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  created_at timestamptz default now()
);

alter table audit_logs enable row level security;

create policy "Government reads all audit logs"
on audit_logs for select
using (
  exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);

-- Trigger function: logs any status change on institutes
create or replace function log_institute_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_logs (actor_id, action, entity_type, entity_id, before, after)
    values (
      auth.uid(),
      'institute_status_changed',
      'institutes',
      new.id,
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger institutes_status_audit
after update on institutes
for each row execute function log_institute_status_change();