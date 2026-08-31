create table users (
  id uuid primary key references auth.users(id),
  role text not null,
  full_name text,
  email text,
  phone text,
  organization_id uuid,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  parent_organization_id uuid references organizations(id),
  registration_status text default 'pending',
  approved_by uuid references users(id),
  created_at timestamptz default now()
);

create table schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  department text
);

create table institutes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  scheme_id uuid references schemes(id),
  name text not null,
  region text,
  state text,
  district text,
  latitude numeric,
  longitude numeric,
  status text default 'active',
  created_at timestamptz default now()
);

create table inspectors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  home_region text,
  specialization text,
  availability_status text default 'available',
  current_workload int default 0,
  created_at timestamptz default now()
);