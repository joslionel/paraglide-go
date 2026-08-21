# Mid-Wales Paragliding Conditions Dashboard

Shows On / Marginal / Off flying status for Mid-Wales & Borders Soaring Club
sites, derived from Open-Meteo forecasts compared against each site's known
wind window — not a generic weather score.

## Status

Runs today on local JSON files, no login required — every site is visible,
same as before. Accounts, magic-link sign-in, and member-added/edited sites
are all built but dormant until a Supabase project is wired up (see
[SETUP.md](SETUP.md)); `src/lib/dataStore.ts` and `src/lib/supabaseClient.ts`
detect the presence of `.env` and switch modes automatically — nothing else
needs to change.

## Running it

```bash
npm install
npm run refresh   # fetch Open-Meteo forecasts, write public/conditions_cache.json
npm run dev        # start the dashboard at http://localhost:5173
```

`npm run refresh` should be re-run periodically (every 30-60 min) to keep
conditions current — for now that means running it by hand or wiring it into
Windows Task Scheduler / cron. `npm run scrape` re-scrapes the site list from
flymidwales.org.uk if it changes (review the diff — the source markup is
hand-authored and occasionally inconsistent).

## Accounts, referral codes, member-added sites

See [SETUP.md](SETUP.md) for the full walkthrough. Once wired up:

- Open sites are public; members-only sites (club-flagged + anything a member
  adds) require sign-in.
- Sign-in is a Supabase magic link, gated by a referral code for new accounts
  only (default `flymidwales`) — enforced server-side in the
  `request-access` edge function, not just in the UI.
- Signed-in members can add up to 5 sites of their own and edit any site's
  name, wind direction range, and notes — collaborative, club-wiki style.
  Which fields are editable is enforced at the database level (column-level
  grants), not just hidden in the UI.

## Tuning thresholds

All On/Marginal/Off thresholds live in `src/lib/scoring.ts`
(`DEFAULT_THRESHOLDS`) — speed bands, the gust-spread downgrade, how close to
a site's direction-arc edge counts as "marginal", and the rain-probability
cap. Per-site speed overrides come from `wind_speed_min_mph` /
`wind_speed_max_mph` in `src/data/sites.json` (or the `sites` table, once on
Supabase) when set.

## Known gaps

- Grid-ref → lat/lon conversion (`src/lib/osgb.ts`) is only used as a fallback
  when a site page doesn't give lat/lon directly; it's validated against the
  Ordnance Survey's official worked example to sub-meter accuracy.
- No cloud-base/CAPE thermal-risk data yet (deferred per spec).
- The Supabase-backed auth/write paths are implemented but unverified end to
  end — they need a real project (see SETUP.md) to test against.
