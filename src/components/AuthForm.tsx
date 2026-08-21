import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const DEFAULT_REFERRAL_CODE = 'flymidwales'

export function AuthForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [referralCode, setReferralCode] = useState(DEFAULT_REFERRAL_CODE)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setStatus('sending')
    setErrorMessage('')

    const { data, error } = await supabase.functions.invoke('request-access', {
      body: { email, referralCode },
    })

    if (error || data?.error) {
      setStatus('error')
      setErrorMessage(data?.error ?? 'Something went wrong — try again.')
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="text-sm text-slate-600 dark:text-slate-300">
        <p>
          If <span className="font-medium">{email}</span> is valid, a sign-in link is on its way — check your inbox
          (and spam folder).
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
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          Referral code <span className="font-normal">(new members only)</span>
        </label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      {status === 'error' && <p className="text-xs text-[#d03b3b]">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
      >
        {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
      </button>
    </form>
  )
}
