create table if not exists packages (
  package_id text primary key,
  period_start date not null,
  period_end date not null,
  generated_at timestamptz not null,
  blob_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists attestation_events (
  id bigserial primary key,
  package_id text not null references packages(package_id) on delete cascade,
  employee_key text not null,
  employee_name text not null,
  worker_id text not null,
  event_type text not null,
  details text not null,
  created_at timestamptz not null default now()
);

create index if not exists attestation_events_package_id_idx on attestation_events(package_id);
create index if not exists attestation_events_employee_key_idx on attestation_events(employee_key);
