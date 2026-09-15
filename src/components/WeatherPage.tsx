import { SynopticChart } from './SynopticChart'
import { WeatherCourse } from './WeatherCourse'
import { WeatherQuiz } from './WeatherQuiz'

/** Standalone weather tab: the live UK synoptic chart plus a short illustrated course on reading it (fronts, depressions, anticyclones) and a quiz. Separate from the site-conditions dashboard — this is background knowledge, not a per-site forecast. */
export function WeatherPage() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Weather</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The big picture behind the site forecasts — the live UK synoptic chart, and a short guide to reading it.
        </p>
      </div>

      <div className="space-y-6">
        <SynopticChart />
        <WeatherCourse />
        <WeatherQuiz />
      </div>
    </div>
  )
}
