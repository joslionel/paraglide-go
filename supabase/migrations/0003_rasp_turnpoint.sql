-- Admin-only field (no app UI to edit it — set directly via SQL Editor /
-- Table Editor) linking a site to its nearest RASP turnpoint, so the site
-- detail modal can link out to rasp.stratus.org.uk for that point.
alter table sites
  add column if not exists rasp_turnpoint text;
