import { WeatherTopic } from '../WeatherTopic'
import { ValleyWindDiagram, SeaBreezeDiagram, WaveLiftDiagram } from '../WeatherDiagrams'
import { QuizBlock } from '../QuizBlock'
import { ALL_QUESTIONS } from '../../lib/weatherQuestions'

const QUESTIONS = ALL_QUESTIONS.filter((q) => q.section === 'wind')

export function WindSection() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Local winds</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Small-scale winds driven by the local terrain and the sun, layered on top of whatever the chart shows —
          often the difference between a flyable site and a dud one on the day.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <WeatherTopic
          title="Valley winds: anabatic & katabatic"
          diagram={<ValleyWindDiagram />}
          tip="Expect a gentle downslope drift first thing, through calm, to a building upslope breeze as the sun gets to work — and the reverse again as it sets. Valley floors can hold cold, still air long after the tops are flying nicely."
        >
          <p>
            By day, sun-warmed slopes heat the air in contact with them faster than the free air at the same
            height — that warmed air rises up the slope, an <strong>anabatic</strong> (upslope) wind, building
            through the morning.
          </p>
          <p>
            By night, slopes radiate heat away and cool faster than the free air — the now-denser air sinks back
            down the slope, a <strong>katabatic</strong> (downslope, or drainage) wind, often pooling as cold, still
            air in the valley floor.
          </p>
        </WeatherTopic>

        <WeatherTopic
          title="Sea breezes & sea-breeze fronts"
          diagram={<SeaBreezeDiagram />}
          tip="A genuinely useful, very local wind shift at coastal sites — expect the wind to swing onshore and often pick up through the afternoon, sometimes with a noticeable, even turbulent, boundary as the front itself passes overhead."
        >
          <p>
            Land heats up far faster than the sea in sunshine. As warm air rises over the land, cooler air flows in
            from the sea to replace it at the surface — the sea breeze, usually starting late morning and
            strengthening into the afternoon.
          </p>
          <p>
            The leading edge of that cooler, moister sea air pushing inland is the <strong>sea-breeze front</strong>{' '}
            — it behaves a bit like a miniature cold front, sometimes triggering a narrow line of cumulus where it
            undercuts the warmer land air.
          </p>
        </WeatherTopic>

        <WeatherTopic
          title="Wave lift"
          diagram={<WaveLiftDiagram />}
          tip="Smooth, powerful lift if you can get into the wave itself — but treat any rotor beneath it, and the turbulent lee side of the hill generally in a strong wind, as a serious hazard."
        >
          <p>
            A strong, fairly steady wind crossing a ridge or mountain range can be deflected into a series of smooth,
            standing oscillations downwind — fixed relative to the ground even though the air itself is racing
            through them. Pilots have soared to great heights in this lift.
          </p>
          <p>
            Lens-shaped <strong>lenticular</strong> clouds sitting motionless at the wave crests, even in strong
            wind, are the classic visual giveaway. Underneath, on the lee side near the ground, the disturbed
            return flow can form violently turbulent <strong>rotor</strong>.
          </p>
        </WeatherTopic>
      </div>

      <QuizBlock title="Section quiz" subtitle="Local winds" questions={QUESTIONS} />
    </div>
  )
}
