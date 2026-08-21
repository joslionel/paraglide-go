import { useState } from 'react'
import type { Site, SiteConditions } from '../lib/types'
import { StatusPill } from './StatusPill'
import { ForecastStrip } from './ForecastStrip'
import { WindRose } from './WindRose'
import { degToCompass, formatWindWindow } from '../lib/format'
import { useAuth } from '../lib/AuthContext'
import { useUnit } from '../lib/UnitContext'
import { formatSpeed, UNIT_LABELS } from '../lib/units'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export function SiteCard({
  site,
  conditions,
  onChanged,
}: {
  site: Site
  conditions: SiteConditions | undefined
  onChanged: () => void
}) {
  const { user } = useAuth()
  const { unit } = useUnit()
  const [notesOpen, setNotesOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [name, setName] = useState(site.name)
  const [windDirMin, setWindDirMin] = useState(String(site.wind_dir_min ?? ''))
  const [windDirMax, setWindDirMax] = useState(String(site.wind_dir_max ?? ''))
  const [notes, setNotes] = useState(site.notes)

  const now = conditions?.now
  const status = now?.status ?? 'unknown'
  const canEdit = Boolean(user) && isSupabaseConfigured
  const canDelete = canEdit && site.is_custom && site.owner_id === user?.id

  const startEdit = () => {
    setName(site.name)
    setWindDirMin(String(site.wind_dir_min ?? ''))
    setWindDirMax(String(site.wind_dir_max ?? ''))
    setNotes(site.notes)
    setEditError('')
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!supabase) return
    const dirMin = parseInt(windDirMin, 10)
    const dirMax = parseInt(windDirMax, 10)
    if (!name.trim()) {
      setEditError('Name is required.')
      return
    }
    if (isNaN(dirMin) || isNaN(dirMax) || dirMin < 0 || dirMin > 359 || dirMax < 0 || dirMax > 359) {
      setEditError('Wind direction range must be two values between 0 and 359.')
      return
    }

    setSaving(true)
    setEditError('')
    const { error } = await supabase
      .from('sites')
      .update({ name: name.trim(), wind_dir_min: dirMin, wind_dir_max: dirMax, notes: notes.trim() })
      .eq('slug', site.slug)
    setSaving(false)

    if (error) {
      setEditError(error.message)
      return
    }

    setEditing(false)
    onChanged()
  }

  const deleteSite = async () => {
    if (!supabase) return
    if (!confirm(`Remove ${site.name}? This can't be undone.`)) return
    const { error } = await supabase.from('sites').delete().eq('slug', site.slug)
    if (error) {
      setEditError(error.message)
      return
    }
    onChanged()
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Wind dir min
              <input
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
                type="number"
                min={0}
                max={359}
                value={windDirMax}
                onChange={(e) => setWindDirMax(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Notes & hazards
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          {editError && <p className="text-xs text-[#d03b3b]">{editError}</p>}

          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            {canDelete && (
              <button
                onClick={deleteSite}
                className="ml-auto cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-[#d03b3b] hover:bg-[#d03b3b]/10"
              >
                Remove site
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{site.name}</h3>
            {canEdit && (
              <button
                onClick={startEdit}
                aria-label={`Edit ${site.name}`}
                className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✎
              </button>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{site.grid_ref ?? 'grid ref n/a'}</span>
            <span>·</span>
            <span>window {formatWindWindow(site.wind_dir_min, site.wind_dir_max)}</span>
            {site.members_only && (
              <span className="rounded bg-violet-500/10 px-1.5 py-0.5 font-medium text-violet-700 dark:text-violet-400">
                Members only
              </span>
            )}
            {site.is_custom && (
              <span className="rounded bg-sky-500/10 px-1.5 py-0.5 font-medium text-sky-700 dark:text-sky-400">
                Member-added
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusPill status={status} size="md" />
          <WindRose
            dirMin={site.wind_dir_min}
            dirMax={site.wind_dir_max}
            currentDir={now?.wind_direction_deg}
            currentReason={now?.reason}
            size={56}
          />
        </div>
      </div>

      {now ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
          <span>
            <span className="font-medium">{formatSpeed(now.wind_speed_mph, unit)}</span> {UNIT_LABELS[unit]}
            <span className="text-slate-400"> (g{formatSpeed(now.wind_gust_mph, unit)})</span>
          </span>
          <span>
            {degToCompass(now.wind_direction_deg)} <span className="text-slate-400">{now.wind_direction_deg}°</span>
          </span>
          <span className="text-slate-400">{now.precipitation_probability_percent}% rain</span>
          {now.gust_warning && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fab219]/15 px-2 py-0.5 text-xs font-medium text-[#946200] dark:text-[#fab219]">
              ⚠ Gusty
            </span>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          {site.missing_wind_dir ? 'No wind-direction window recorded for this site yet.' : 'No forecast data.'}
        </p>
      )}

      {conditions && conditions.daily.length > 0 && (
        <div className="mt-4">
          <ForecastStrip daily={conditions.daily} />
        </div>
      )}

      {(site.notes || site.liaison) && (
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {notesOpen ? '▾ Hide notes & hazards' : '▸ Notes & hazards'}
          </button>
          {notesOpen && (
            <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {site.notes && <p className="whitespace-pre-line">{site.notes}</p>}
              <div className="flex flex-wrap gap-x-4 text-xs text-slate-400">
                {site.liaison && <span>Liaison: {site.liaison}</span>}
                {site.hg_rating && <span>HG: {site.hg_rating}</span>}
                {site.pg_rating && <span>PG: {site.pg_rating}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
