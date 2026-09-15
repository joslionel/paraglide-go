import { useEffect, useState } from 'react'
import { getAllProfiles, updateProfileQuotas } from '../lib/dataStore'
import type { Profile } from '../lib/types'

function QuotaInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
      className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
    />
  )
}

/** Admin-only account list: raise a member's referral-code or custom-site quota. Gated in App.tsx on profile.is_admin; RLS (migration 0006) enforces it server-side too. */
export function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [edits, setEdits] = useState<Record<string, { referral_code_quota: number; custom_site_quota: number }>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    getAllProfiles()
      .then((rows) => {
        setProfiles(rows)
        const initial: typeof edits = {}
        for (const p of rows) initial[p.id] = { referral_code_quota: p.referral_code_quota, custom_site_quota: p.custom_site_quota }
        setEdits(initial)
        setError('')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load accounts.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const save = async (id: string) => {
    setSavingId(id)
    setError('')
    try {
      await updateProfileQuotas(id, edits[id])
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...edits[id] } : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSavingId(null)
    }
  }

  const dirty = (p: Profile) => {
    const e = edits[p.id]
    return e && (e.referral_code_quota !== p.referral_code_quota || e.custom_site_quota !== p.custom_site_quota)
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Admin dashboard</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Raise a member's invite-link quota or custom-site quota. Admins are always unlimited regardless of these numbers.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading accounts…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Admin</th>
                <th className="px-3 py-2">Invite quota</th>
                <th className="px-3 py-2">Site quota</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">{p.email ?? p.id}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{p.is_admin ? 'Yes' : ''}</td>
                  <td className="px-3 py-2">
                    <QuotaInput
                      value={edits[p.id]?.referral_code_quota ?? p.referral_code_quota}
                      onChange={(v) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], referral_code_quota: v } }))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <QuotaInput
                      value={edits[p.id]?.custom_site_quota ?? p.custom_site_quota}
                      onChange={(v) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], custom_site_quota: v } }))}
                    />
                  </td>
                  <td className="px-3 py-2 text-slate-400">{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => save(p.id)}
                      disabled={!dirty(p) || savingId === p.id}
                      className="cursor-pointer rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                    >
                      {savingId === p.id ? 'Saving…' : 'Save'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
