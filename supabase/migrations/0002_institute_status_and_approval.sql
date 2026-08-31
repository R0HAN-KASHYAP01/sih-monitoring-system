-- FILE: supabase/migrations/0002_institute_status_and_approval.sql

alter table institutes
  alter column status set default 'pending';

alter table institutes
  add constraint institutes_status_check
  check (status in ('pending', 'approved', 'rejected', 'active', 'flagged', 'under_inspection', 'closed'));

alter table institutes
  add column approved_by uuid references users(id),
  add column approved_at timestamptz,
  add column rejection_reason text;