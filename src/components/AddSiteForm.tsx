import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { refreshSiteConditions } from '../lib/dataStore'
import { useAuth } from '../lib/AuthContext'
import { osgb36GridRefToWgs84 } from '../lib/osgb'
import type { SiteConditions } from '../lib/types'

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}

export function AddSiteForm({
  remaining,
  onAdded,
  onConditionsRefreshed,
}: {
  remaining: number
  onAdded: () => void
  onConditionsRefreshed: (slug: string, conditions: SiteConditions) => void
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [gridRef, setGridRef] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [windDirMin, setWindDirMin] = useState('')
  const [windDirMax, setWindDirMax] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  if (!user || remaining <= 0) return null

  const reset = () => {
    setName('')
    setGridRef('')
    setLat('')
    setLon('')
    setWindDirMin('')
    setWindDirMax('')
    setNotes('')
    setStatus('idle')
    setErrorMessage('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    let finalLat = lat ? parseFloat(lat) : null
    let finalLon = lon ? parseFloat(lon) : null

    if ((finalLat === null || finalLon === null) && gridRef.trim()) {
      const converted = osgb36GridRefToWgs84(gridRef.trim())
      if (!converted) {
        setStatus('error')
        setErrorMessage("Couldn't read that grid reference — check the format (e.g. SN715863).")
        return
      }
      finalLat = converted.lat
      finalLon = converted.lon
    }

    if (finalLat === null || finalLon === null) {
      setStatus('error')
      setErrorMessage('Enter a grid reference or a lat/lon.')
      return
    }

    const dirMin = parseInt(windDirMin, 10)
    const dirMax = parseInt(windDirMax, 10)
    if (isNaN(dirMin) || isNaN(dirMax) || dirMin < 0 || dirMin > 359 || dirMax < 0 || dirMax > 359) {
      setStatus('error')
      setErrorMessage('Wind direction range must be two values between 0 and 359.')
      return
    }

    setStatus('saving')
    setErrorMessage('')

    const slug = slugify(name)
    const { error } = await supabase.from('sites').insert({
      slug,
      name: name.trim(),
      grid_ref: gridRef.trim() || null,
      lat: finalLat,
      lon: finalLon,
      wind_dir_min: dirMin,
      wind_dir_max: dirMax,
      wind_speed_min_mph: null,
      wind_speed_max_mph: null,
      members_only: true,
      hg_rating: null,
      pg_rating: null,
      liaison: null,
      notes: notes.trim(),
      source_url: null,
      missing_wind_dir: false,
      owner_id: user.id,
      is_custom: true,
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    reset()
    setOpen(false)
    onAdded()

    // Pull in a forecast immediately rather than waiting for the next
    // scheduled refresh (up to 30 min away) — best-effort, the site is
    // already saved either way.
    try {
      const conditions = await refreshSiteConditions(slug)
      onConditionsRefreshed(slug, conditions)
    } catch {
      // Scheduled refresh will pick it up eventually; the site's own
      // "Fetch forecast now" button also covers this.
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        + Add a site ({remaining} left)
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Add a site</h3>
        <span className="text-xs text-slate-400">{remaining} of 5 remaining</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:col-span-2">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Grid ref
          <input
            value={gridRef}
            onChange={(e) => setGridRef(e.target.value)}
            placeholder="e.g. SN715863"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Lat
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="52.455"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Lon
            <input
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="-3.892"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:w-1/2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Wind dir min
            <input
              required
              type="number"
              min={0}
              max={359}
              value={windDirMin}
              onChange={(e) => setWindDirMin(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Wind dir max
            <input
              required
              type="number"
              min={0}
              max={359}
              value={windDirMax}
              onChange={(e) => setWindDirMax(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        </div>

        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:col-span-2">
          Notes & hazards
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      </div>

      {status === 'error' && <p className="mt-2 text-xs text-[#d03b3b]">{errorMessage}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          {status === 'saving' ? 'Adding…' : 'Add site'}
        </button>
        <button
          type="button"
          onClick={() => {
            reset()
            setOpen(false)
          }}
          className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
