// Referral-gated sign-in. This is the ONLY path that can create a new
// account — the client never calls supabase.auth.signInWithOtp directly with
// shouldCreateUser: true, so a stranger can't self-serve a magic link without
// a valid referral code (default "flymidwales", see migration 0002).
//
// Existing members don't need a code: if the email already has an account,
// this just sends a normal login link and ignores any referralCode sent.
// If the email has NO account and no referralCode was sent (the "existing
// member" form on the client never sends one), this is a silent no-op —
// same {ok:true} response either way, so the response never reveals whether
// an email is registered.
//
// Deploy: `supabase functions deploy request-access`
// Secrets: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (set automatically for
// Supabase-hosted functions; confirm with `supabase secrets list` if deploying
// elsewhere).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let email: string, referralCode: string, redirectTo: string | undefined
  try {
    const body = await req.json()
    email = String(body.email ?? '').trim().toLowerCase()
    referralCode = String(body.referralCode ?? '').trim()
    redirectTo = body.redirectTo ? String(body.redirectTo) : undefined
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Enter a valid email address' }, 400)
  }

  // Supabase itself rejects anything not on the project's Redirect URLs
  // allow-list, so this is just a sanity check, not the real gate.
  if (redirectTo && !/^https?:\/\//.test(redirectTo)) {
    return json({ error: 'Invalid redirect URL' }, 400)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Small member list expected for a club dashboard — a single page is plenty.
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) return json({ error: 'Could not check account status' }, 500)

  const existingUser = userList.users.find((u) => u.email?.toLowerCase() === email)

  if (existingUser) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    })
    if (error) return json({ error: 'Could not send sign-in link' }, 500)
    return json({ ok: true })
  }

  if (!referralCode) {
    // No account, and this came from the "existing member" form (no code
    // field at all) — stay silent rather than confirming the email is unregistered.
    return json({ ok: true })
  }

  const { data: code } = await supabase.from('referral_codes').select('*').eq('code', referralCode).maybeSingle()

  if (!code || (code.uses_remaining !== null && code.uses_remaining <= 0)) {
    return json({ error: 'That referral code is not valid' }, 400)
  }

  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo })
  if (inviteError) return json({ error: 'Could not create account' }, 500)

  if (code.uses_remaining !== null) {
    await supabase
      .from('referral_codes')
      .update({ uses_remaining: code.uses_remaining - 1 })
      .eq('code', referralCode)
  }

  return json({ ok: true })
})
