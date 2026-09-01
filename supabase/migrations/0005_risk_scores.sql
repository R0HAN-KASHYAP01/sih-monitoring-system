-- FILE: supabase/migrations/0005_risk_scores.sql

create table risk_scores (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id) not null,
  score int not null,
  band text not null,
  reasons jsonb,
  trigger_source text,
  computed_at timestamptz default now()
);

alter table risk_scores enable row level security;

-- Only reads are exposed to normal users. Writes only happen via the
-- service-role key from the server (see supabaseAdmin.js) — this stops
-- anyone from faking their own institute's risk score from the browser.
create policy "Org and gov read risk scores"
on risk_scores for select
using (
  institute_id in (select id from institutes where organization_id in (select organization_id from users where id = auth.uid()))
  or exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);