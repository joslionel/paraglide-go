import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { AuthForm } from './AuthForm'

export function UserMenu() {
  const { user, loading, signOut } = useAuth()
  const [formOpen, setFormOpen] = useState(false)

  if (!isSupabaseConfigured || loading) return null

  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500 dark:text-slate-400">{user.email}</span>
        <button
          onClick={() => signOut()}
          className="cursor-pointer rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Log out
        </button>
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
