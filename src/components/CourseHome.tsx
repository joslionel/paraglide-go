import { useState } from 'react'
import { SymbolsSection } from './weatherSections/SymbolsSection'
import { FrontsSection } from './weatherSections/FrontsSection'
import { SystemsSection } from './weatherSections/SystemsSection'
import { CloudsSection } from './weatherSections/CloudsSection'
import { ThermalsSection } from './weatherSections/ThermalsSection'
import { WindSection } from './weatherSections/WindSection'
import { QuizBlock } from './QuizBlock'
import { ALL_QUESTIONS, type SectionId } from '../lib/weatherQuestions'

const SECTIONS: { id: SectionId; title: string; blurb: string; Component: () => React.JSX.Element }[] = [
  { id: 'symbols', title: 'Chart symbols', blurb: 'Isobars, pressure, wind barbs, troughs.', Component: SymbolsSection },
  { id: 'fronts', title: 'Fronts', blurb: 'Warm, cold, occluded, stationary — and wind shifts.', Component: FrontsSection },
  { id: 'systems', title: 'Pressure systems', blurb: 'Depressions and anticyclones.', Component: SystemsSection },
  { id: 'clouds', title: 'Clouds & fog', blurb: 'What each cloud type signifies, plus fog types.', Component: CloudsSection },
  { id: 'thermals', title: 'Thermals & stability', blurb: 'Convection, ELR/DALR/SALR, the tephigram.', Component: ThermalsSection },
  { id: 'wind', title: 'Local winds', blurb: 'Valley winds, sea breezes, wave lift.', Component: WindSection },
]

type View = 'overview' | SectionId | 'quiz'

/** Course home: an overview linking to each section (each ending in its own short quiz) plus a longer, comprehensive final quiz drawing from every section. Reachable both from the Weather (chart) page and directly from the main nav. */
export function CourseHome() {
  const [view, setView] = useState<View>('overview')

  const questionCount = (id: SectionId) => ALL_QUESTIONS.filter((q) => q.section === id).length

  if (view !== 'overview') {
    const active = SECTIONS.find((s) => s.id === view)
    return (
      <div>
        <button
          onClick={() => setView('overview')}
          className="mb-4 cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Back to course overview
        </button>
        {active ? (
          <active.Component />
        ) : (
          <QuizBlock title="Full quiz" subtitle="10 random questions from every section — reset for a different set." questions={ALL_QUESTIONS} randomCount={10} />
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Weather Course</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          A short, illustrated introduction to reading a UK synoptic chart and the weather behind it — not a
          substitute for a proper met course, but enough to make sense of what you're looking at.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setView(s.id)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.blurb}</p>
            <p className="mt-2 text-xs text-slate-400">{questionCount(s.id)}-question section quiz</p>
          </button>
        ))}
      </div>

      <button
        onClick={() => setView('quiz')}
        className="mt-4 w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white p-4 text-left hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Take the full quiz</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">10 random questions drawn from every section above.</p>
      </button>
    </div>
  )
}
