import { WeatherTopic } from '../WeatherTopic'
import { WindBarb, IsobarSpacingDiagram, TroughDiagram } from '../WeatherDiagrams'
import { QuizBlock } from '../QuizBlock'
import { ALL_QUESTIONS } from '../../lib/weatherQuestions'

const QUESTIONS = ALL_QUESTIONS.filter((q) => q.section === 'symbols')

export function SymbolsSection() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Chart symbols</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The building blocks everything else on the chart is made from: isobars, wind barbs, and troughs.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <WeatherTopic
          title="Isobars & pressure"
          diagram={<IsobarSpacingDiagram />}
          tip="Use the isobar spacing around a site as a quick gut-check on wind strength before you even open a forecast."
        >
          <p>
            Isobars are lines joining points of equal pressure (usually drawn every 4 hPa). Wind flows roughly along
            them, driven by the pressure difference — the bigger that difference over a given distance, the faster
            the air moves.
          </p>
          <p>So the spacing tells you the story directly: widely spaced isobars mean light wind; tightly packed ones mean strong wind.</p>
        </WeatherTopic>

        <WeatherTopic
          title="Wind barbs"
          diagram={
            <div className="space-y-2">
              <WindBarb knots={10} label="10 kt — one full barb" />
              <WindBarb knots={25} label="25 kt — two full, one half" />
              <WindBarb knots={50} label="50 kt — one pennant" />
            </div>
          }
          tip="A quick way to spot a genuinely windy day at a glance — two or more full barbs, or any pennant, and it's probably not flyable."
        >
          <p>
            A wind barb marks wind speed and direction at a point: the shaft points the direction the wind is
            blowing from, and the "feathers" on the end encode the speed — a short half-barb is 5 knots, a full barb
            10 knots, and a solid triangular pennant 50 knots, added together.
          </p>
          <p className="text-xs text-slate-400">
            You won't see these on the surface pressure chart on the Weather page — that only plots isobars and
            fronts. Barbs turn up on separate <em>surface observation</em> (station-plot) charts, where each one
            marks the wind actually reported at a weather station.
          </p>
        </WeatherTopic>

        <WeatherTopic
          title="Troughs"
          diagram={<TroughDiagram />}
          tip="Expect a brief but sometimes sharp wind shift and a band of showers as a trough passes — check its timing against your flying window."
        >
          <p>
            A trough is an elongated dip in pressure extending out from a low, but unlike a low it has no closed
            circulation of its own — and unlike a front, it carries no triangle or semicircle markers. It's drawn
            simply as a solid black line, often lined up with a sharp kink in the isobars.
          </p>
          <p>It often behaves like a mild, scaled-down cold front: a shift in wind direction and a line of showers as it crosses.</p>
        </WeatherTopic>
      </div>

      <QuizBlock title="Section quiz" subtitle="Chart symbols" questions={QUESTIONS} />
    </div>
  )
}
