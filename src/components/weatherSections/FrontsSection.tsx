import { FrontSymbol } from '../FrontSymbol'
import { WeatherTopic } from '../WeatherTopic'
import { WarmFrontCrossSection, ColdFrontCrossSection, VeerBackDiagram } from '../WeatherDiagrams'
import { QuizBlock } from '../QuizBlock'
import { ALL_QUESTIONS } from '../../lib/weatherQuestions'

const QUESTIONS = ALL_QUESTIONS.filter((q) => q.section === 'fronts')

export function FrontsSection() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Fronts</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The wiggly coloured lines on the chart — the leading edges of moving air masses, and the wind shifts that
          come with them.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <WeatherTopic
          title="Warm front"
          symbol={<FrontSymbol type="warm" className="h-6 w-24" />}
          diagram={<WarmFrontCrossSection />}
          tip="Watch for the long build-up beforehand — thickening high cloud a day out is often the first sign, well before the rain and low cloud arrive."
        >
          <p>
            The leading edge of an advancing mass of warmer air. Because warm air is lighter, it doesn't push the
            cold air aside — it rides up and over it, on a very shallow slope (roughly 1 in 150).
          </p>
          <p>
            That shallow slope is why warm fronts announce themselves hours in advance: high, thin cirrus cloud
            thickens gradually into a grey overcast, then steady, prolonged rain as the front gets close. After it
            passes, the rain usually eases but it often stays cloudy, murky and milder.
          </p>
        </WeatherTopic>

        <WeatherTopic
          title="Cold front"
          symbol={<FrontSymbol type="cold" className="h-6 w-24" />}
          diagram={<ColdFrontCrossSection />}
          tip="The passage itself is the danger — sudden gusts, a wind shift, and possible thunderstorms or rotor. Be on the ground well before it arrives, not during."
        >
          <p>
            The leading edge of advancing colder air. Cold air is denser, so instead of riding over the warm air
            ahead of it, it undercuts and shoves it abruptly upwards — a much steeper slope (roughly 1 in 50).
          </p>
          <p>
            That abruptness is why cold fronts hit harder and faster than warm ones: a narrower band of heavier,
            sometimes thundery showers, squally gusts, and a sharp wind shift, followed by rapid clearance to bright,
            cold, "washed" air behind it.
          </p>
        </WeatherTopic>

        <WeatherTopic
          title="Occluded front"
          symbol={<FrontSymbol type="occluded" className="h-6 w-24" />}
          diagram={
            <div className="flex items-center gap-3 py-4">
              <FrontSymbol type="warm" className="h-10 w-20 -mr-6" />
              <span className="text-xl text-slate-400">+</span>
              <FrontSymbol type="cold" className="h-10 w-20 -ml-6" />
            </div>
          }
          tip="A sign the depression is past its most active phase — expect an extended grey, wet spell rather than a sharp, violent change, though it's still rarely flyable."
        >
          <p>
            Cold fronts move faster than warm fronts, so a cold front often catches up with the warm front ahead of
            it in a maturing depression — squeezing the warm air up off the ground entirely. The result is a hybrid
            symbol: alternating triangles and semicircles on the same side of the line.
          </p>
          <p>The weather is a blend of both — usually extended cloud and rain, but rarely as intense as a fresh cold front.</p>
        </WeatherTopic>

        <WeatherTopic
          title="Stationary front"
          symbol={<FrontSymbol type="stationary" className="h-6 w-24" />}
          diagram={
            <div className="flex items-center gap-3 py-4">
              <FrontSymbol type="stationary" className="h-10 w-40" />
            </div>
          }
          tip="A front stalled nearby often means several days of marginal, changeable conditions rather than one clean weather change — expect it to flip from one side's weather to the other with little warning."
        >
          <p>
            Sometimes neither air mass is strong enough to displace the other, and the boundary between them barely
            moves for a day or more. The symbol reflects that stand-off: warm-front semicircles and cold-front
            triangles sit on <em>opposite</em> sides of the same line, rather than crowding onto one side like an
            occluded front.
          </p>
          <p>Expect a prolonged spell of cloud and on-and-off rain right along the boundary — it can sit there for days before something finally shifts it.</p>
        </WeatherTopic>

        <WeatherTopic
          title="Wind shifts: veer & back"
          diagram={<VeerBackDiagram />}
          tip="A wind that's steadily veering through the day is a fairly normal, reassuring pattern; a wind that suddenly backs sharply is worth paying closer attention to."
        >
          <p>
            Two terms worth knowing alongside the fronts themselves: a <strong>veering</strong> wind shifts{' '}
            <em>clockwise</em> over time (say, south round to west); a <strong>backing</strong> wind shifts{' '}
            <em>anticlockwise</em> (west round to south).
          </p>
          <p>Both a warm front and a cold front passing typically make the wind veer — it's the classic pattern across a depression's warm sector.</p>
        </WeatherTopic>
      </div>

      <QuizBlock title="Section quiz" subtitle="Fronts" questions={QUESTIONS} />
    </div>
  )
}
