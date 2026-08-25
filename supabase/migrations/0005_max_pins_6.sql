-- Raise the pin cap from 5 to 6 — the combined wind rose has room for a 6th
-- ring without crowding, so there's no reason to hold the UI limit below it.
drop policy "members can pin up to 5 sites" on pinned_sites;

create policy "members can pin up to 6 sites" on pinned_sites
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (select count(*) from pinned_sites p where p.user_id = auth.uid()) < 6
  );
