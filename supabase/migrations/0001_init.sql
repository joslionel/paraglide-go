-- Mid-Wales Paragliding Conditions Dashboard schema.
-- Not yet wired up (v1 runs on local JSON — see src/lib/dataStore.ts) but kept
-- ready so switching to Supabase later is just: run this migration, set env
-- vars, and swap the two functions in dataStore.ts for real queries.

create table if not exists sites (
  slug text primary key,
  name text not null,
  grid_ref text,
  lat double precision,
  lon double precision,
  wind_dir_min smallint,
  wind_dir_max smallint,
  wind_speed_min_mph smallint,
  wind_speed_max_mph smallint,
  members_only boolean not null default false,
  hg_rating text,
  pg_rating text,
  liaison text,
  notes text not null default '',
  source_url text,
  missing_wind_dir boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists conditions_cache (
  slug text primary key references sites(slug) on delete cascade,
  updated_at timestamptz not null default now(),
  now jsonb,
  daily jsonb not null default '[]'::jsonb
);

alter table sites enable row level security;
alter table conditions_cache enable row level security;

-- Single shared read-only dashboard: anyone can read, nothing is publicly writable.
-- Writes come only from the scheduled refresh job using the service role key.
create policy "sites are publicly readable" on sites
  for select using (true);

create policy "conditions_cache is publicly readable" on conditions_cache
  for select using (true);
