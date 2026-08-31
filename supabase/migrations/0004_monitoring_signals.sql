-- FILE: supabase/migrations/0004_monitoring_signals.sql

create table attendance (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id) not null,
  date date not null,
  reported_count int not null,
  historical_average numeric,
  source text default 'manual_upload',
  submitted_by uuid references users(id),
  created_at timestamptz default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id) not null,
  submitted_by uuid references users(id),
  content_text text not null,
  similarity_score numeric,
  created_at timestamptz default now()
);

create table cctv_cameras (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid references institutes(id) not null,
  label text not null,
  installed_at timestamptz default now()
);

create table cctv_status_log (
  id uuid primary key default gen_random_uuid(),
  camera_id uuid references cctv_cameras(id) not null,
  status text not null check (status in ('online', 'offline')),
  active_hours_today numeric,
  checked_at timestamptz default now()
);