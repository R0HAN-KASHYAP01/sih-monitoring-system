-- FILE: supabase/policies.sql (append)

create policy "Government can update institute status"
on institutes for update
using (
  exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
)
with check (
  exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);

-- FILE: supabase/policies.sql (append)

alter table attendance enable row level security;
alter table reports enable row level security;
alter table cctv_cameras enable row level security;
alter table cctv_status_log enable row level security;

-- Only approved/active institutes should be receiving data — enforced in app code (Step 2),
-- RLS here just enforces "your own institute only" for NGO roles.

create policy "Org inserts own attendance"
on attendance for insert
with check (institute_id in (
  select id from institutes where organization_id in (select organization_id from users where id = auth.uid())
));

create policy "Org reads own attendance, gov reads all"
on attendance for select
using (
  institute_id in (select id from institutes where organization_id in (select organization_id from users where id = auth.uid()))
  or exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);

create policy "Org inserts own reports"
on reports for insert
with check (institute_id in (
  select id from institutes where organization_id in (select organization_id from users where id = auth.uid())
));

create policy "Org reads own reports, gov reads all"
on reports for select
using (
  institute_id in (select id from institutes where organization_id in (select organization_id from users where id = auth.uid()))
  or exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);

create policy "Org inserts own cameras"
on cctv_cameras for insert
with check (institute_id in (
  select id from institutes where organization_id in (select organization_id from users where id = auth.uid())
));

create policy "Org reads own cameras, gov reads all"
on cctv_cameras for select
using (
  institute_id in (select id from institutes where organization_id in (select organization_id from users where id = auth.uid()))
  or exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);

create policy "Org inserts own cctv status"
on cctv_status_log for insert
with check (camera_id in (
  select id from cctv_cameras where institute_id in (
    select id from institutes where organization_id in (select organization_id from users where id = auth.uid())
  )
));

create policy "Org reads own cctv status, gov reads all"
on cctv_status_log for select
using (
  camera_id in (select id from cctv_cameras where institute_id in (
    select id from institutes where organization_id in (select organization_id from users where id = auth.uid())
  ))
  or exists (select 1 from users u where u.id = auth.uid() and u.role in ('government','pmu','system_admin'))
);