import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { createReferralCode, getReferralCodes } from '../lib/dataStore'
import type { ReferralCode } from '../lib/types'

function inviteUrl(code: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}?ref=${code}`
}

/** Lets a signed-in member generate single-use invite links, up to their referral-code quota (unlimited for admins). Lives in the UserMenu popover, next to Log out. */
export function InvitePanel() {
  const { user, profile } = useAuth()
  const [codes, setCodes] = useState<ReferralCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

  useEffect(() => {
    if (!user) return
    getReferralCodes(user.id)
      .then(setCodes)
      .catch(() => setCodes([]))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  const remaining = profile?.is_admin ? null : (profile?.referral_code_quota ?? 5) - codes.length
  const canCreate = remaining === null || remaining > 0

  const create = async () => {
    setCreating(true)
    setError('')
    try {
      const code = await createReferralCode(user.id)
      setCodes((prev) => [code, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create an invite link.')
    } finally {
      setCreating(false)
    }
  }

  const copy = (code: string) => {
    navigator.clipboard.writeText(inviteUrl(code)).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(''), 2000)
    })
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Invite someone</h4>
        <span className="text-xs text-slate-400">{profile?.is_admin ? 'Unlimited' : `${Math.max(0, remaining ?? 0)} of ${profile?.referral_code_quota ?? 5} left`}</span>
      </div>

      {canCreate && (
        <button
          onClick={create}
          disabled={creating}
          className="w-full cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          {creating ? 'Creating…' : '+ Create invite link'}
        </button>
      )}
      {!canCreate && <p className="text-xs text-slate-400">You've used all your invite links — ask an admin for more.</p>}
      {error && <p className="mt-1 text-xs text-[#d03b3b]">{error}</p>}

      {!loading && codes.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {codes.map((c) => (
            <li key={c.code} className="flex items-center justify-between gap-2 text-xs">
              <span className={c.uses_remaining === 0 ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}>
                {c.uses_remaining === 0 ? 'Used' : 'Active'}
              </span>
              <button
                onClick={() => copy(c.code)}
                disabled={c.uses_remaining === 0}
                className="cursor-pointer rounded-full border border-slate-300 px-2 py-0.5 font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {copiedCode === c.code ? 'Copied!' : 'Copy link'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
