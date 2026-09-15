import { useState } from 'react'
import type { Question } from '../lib/weatherQuestions'

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Renders a self-contained quiz from a fixed question list — used both for a
 * short per-section check (pass the section's own questions as-is) and the
 * longer end-of-course quiz (pass `randomCount` to draw that many at random
 * from a bigger pool each time, including on reset).
 */
export function QuizBlock({
  title,
  subtitle,
  questions: sourceQuestions,
  randomCount,
}: {
  title: string
  subtitle?: string
  questions: Question[]
  /** If set, draws this many random questions from `questions` each time (including on reset) instead of using the full list in order. */
  randomCount?: number
}) {
  const pick = () => (randomCount ? shuffled(sourceQuestions).slice(0, randomCount) : sourceQuestions)
  const [questions, setQuestions] = useState<Question[]>(pick)
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(questions.length).fill(null))

  const answer = (qIndex: number, optionIndex: number) => {
    setAnswers((prev) => prev.map((a, i) => (i === qIndex ? optionIndex : a)))
  }

  const reset = () => {
    const next = pick()
    setQuestions(next)
    setAnswers(Array(next.length).fill(null))
  }

  const answeredCount = answers.filter((a) => a !== null).length
  const correctCount = answers.filter((a, i) => a === questions[i].correct).length
  const allAnswered = answeredCount === questions.length && questions.length > 0

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {allAnswered ? `${correctCount} / ${questions.length}` : `${answeredCount} / ${questions.length} answered`}
          </p>
          {answeredCount > 0 && (
            <button onClick={reset} className="cursor-pointer text-xs text-slate-400 underline hover:text-slate-600 dark:hover:text-slate-300">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIndex) => {
          const selected = answers[qIndex]
          const isAnswered = selected !== null
          return (
            <div key={qIndex} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {qIndex + 1}. {q.prompt}
                </p>
                {q.visual}
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {q.options.map((opt, optIndex) => {
                  const isCorrect = optIndex === q.correct
                  const isSelected = selected === optIndex
                  const stateClass = !isAnswered
                    ? 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
                    : isCorrect
                      ? 'border-[#0ca30c] bg-[#0ca30c]/10 text-[#0ca30c]'
                      : isSelected
                        ? 'border-[#d03b3b] bg-[#d03b3b]/10 text-[#d03b3b]'
                        : 'border-slate-200 text-slate-400 dark:border-slate-800'
                  return (
                    <button
                      key={optIndex}
                      onClick={() => !isAnswered && answer(qIndex, optIndex)}
                      disabled={isAnswered}
                      className={`cursor-pointer rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-colors disabled:cursor-default ${stateClass}`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              {isAnswered && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{q.explanation}</p>}
            </div>
          )
        })}
      </div>

      {allAnswered && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100 p-4 text-center dark:border-slate-800 dark:bg-slate-800">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {correctCount === questions.length
              ? 'Perfect score!'
              : correctCount >= questions.length * 0.7
                ? 'Good going.'
                : 'Worth another read through the section above.'}{' '}
            {correctCount} / {questions.length} correct.
          </p>
          <button
            onClick={reset}
            className="mt-2 cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
