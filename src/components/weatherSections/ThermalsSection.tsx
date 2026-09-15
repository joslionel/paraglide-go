import { WeatherTopic } from '../WeatherTopic'
import { ThermalDiagram } from '../WeatherDiagrams'
import { QuizBlock } from '../QuizBlock'
import { ALL_QUESTIONS } from '../../lib/weatherQuestions'

const QUESTIONS = ALL_QUESTIONS.filter((q) => q.section === 'thermals')

export function ThermalsSection() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Thermals & stability</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The chart tells you about fronts and pressure — but whether a day actually thermals well comes down to
          this instead.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <WeatherTopic
          title="How a thermal forms"
          diagram={
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The sun heats the ground unevenly — a dark ploughed field, tarmac, or a south-facing slope warms
              faster than pasture, forest or water. The air in contact with the hottest patches warms too, becomes
              less dense than the air around it, and breaks away as a rising bubble of air: a thermal.
            </p>
          }
          tip="The best trigger points are usually the same ones you'd guess from the ground — dark, dry, sun-facing surfaces near the takeoff."
        >
          <p>As it rises, that bubble of air expands (lower pressure higher up) and cools — which is where lapse rates come in.</p>
        </WeatherTopic>

        <WeatherTopic
          title="ELR, DALR & SALR"
          diagram={<ThermalDiagram />}
          tip="A steep ELR (big temperature drop with height) makes for a great thermic day; a shallow or inverted ELR near the ground — common on cold, calm mornings — suppresses thermals until it burns off, often mid-morning."
        >
          <p>
            The <strong>ELR</strong> (Environmental Lapse Rate) is how fast the actual surrounding air cools with
            height on a given day — measured from a real sounding, and different every day.
          </p>
          <p>
            The <strong>DALR</strong> (Dry Adiabatic Lapse Rate) is a fixed constant (~3°C per 1,000ft): the rate a
            rising, unsaturated parcel of air cools purely from expanding. Once it's cooled enough to form cloud,
            condensation releases heat and slows the cooling to the shallower <strong>SALR</strong> instead.
          </p>
        </WeatherTopic>

        <WeatherTopic
          title="Stability & instability"
          diagram={
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compare the rising parcel's temperature (cooling at the DALR, then SALR above cloud base) against the
              surrounding ELR at each height. Warmer than its surroundings → it keeps rising: unstable. Cooled to
              match its surroundings → it stops: that's the thermal's top, often at a stable layer or inversion.
            </p>
          }
          tip="A strongly unstable, cloudless morning that keeps heating can overdevelop into cumulonimbus by afternoon — don't assume a great thermic day stays a safe one all day."
        >
          <p>
            If the ELR is steeper than the DALR, the atmosphere is unstable throughout that layer — strong thermals,
            but also the ingredients for overdevelopment. If the ELR is shallower than the DALR (or the temperature
            even rises with height — an inversion), the air is stable: thermals are suppressed, and pollution, haze
            or fog can get trapped underneath.
          </p>
        </WeatherTopic>

        <WeatherTopic
          title="The tephigram"
          diagram={
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Built from a real early-morning balloon sounding, a tephigram plots the day's actual ELR alongside the
              DALR and SALR on one graph — exactly the comparison in the diagram above, done properly. XC pilots use
              it to forecast cloud base, thermal strength, and how high the day is likely to work.
            </p>
          }
          tip="Not essential for local hill flying, but worth knowing the name and the idea — you'll see it mentioned in most UK forecasting discussions and club talks."
        >
          <p>It's one of the more technical tools in a pilot's forecasting kit — this course only covers the underlying idea, not how to read one in full.</p>
        </WeatherTopic>
      </div>

      <QuizBlock title="Section quiz" subtitle="Thermals & stability" questions={QUESTIONS} />
    </div>
  )
}
