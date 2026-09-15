import { CloudIcon, type CloudType } from '../CloudIcon'
import { QuizBlock } from '../QuizBlock'
import { ALL_QUESTIONS } from '../../lib/weatherQuestions'

const QUESTIONS = ALL_QUESTIONS.filter((q) => q.section === 'clouds')

const CLOUDS: { type: CloudType; name: string; tier: string; blurb: string; tip: string }[] = [
  {
    type: 'cirrus',
    name: 'Cirrus',
    tier: 'High — 16,000ft+',
    blurb: 'Thin, wispy — made of ice crystals. Fair weather on its own.',
    tip: 'Often the first visible sign of a warm front, a day or more before the rain arrives.',
  },
  {
    type: 'altostratus',
    name: 'Altostratus',
    tier: 'Medium — 6,500–20,000ft',
    blurb: 'A fairly uniform grey sheet — the sun often looks like a dim disc through it.',
    tip: "The next stage after cirrus as a warm front thickens further, ahead of the rain proper.",
  },
  {
    type: 'altocumulus',
    name: 'Altocumulus',
    tier: 'Medium — 6,500–20,000ft',
    blurb: 'Patchy, rippled white or grey clumps rather than one sheet.',
    tip: 'Often just fair-weather mid cloud — but lumpier, turreted versions can hint at instability building aloft.',
  },
  {
    type: 'stratus',
    name: 'Stratus',
    tier: 'Low — below 6,500ft',
    blurb: 'Flat, featureless grey layer — forms in stable air, sometimes with drizzle.',
    tip: 'Usually a no-go day — poor visibility, weak or no thermals, and sometimes hill fog right at launch.',
  },
  {
    type: 'cumulus',
    name: 'Cumulus',
    tier: 'Low base, grows upward',
    blurb: 'Fluffy, flat-bottomed heaps, growing from rising thermals in unstable air.',
    tip: 'The classic thermic-soaring marker — the flat base is roughly the top of the lift below it.',
  },
  {
    type: 'cumulonimbus',
    name: 'Cumulonimbus',
    tier: 'Low base, towers very high',
    blurb: 'A cumulus that has grown explosively tall — heavy showers, thunder, hail.',
    tip: 'Land immediately if one is building nearby — severe turbulence, lightning and violent gusts.',
  },
]

const FOGS: { name: string; blurb: string; tip: string }[] = [
  {
    name: 'Radiation fog',
    blurb: 'Forms on clear, calm nights as the ground radiates heat away, cooling the air right above it below its dew point. Common in valleys, usually clears once the sun warms the ground.',
    tip: 'A perfectly clear, calm forecast can still mean a fogged-in site first thing — check overnight conditions, not just the daytime forecast.',
  },
  {
    name: 'Advection fog',
    blurb: 'Forms when relatively warm, moist air moves over a colder surface — classically "sea fog" where warm air drifts over a still-cold sea. Can persist for days, unlike radiation fog.',
    tip: "Coastal sites can stay fogged in for extended spells even when it's clear a few miles inland.",
  },
  {
    name: 'Hill fog',
    blurb: "Not a distinct fog type at all — just ordinary cloud (often stratus) that happens to be sitting at or below the height of the hill or mountain.",
    tip: 'If forecast cloud base is at or below your takeoff height, expect zero-visibility "fog" at launch regardless of the word "fog" appearing anywhere in the forecast.',
  },
]

export function CloudsSection() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Clouds & fog</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The sky evidence that confirms what the chart is telling you — and a few things that aren't clouds at all.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CLOUDS.map((c) => (
          <div key={c.type} className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <CloudIcon type={c.type} className="mx-auto h-16 w-16" />
            <h5 className="mt-2 font-semibold text-slate-800 dark:text-slate-100">{c.name}</h5>
            <p className="text-[11px] text-slate-400">{c.tier}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.blurb}</p>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">{c.tip}</p>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h4 className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">Fog types</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FOGS.map((f) => (
            <div key={f.name} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h5 className="font-semibold text-slate-800 dark:text-slate-100">{f.name}</h5>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{f.blurb}</p>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                <span className="font-semibold">For pilots: </span>
                {f.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      <QuizBlock title="Section quiz" subtitle="Clouds & fog" questions={QUESTIONS} />
    </div>
  )
}
