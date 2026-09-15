import { WeatherTopic } from '../WeatherTopic'
import { PressureSystemDiagram } from '../WeatherDiagrams'
import { QuizBlock } from '../QuizBlock'
import { ALL_QUESTIONS } from '../../lib/weatherQuestions'

const QUESTIONS = ALL_QUESTIONS.filter((q) => q.section === 'systems')

export function SystemsSection() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Pressure systems</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The big "H" and "L" letters on the chart, and the very different kinds of day each one usually brings.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <WeatherTopic
          title="Depression (low)"
          diagram={<PressureSystemDiagram kind="low" />}
          tip="Generally not flyable near the centre or an active front — strong, gusty, and rapidly shifting wind, plus low cloud and rain."
        >
          <p>
            An area of low pressure. Air spirals in and rises, cooling as it goes — which is why lows bring cloud,
            rain and wind. In the Northern Hemisphere the wind circles <em>anticlockwise</em> around a low, roughly
            along the isobars.
          </p>
          <p>Fronts usually trail off a low's centre — the tighter the isobars around it, the stronger the wind.</p>
        </WeatherTopic>

        <WeatherTopic
          title="Anticyclone (high)"
          diagram={<PressureSystemDiagram kind="high" />}
          tip='Usually the best flying — settled, often light wind. Watch for two traps though: a strong ridge can mean no thermals at all (pure "blue" days), and in winter it can trap fog or haze under an inversion.'
        >
          <p>
            An area of high pressure. Air sinks and spreads out at the surface, warming as it descends — which
            suppresses cloud and generally brings settled, clear weather. Wind circles <em>clockwise</em> around a
            high in the Northern Hemisphere, and is usually lighter than around a low.
          </p>
        </WeatherTopic>
      </div>

      <QuizBlock title="Section quiz" subtitle="Pressure systems" questions={QUESTIONS} />
    </div>
  )
}
