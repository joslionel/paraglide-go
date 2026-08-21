# Supabase setup

The app runs fine today without any of this (local JSON, no login). This is
what activates real accounts, magic-link sign-in, and member-added/edited
sites. I can't create a Supabase account or project for you — that part's on
you, but everything after "create a project" is copy/paste.

## 1. Create a project

Go to [supabase.com](https://supabase.com), create a free account if you
don't have one, and create a new project. Pick any name/region/password (the
DB password isn't used by anything here).

## 2. Get your API keys

In the project: **Settings → API**. You'll need three values:

- **Project URL**
- **anon / public key**
- **service_role key** — click "reveal", treat this like a root password

## 3. Fill in `.env`

Copy `.env.example` to `.env` in the project root and paste in the three
values from step 2:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`.env` is gitignored — never paste these into chat or commit them.

## 4. Run the migrations

Easiest: open **SQL Editor** in the Supabase dashboard and run, in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_auth_and_custom_sites.sql`

(Or, if you have the [Supabase CLI](https://supabase.com/docs/guides/cli)
installed: `supabase link --project-ref <your-project-ref>` then
`supabase db push`.)

## 5. Deploy the referral-gated login function

Requires the Supabase CLI:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy request-access
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available
inside every edge function — no secrets to set by hand.

## 6. Allow your app's URL to receive magic links

**Authentication → URL Configuration** in the dashboard. Add to **Redirect
URLs**:

- `http://localhost:5173` (dev)
- your production URL, once you have one

## 7. Import the existing sites

```bash
npm install
npm run import-sites
```

Pushes the 16 scraped sites from `src/data/sites.json` into the `sites`
table. Safe to re-run.

## 8. Refresh conditions

```bash
npm run refresh
```

Now reads sites from and writes conditions to Supabase instead of the local
JSON/static file (it detects the same `.env` values). Keep this on a 30-60
min schedule (cron, Windows Task Scheduler, etc.) — it's still a script you
run, not something Supabase runs for you, unless you additionally deploy
`supabase/functions/refresh-conditions` (already written, see the comment at
the top of that file) and schedule it with `pg_cron` or the dashboard's Cron
Jobs feature.

## 9. Restart the dev server and try it

```bash
npm run dev
```

Click **Log in**, enter your email with the default referral code
(`flymidwales`), and check your inbox. Supabase's built-in email sender is
rate-limited (a handful of emails/hour) — fine for a small club, but if you
hit the limit while testing, wait a bit or configure a custom SMTP provider
under **Authentication → Emails**.

## Managing referral codes

Add more via the `referral_codes` table (SQL Editor or Table Editor):

```sql
insert into referral_codes (code, uses_remaining) values ('another-code', 20);
-- uses_remaining = null means unlimited, like the seeded 'flymidwales' code
```

## What's gated behind login

- **Members-only sites** (existing club sites + anything a member adds) — an
  anonymous visitor only ever sees `members_only = false` sites.
- **Adding sites** — up to 5 per account, requires name + wind direction range
  + a grid ref or lat/lon.
- **Editing sites** — any signed-in member can edit any site's name, wind
  range, and notes (collaborative, club-wiki style) — nothing else on a site
  row is editable via the app, enforced at the database level regardless of
  what the client sends.
- **Deleting sites** — only your own added sites.
