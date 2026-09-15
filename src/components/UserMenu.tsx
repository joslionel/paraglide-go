import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { AuthForm } from './AuthForm'
import { InvitePanel } from './InvitePanel'

// A shared invite link should land the recipient straight on a ready-to-fill
// login popover rather than making them hunt for the "Log in" button.
const hasReferralLink = new URLSearchParams(window.location.search).has('ref')

export function UserMenu({ onOpenAdmin }: { onOpenAdmin?: () => void }) {
  const { user, profile, loading, signOut } = useAuth()
  const [formOpen, setFormOpen] = useState(hasReferralLink)
  const [menuOpen, setMenuOpen] = useState(false)

  if (!isSupabaseConfigured || loading) return null

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {user.email}
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg dark:border-slate-800 dark:bg-slate-900">
              {profile?.is_admin && onOpenAdmin && (
                <button
                  onClick={() => {
                    onOpenAdmin()
                    setMenuOpen(false)
                  }}
                  className="mb-3 w-full cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Admin dashboard
                </button>
              )}
              <InvitePanel />
              <button
                onClick={() => signOut()}
                className="mt-4 w-full cursor-pointer rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setFormOpen(!formOpen)}
        className="cursor-pointer rounded-full border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Log in
      </button>
      {formOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setFormOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <AuthForm onClose={() => setFormOpen(false)} />
          </div>
        </>
      )}
    </div>
  )
}
