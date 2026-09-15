import { useState } from 'react'
import { SynopticChart } from './SynopticChart'
import { WeatherCourse } from './WeatherCourse'
import { WeatherQuiz } from './WeatherQuiz'

type View = 'guide' | 'quiz'

/** Standalone weather tab: the live UK synoptic chart plus a short illustrated course on reading it (fronts, depressions, anticyclones) on one sub-page, and a quiz to test it on another. Separate from the site-conditions dashboard — this is background knowledge, not a per-site forecast. */
export function WeatherPage() {
  const [view, setView] = useState<View>('guide')

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Weather</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The big picture behind the site forecasts — the live UK synoptic chart, and a short guide to reading it.
        </p>
      </div>

      <div className="mb-4 flex gap-1.5">
        {(['guide', 'quiz'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              view === v
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {v === 'guide' ? 'Guide' : 'Quiz'}
          </button>
        ))}
      </div>

      {view === 'guide' ? (
        <div className="space-y-6">
          <SynopticChart />
          <WeatherCourse />
        </div>
      ) : (
        <WeatherQuiz />
      )}
    </div>
  )
}
