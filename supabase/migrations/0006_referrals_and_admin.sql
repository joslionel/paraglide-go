-- Self-service referral codes + an admin concept, on top of 0002:
--   - a `profiles` row per user carries their quotas (how many referral
--     codes / custom sites they're allowed) and an is_admin flag
--   - members can create their own referral codes (single-use invite
--     links) up to their quota; admins are unlimited
--   - the "5 custom sites" cap from 0002 becomes per-user (profiles.
--     custom_site_quota) instead of a literal, so admins can raise it for
--     specific members, and admins themselves are uncapped
--   - redeem_referral_code() makes validating-and-decrementing a code a
--     single atomic statement — the request-access edge function
--     previously did this as a separate select then update, which is
--     racy (two simultaneous redemptions of a 1-use code could both win)

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  referral_code_quota int not null default 5,
  custom_site_quota int not null default 5,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- security definer so policies can check "is this user an admin" without a
-- recursive-policy footgun (the function itself reads profiles as its
-- owner, bypassing RLS, rather than re-entering the calling policy).
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select p.is_admin from profiles p where p.id = auth.uid()), false);
$$;

create policy "users can read their own profile" on profiles
  for select to authenticated using (id = auth.uid());

create policy "admins can read all profiles" on profiles
  for select to authenticated using (is_admin());

create policy "admins can update quotas" on profiles
  for update to authenticated using (is_admin()) with check (is_admin());

-- Row policy above allows targeting any row, but column-level grants are the
-- actual gate on which fields an admin edit can touch — is_admin, email and
-- id stay untouchable via the public API regardless of the row policy (same
-- pattern as the "members can edit any site" column grant in 0002).
revoke update on profiles from authenticated;
grant update (referral_code_quota, custom_site_quota) on profiles to authenticated;

-- Auto-create a profile row for every new signup — is_admin is seeded here
-- from the email; there's no app UI to grant it afterwards (deliberately —
-- promote further admins directly via SQL Editor, same convention as the
-- rasp_turnpoint field in 0003).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, is_admin)
  values (new.id, new.email, new.email = 'joslionel@gmail.com')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill profiles for accounts that already existed before this migration.
insert into profiles (id, email, is_admin)
select id, email, email = 'joslionel@gmail.com' from auth.users
on conflict (id) do nothing;

alter table referral_codes
  add column if not exists created_by uuid references auth.users(id) on delete cascade;

create policy "members can view their own referral codes" on referral_codes
  for select to authenticated using (created_by = auth.uid() or is_admin());

create policy "members can create referral codes within quota" on referral_codes
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and uses_remaining = 1 -- self-created codes are always single-use invite links
    and length(code) between 4 and 64
    and (
      is_admin()
      or (select count(*) from referral_codes r where r.created_by = auth.uid()) < (select p.referral_code_quota from profiles p where p.id = auth.uid())
    )
  );

-- Replaces "members can add up to 5 of their own sites" — same checks, but
-- the quota is now per-user (profiles.custom_site_quota) instead of a
-- literal 5, and admins are uncapped.
drop policy if exists "members can add up to 5 of their own sites" on sites;

create policy "members can add sites within their quota" on sites
  for insert to authenticated
  with check (
    is_custom = true
    and owner_id = auth.uid()
    and members_only = true
    and name is not null and length(trim(name)) > 0
    and wind_dir_min is not null and wind_dir_max is not null
    and lat is not null and lon is not null
    and (
      is_admin()
      or (select count(*) from sites s where s.owner_id = auth.uid() and s.is_custom) < (select p.custom_site_quota from profiles p where p.id = auth.uid())
    )
  );

create or replace function redeem_referral_code(p_code text)
returns boolean
language sql
as $$
  with updated as (
    update referral_codes
    set uses_remaining = case when uses_remaining is null then null else uses_remaining - 1 end
    where code = p_code
      and (uses_remaining is null or uses_remaining > 0)
    returning 1
  )
  select exists(select 1 from updated);
$$;

revoke all on function redeem_referral_code(text) from public, anon, authenticated;
grant execute on function redeem_referral_code(text) to service_role;
