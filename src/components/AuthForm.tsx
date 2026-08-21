import { useState } from 'react'
import { FunctionsHttpError } from '@supabase/functions-js'
import { supabase } from '../lib/supabaseClient'

type Mode = 'existing' | 'new'

async function extractErrorMessage(error: unknown, data: { error?: string } | null): Promise<string> {
  if (data?.error) return data.error
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (body?.error) return body.error
    } catch {
      // response wasn't JSON — fall through to the generic message
    }
  }
  return 'Something went wrong — try again.'
}

export function AuthForm({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('existing')
  const [email, setEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const switchMode = (m: Mode) => {
    setMode(m)
    setStatus('idle')
    setErrorMessage('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setStatus('sending')
    setErrorMessage('')

    // Send the caller back to wherever they actually logged in from (dev or prod).
    const redirectTo = window.location.origin + import.meta.env.BASE_URL
    const body: { email: string; redirectTo: string; referralCode?: string } = { email, redirectTo }
    if (mode === 'new') body.referralCode = referralCode

    const { data, error } = await supabase.functions.invoke('request-access', { body })

    if (error || data?.error) {
      setStatus('error')
      setErrorMessage(await extractErrorMessage(error, data))
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="text-sm text-slate-600 dark:text-slate-300">
        <p>
          {mode === 'existing' ? (
            <>
              If <span className="font-medium">{email}</span> is a registered address, a sign-in link is on its way
              — check your inbox (and spam folder).
            </>
          ) : (
            <>
              Check <span className="font-medium">{email}</span> for a link to finish setting up your account.
            </>
          )}
        </p>
        <button
          onClick={onClose}
          className="mt-3 cursor-pointer rounded-full border border-slate-300 px-3 py-1 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex gap-1.5 text-xs">
        {(['existing', 'new'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`cursor-pointer rounded-full border px-2.5 py-1 font-medium transition-colors ${
              mode === m
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {m === 'existing' ? 'Existing member' : 'New member'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3 text-sm">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {mode === 'new' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Referral code</label>
            <input
              type="text"
              required
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="e.g. flymidwales"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        )}

        {status === 'error' && <p className="text-xs text-[#d03b3b]">{errorMessage}</p>}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
        </button>
      </form>
    </div>
  )
}
