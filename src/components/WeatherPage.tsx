import { SynopticChart } from './SynopticChart'

/** Weather tab: just the live UK synoptic chart, plus a link into the separate Weather Course (also reachable directly from the main nav) for anyone who wants help reading it. */
export function WeatherPage({ onOpenCourse }: { onOpenCourse: () => void }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Weather</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The big picture behind the site forecasts — the live UK synoptic chart.</p>
      </div>

      <div className="space-y-4">
        <SynopticChart />

        <button
          onClick={onOpenCourse}
          className="w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white p-4 text-left hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">New to reading this chart?</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Take the Weather Course — fronts, pressure systems, clouds, thermals and local winds, each with a short quiz.
          </p>
        </button>
      </div>
    </div>
  )
}
