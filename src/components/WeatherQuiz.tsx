import { useState } from 'react'
import { FrontSymbol, type FrontType } from './FrontSymbol'

interface Question {
  prompt: string
  symbol?: FrontType
  options: string[]
  correct: number
  explanation: string
}

const QUESTIONS: Question[] = [
  {
    prompt: 'Which front does this symbol represent?',
    symbol: 'cold',
    options: ['Warm front', 'Cold front', 'Occluded front', 'Anticyclone'],
    correct: 1,
    explanation: 'Triangles pointing the direction of travel — the front is a steep, fast-moving wedge of cold air undercutting the warmer air ahead.',
  },
  {
    prompt: 'Which front does this symbol represent?',
    symbol: 'warm',
    options: ['Warm front', 'Cold front', 'Occluded front', 'Anticyclone'],
    correct: 0,
    explanation: 'Semicircles pointing the direction of travel — warm air riding up and over retreating cold air on a shallow slope.',
  },
  {
    prompt: 'Which front does this symbol represent?',
    symbol: 'occluded',
    options: ['Warm front', 'Cold front', 'Occluded front', 'A ridge of high pressure'],
    correct: 2,
    explanation: "Alternating triangles and semicircles on the same side — a cold front that's caught up with the warm front ahead of it.",
  },
  {
    prompt: 'Which type of front typically gives the longest, steadiest build-up of rain as it approaches?',
    options: ['Cold front', 'Warm front', 'Occluded front', "None — fronts don't affect rainfall"],
    correct: 1,
    explanation: "Warm fronts are shallow-sloped and slow, so the cloud and rain sequence unfolds gradually over many hours as it approaches.",
  },
  {
    prompt: 'In the Northern Hemisphere, which way does wind circulate around a depression (low)?',
    options: ['Clockwise', 'Anticlockwise', "It doesn't rotate", 'Depends on the season'],
    correct: 1,
    explanation: 'Air spirals inward and rises around a low — anticlockwise in the Northern Hemisphere.',
  },
  {
    prompt: 'And around an anticyclone (high)?',
    options: ['Clockwise', 'Anticlockwise', "It doesn't rotate", 'Depends on the season'],
    correct: 0,
    explanation: 'Air sinks and spreads out around a high — clockwise in the Northern Hemisphere, usually more gently than around a low.',
  },
  {
    prompt: 'What typically happens right after a cold front passes?',
    options: ['Drizzle continues for hours', 'Rapid clearance to bright, colder air', 'Pressure keeps falling sharply', 'Wind drops to completely calm'],
    correct: 1,
    explanation: 'The cold, unstable air behind a cold front usually clears quickly to bright skies — though it can stay showery and gusty for a while.',
  },
  {
    prompt: 'An occluded front forms when…',
    options: ['A warm front catches up with a cold front', 'A cold front catches up with the warm front ahead of it', 'High pressure builds over a depression', 'Two warm fronts merge'],
    correct: 1,
    explanation: "Cold fronts move faster than warm fronts, so in a maturing depression they eventually catch up and lift the warm sector clear of the ground.",
  },
  {
    prompt: 'On the chart, tightly packed isobars (close together) indicate…',
    options: ['Calm conditions', 'Strong wind', 'Heavy rain, regardless of wind', 'Clear skies'],
    correct: 1,
    explanation: 'The closer the isobars, the steeper the pressure gradient — and the stronger the wind.',
  },
  {
    prompt: 'Which pressure system generally gives the best flying conditions?',
    options: ['A depression', 'An anticyclone', 'An occluded front', 'A cold front, while it passes'],
    correct: 1,
    explanation: "Settled, often lighter wind — though watch for no-thermal \"blue\" days under a strong ridge, or fog trapped under a winter inversion.",
  },
]

export function WeatherQuiz() {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null))

  const answer = (qIndex: number, optionIndex: number) => {
    setAnswers((prev) => prev.map((a, i) => (i === qIndex ? optionIndex : a)))
  }

  const reset = () => setAnswers(Array(QUESTIONS.length).fill(null))

  const answeredCount = answers.filter((a) => a !== null).length
  const correctCount = answers.filter((a, i) => a === QUESTIONS[i].correct).length
  const allAnswered = answeredCount === QUESTIONS.length

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Quick quiz</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pick an answer for each — you'll see straight away whether it's right.</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {allAnswered ? `${correctCount} / ${QUESTIONS.length}` : `${answeredCount} / ${QUESTIONS.length} answered`}
          </p>
          {answeredCount > 0 && (
            <button onClick={reset} className="cursor-pointer text-xs text-slate-400 underline hover:text-slate-600 dark:hover:text-slate-300">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {QUESTIONS.map((q, qIndex) => {
          const selected = answers[qIndex]
          const isAnswered = selected !== null
          return (
            <div key={qIndex} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {qIndex + 1}. {q.prompt}
                </p>
                {q.symbol && <FrontSymbol type={q.symbol} className="h-6 w-20 shrink-0" />}
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
            {correctCount === QUESTIONS.length
              ? 'Perfect score!'
              : correctCount >= QUESTIONS.length * 0.7
                ? 'Good going.'
                : 'Worth another read through the guide above.'}{' '}
            {correctCount} / {QUESTIONS.length} correct.
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
