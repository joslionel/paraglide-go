import { useState } from 'react'
import { FrontSymbol, type FrontType } from './FrontSymbol'
import { WindBarb } from './WeatherDiagrams'

const QUIZ_LENGTH = 10

interface Question {
  prompt: string
  visual?: React.ReactNode
  options: string[]
  correct: number
  explanation: string
}

function frontVisual(type: FrontType) {
  return <FrontSymbol type={type} className="h-6 w-20 shrink-0" />
}

const ALL_QUESTIONS: Question[] = [
  {
    prompt: 'Which front does this symbol represent?',
    visual: frontVisual('cold'),
    options: ['Warm front', 'Cold front', 'Occluded front', 'Anticyclone'],
    correct: 1,
    explanation: 'Triangles pointing the direction of travel — the front is a steep, fast-moving wedge of cold air undercutting the warmer air ahead.',
  },
  {
    prompt: 'Which front does this symbol represent?',
    visual: frontVisual('warm'),
    options: ['Warm front', 'Cold front', 'Occluded front', 'Anticyclone'],
    correct: 0,
    explanation: 'Semicircles pointing the direction of travel — warm air riding up and over retreating cold air on a shallow slope.',
  },
  {
    prompt: 'Which front does this symbol represent?',
    visual: frontVisual('occluded'),
    options: ['Warm front', 'Cold front', 'Occluded front', 'A ridge of high pressure'],
    correct: 2,
    explanation: "Alternating triangles and semicircles on the same side — a cold front that's caught up with the warm front ahead of it.",
  },
  {
    prompt: 'Which front does this symbol represent?',
    visual: frontVisual('stationary'),
    options: ['Warm front', 'Occluded front', 'Stationary front', 'A trough'],
    correct: 2,
    explanation: "Warm-front semicircles and cold-front triangles on opposite sides of the line — neither air mass is winning, so the boundary is holding roughly still.",
  },
  {
    prompt: "A stationary front's symbol differs from an occluded front's because…",
    options: [
      'It has no markers at all',
      'Its markers sit on opposite sides of the line, rather than both crowding the same side',
      "It's always coloured green",
      'It only ever appears in winter',
    ],
    correct: 1,
    explanation: 'An occluded front piles both marker types onto one side; a stationary front splits them — one on each side — to show the stand-off between the two air masses.',
  },
  {
    prompt: 'Which type of front typically gives the longest, steadiest build-up of rain as it approaches?',
    options: ['Cold front', 'Warm front', 'Occluded front', "None — fronts don't affect rainfall"],
    correct: 1,
    explanation: 'Warm fronts are shallow-sloped and slow, so the cloud and rain sequence unfolds gradually over many hours as it approaches.',
  },
  {
    prompt: 'In the Northern Hemisphere, which way does wind circulate around a depression (low)?',
    options: ['Clockwise', 'Anticlockwise', "It doesn't rotate", 'Depends on the season'],
    correct: 1,
    explanation: 'Air spirals inward and rises around a low — anticlockwise in the Northern Hemisphere.',
  },
  {
    prompt: 'In the Northern Hemisphere, which way does wind circulate around an anticyclone (high)?',
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
  {
    prompt: 'What do isobars on a chart join together?',
    options: ['Points of equal temperature', 'Points of equal pressure', 'Points of equal wind speed', 'Points of equal humidity'],
    correct: 1,
    explanation: "Isobars connect points of equal atmospheric pressure — that's literally what the name means (iso- \"equal\", -bar \"pressure\").",
  },
  {
    prompt: 'Widely spaced isobars generally indicate…',
    options: ['Strong wind', 'Light wind', 'Imminent thunderstorms', 'No wind at all'],
    correct: 1,
    explanation: 'A gentle pressure gradient over distance means a gentler push on the air — lighter wind.',
  },
  {
    prompt: 'On a wind barb, what do the "feathers" at the end represent?',
    options: ['Wind direction', 'Wind speed', 'Air pressure', 'Temperature'],
    correct: 1,
    explanation: 'The shaft shows direction (pointing the way the wind blows from); the feathers on the end encode speed.',
  },
  {
    prompt: 'On a wind barb, one full-length feather represents approximately…',
    options: ['5 knots', '10 knots', '25 knots', '50 knots'],
    correct: 1,
    explanation: 'A half barb is ~5 knots, a full barb ~10 knots, and a solid pennant (triangle) ~50 knots — added together for the total.',
  },
  {
    prompt: 'On a wind barb, a solid filled triangle (pennant) represents approximately…',
    options: ['5 knots', '10 knots', '25 knots', '50 knots'],
    correct: 3,
    explanation: "Pennants are the big jump in the encoding — one is worth five full barbs' worth of speed.",
  },
  {
    prompt: 'Roughly how strong is the wind shown by this barb?',
    visual: <WindBarb knots={25} />,
    options: ['Calm', 'About 10 knots', 'About 25 knots', 'About 50+ knots'],
    correct: 2,
    explanation: 'Two full barbs (10 kt each) plus one half barb (5 kt) = 25 knots.',
  },
  {
    prompt: 'A trough is best described as…',
    options: [
      'A tight cluster of isobars around a high',
      'An elongated dip in pressure extending from a low, with no closed circulation of its own',
      'A type of front only seen in summer',
      'Another name for an anticyclone',
    ],
    correct: 1,
    explanation: "It behaves a bit like a mild, scaled-down front, but it isn't a fully closed low-pressure centre.",
  },
  {
    prompt: 'What weather does a trough passage often bring?',
    options: ['A brief windshift and a band of showers', 'Weeks of settled sunshine', 'No noticeable change at all', 'A sudden rise in temperature only'],
    correct: 0,
    explanation: "Similar in miniature to a cold front — a shift in wind direction and a line of showers as it crosses.",
  },
  {
    prompt: 'How is a trough marked on a synoptic chart?',
    options: [
      'A dashed blue line with triangles, like a cold front',
      'A solid black line, with no triangle or semicircle markers',
      'A red circle around the affected area',
      "It isn't marked — only the isobars hint at it",
    ],
    correct: 1,
    explanation: "That's the giveaway that distinguishes it from a front on the chart: a plain solid line, no markers, often lined up with a kink in the isobars.",
  },
  {
    prompt: 'Which cloud is typically the first visible sign of an approaching warm front, sometimes a day or more ahead?',
    options: ['Cumulonimbus', 'Stratus', 'Cirrus', 'Cumulus'],
    correct: 2,
    explanation: 'High, thin cirrus thickening gradually is the classic early warning of a warm front, well before the rain arrives.',
  },
  {
    prompt: 'Cirrus cloud is made mostly of…',
    options: ['Water droplets', 'Ice crystals', 'Dust', 'Pollen'],
    correct: 1,
    explanation: "It forms so high up (16,000 ft+) that it's far too cold for liquid water — hence the wispy, ice-crystal look.",
  },
  {
    prompt: 'Which cloud type is a flat, featureless grey layer often linked to stable, murky conditions or drizzle?',
    options: ['Cirrus', 'Stratus', 'Cumulus', 'Cumulonimbus'],
    correct: 1,
    explanation: 'Stratus forms in stable air as a flat, low layer — usually a poor-visibility, weak-or-no-thermals kind of day.',
  },
  {
    prompt: 'Which cloud marks the top of a rising thermal and is generally a good sign for soaring?',
    options: ['Stratus', 'Cirrus', 'Cumulus', 'Cumulonimbus'],
    correct: 2,
    explanation: "Cumulus forms where a rising thermal cools enough to condense — its flat base roughly marks the top of the lift below it.",
  },
  {
    prompt: 'Which cloud type carries the highest risk to a pilot — heavy showers, lightning, hail and severe turbulence?',
    options: ['Cirrus', 'Stratus', 'Cumulus', 'Cumulonimbus'],
    correct: 3,
    explanation: 'Land immediately if one is building nearby — cumulonimbus brings some of the most violent weather in the sky.',
  },
  {
    prompt: 'A cumulonimbus is essentially…',
    options: [
      'A completely different cloud from cumulus',
      'A cumulus cloud that has grown explosively tall in very unstable air',
      'A type of stratus cloud',
      'A cloud that only forms over the sea',
    ],
    correct: 1,
    explanation: "Same family as the friendly fair-weather cumulus — just fed by much stronger, deeper instability.",
  },
  {
    prompt: 'Roughly what altitude does cirrus cloud form at?',
    options: ['Below 6,500 ft', 'Around 10,000–15,000 ft', '16,000 ft and above', 'Only at ground level'],
    correct: 2,
    explanation: "It's a high cloud — well above where a paraglider flies, which is exactly why it's a warning sign rather than an immediate hazard.",
  },
]

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickQuestions(): Question[] {
  return shuffled(ALL_QUESTIONS).slice(0, QUIZ_LENGTH)
}

export function WeatherQuiz() {
  const [questions, setQuestions] = useState<Question[]>(pickQuestions)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ_LENGTH).fill(null))

  const answer = (qIndex: number, optionIndex: number) => {
    setAnswers((prev) => prev.map((a, i) => (i === qIndex ? optionIndex : a)))
  }

  const reset = () => {
    setQuestions(pickQuestions())
    setAnswers(Array(QUIZ_LENGTH).fill(null))
  }

  const answeredCount = answers.filter((a) => a !== null).length
  const correctCount = answers.filter((a, i) => a === questions[i].correct).length
  const allAnswered = answeredCount === questions.length

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Quick quiz</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {QUIZ_LENGTH} random questions from a bigger pool — reset for a different set.
          </p>
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
                : 'Worth another read through the guide above.'}{' '}
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
