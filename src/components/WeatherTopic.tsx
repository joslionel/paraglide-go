import type { ReactNode } from 'react'

/** A single course topic card — heading, optional symbol badge, a diagram, explanatory text, and a "For pilots" takeaway. Shared building block for every weather-course section. */
export function WeatherTopic({
  title,
  symbol,
  diagram,
  children,
  tip,
}: {
  title: string
  symbol?: ReactNode
  diagram: ReactNode
  children: ReactNode
  tip: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h5 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h5>
        {symbol}
      </div>
      <div className="mb-3 max-w-sm">{diagram}</div>
      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">{children}</div>
      <p className="mt-3 text-xs text-amber-600 dark:text-amber-500">
        <span className="font-semibold">For pilots: </span>
        {tip}
      </p>
    </div>
  )
}
