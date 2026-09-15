import { useMemo, useState } from 'react'

// The Met Office's own public chart API (the same one that powers
// https://www.metoffice.gov.uk/weather/maps-and-charts/surface-pressure) —
// confirmed to embed fine cross-origin via a plain <img> (no CORS/referer
// gate; it's served straight off CloudFront). Charts are issued twice a day
// (00Z and 12Z runs) but not published until several hours later, and we
// have no API to ask "what's the latest run" — so we compute a conservative
// candidate run time and let <img onError> fall back to older runs.
const BASE_URL = 'https://data.consumer-digital.api.metoffice.gov.uk/v1/surface-pressure/colour'
const OFFSETS = [0, 12, 24, 36, 48, 60, 72, 84] as const
const OFFSET_LABELS: Record<(typeof OFFSETS)[number], string> = {
  0: 'Now',
  12: '+12h',
  24: '+1 day',
  36: '+1.5 days',
  48: '+2 days',
  60: '+2.5 days',
  72: '+3 days',
  84: '+3.5 days',
}
const MAX_RUN_FALLBACKS = 6 // ~3 days of runs — generous safety net if the newest ones 404

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function isoForRun(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}00`
}

/** Candidate run times, newest first. Charts for a run aren't published until roughly 6-7h after its nominal time, so start there rather than at "now". */
function candidateRuns(now: Date, count: number): Date[] {
  const runs: Date[] = []
  const first = new Date(now)
  first.setUTCMinutes(0, 0, 0)
  first.setUTCHours(first.getUTCHours() - 7)
  first.setUTCHours(first.getUTCHours() - (first.getUTCHours() % 12))
  for (let i = 0; i < count; i++) runs.push(new Date(first.getTime() - i * 12 * 60 * 60 * 1000))
  return runs
}

function chartUrl(run: Date, offsetHours: number): string {
  return `${BASE_URL}/${isoForRun(run)}/FSXX00T_${pad(offsetHours)}.gif`
}

/** UK/near-Atlantic surface pressure (synoptic) chart, live from the Met Office — analysis plus forecast steps out to +3.5 days. */
export function SynopticChart() {
  const [offset, setOffset] = useState<(typeof OFFSETS)[number]>(0)
  const [runIndex, setRunIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  const runs = useMemo(() => candidateRuns(new Date(), MAX_RUN_FALLBACKS), [])
  const src = chartUrl(runs[runIndex], offset)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">UK Surface Pressure Chart</h3>
        <a
          href="https://www.metoffice.gov.uk/weather/maps-and-charts/surface-pressure"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
        >
          Full interactive version on the Met Office site ↗
        </a>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {OFFSETS.map((o) => (
          <button
            key={o}
            onClick={() => {
              setOffset(o)
              setFailed(false)
            }}
            className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              offset === o
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {OFFSET_LABELS[o]}
          </button>
        ))}
      </div>

      {failed ? (
        <p className="text-sm text-slate-400">
          Couldn't load the chart right now — try the{' '}
          <a
            href="https://www.metoffice.gov.uk/weather/maps-and-charts/surface-pressure"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Met Office site
          </a>{' '}
          directly.
        </p>
      ) : (
        <img
          key={src}
          src={src}
          alt={`UK and near-Atlantic surface pressure chart, ${OFFSET_LABELS[offset].toLowerCase()}`}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-800"
          onError={() => {
            if (runIndex < runs.length - 1) setRunIndex((i) => i + 1)
            else setFailed(true)
          }}
        />
      )}

      <p className="mt-2 text-[11px] text-slate-400">
        Chart: © Crown copyright, Met Office. Isobars join points of equal pressure; fronts are the coloured lines with
        markers — see the guide below to read them.
      </p>
    </div>
  )
}
