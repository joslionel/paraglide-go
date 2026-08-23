-- Up to 5 pinned sites per member, for the "My Dashboard" tab (7-day grid +
-- combined wind rose). Many-to-many (user x site), so this is its own join
-- table rather than a column anywhere — a site isn't "owned" by being pinned,
-- and multiple members pin different sites independently.
create table if not exists pinned_sites (
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null references sites(slug) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, slug)
);

alter table pinned_sites enable row level security;

create policy "members can view their own pins" on pinned_sites
  for select to authenticated using (user_id = auth.uid());

create policy "members can pin up to 5 sites" on pinned_sites
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (select count(*) from pinned_sites p where p.user_id = auth.uid()) < 5
  );

create policy "members can unpin their own sites" on pinned_sites
  for delete to authenticated using (user_id = auth.uid());
