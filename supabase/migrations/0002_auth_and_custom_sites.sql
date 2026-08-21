-- Adds member accounts on top of 0001_init.sql:
--   - open sites (members_only = false) stay publicly readable, everything
--     else requires a signed-in user
--   - signed-in members can add up to 5 of their own sites and edit the
--     name / wind window / notes on ANY site (collaborative, club-wiki style)
--   - referral_codes gates new-account creation for the request-access edge
--     function (service role only — no client policies, so RLS denies
--     everyone else by default)

alter table sites
  add column if not exists owner_id uuid references auth.users(id) on delete cascade,
  add column if not exists is_custom boolean not null default false;

create index if not exists sites_owner_id_idx on sites (owner_id);

-- Defense in depth: even if a policy is ever misconfigured, a custom site can
-- never be flagged open — it always requires sign-in to see.
alter table sites
  add constraint custom_sites_are_members_only check (not is_custom or members_only);

create table if not exists referral_codes (
  code text primary key,
  uses_remaining int, -- null = unlimited
  created_at timestamptz not null default now()
);

insert into referral_codes (code, uses_remaining)
values ('flymidwales', null)
on conflict (code) do nothing;

alter table referral_codes enable row level security;
-- No policies: only the service-role key (request-access edge function) can
-- read this table. RLS default-denies every other role, anon and authenticated alike.

drop policy if exists "sites are publicly readable" on sites;

create policy "open sites are publicly readable" on sites
  for select using (members_only = false);

create policy "signed-in members can read all sites" on sites
  for select to authenticated using (true);

create policy "members can add up to 5 of their own sites" on sites
  for insert to authenticated
  with check (
    is_custom = true
    and owner_id = auth.uid()
    and members_only = true
    and name is not null and length(trim(name)) > 0
    and wind_dir_min is not null and wind_dir_max is not null
    and lat is not null and lon is not null
    and (select count(*) from sites s where s.owner_id = auth.uid() and s.is_custom) < 5
  );

create policy "members can edit any site" on sites
  for update to authenticated using (true) with check (true);

-- Row policy above allows targeting any row, but column-level grants are the
-- actual gate on which fields an edit can touch — everything else (slug,
-- owner_id, is_custom, members_only, coordinates, ratings, ...) is untouchable
-- via the public API regardless of the row policy.
revoke update on sites from authenticated;
grant update (name, wind_dir_min, wind_dir_max, notes) on sites to authenticated;

create policy "members can delete their own custom sites" on sites
  for delete to authenticated using (owner_id = auth.uid() and is_custom = true);
