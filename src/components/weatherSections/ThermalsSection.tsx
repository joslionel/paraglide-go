import { WeatherTopic } from '../WeatherTopic'
import { ThermalDiagram } from '../WeatherDiagrams'
import { QuizBlock } from '../QuizBlock'
import { ALL_QUESTIONS } from '../../lib/weatherQuestions'

const QUESTIONS = ALL_QUESTIONS.filter((q) => q.section === 'thermals')

function TephigramExample({ elrEnd, cloudBase, parcelTop, title, blurb }: { elrEnd: [number, number]; cloudBase: [number, number] | null; parcelTop: [number, number]; title: string; blurb: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <ThermalDiagram elrEnd={elrEnd} cloudBase={cloudBase} parcelTop={parcelTop} minimal />
      <h6 className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h6>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{blurb}</p>
    </div>
  )
}

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
          title="Understanding lapse rate"
          diagram={
            <p className="text-sm text-slate-500 dark:text-slate-400">
              "Lapse rate" just means how fast temperature falls as you go up. There's a single internationally
              agreed <strong>standard</strong> figure, used as a rough global average for things like aircraft
              instruments: about 2°C per 1,000ft (roughly 6.5°C per km). Real days rarely match it exactly — which
              is exactly why the three specific rates below matter more for flying than that one average number.
            </p>
          }
          tip="If a forecast sounding shows a much steeper lapse rate than the 2°C/1,000ft standard, expect a strongly thermic day; much shallower (or inverted), expect a stable, sluggish one."
        >
          <p>
            None of ELR, DALR or SALR are that standard figure — each answers a different question, and only one of
            them (DALR) is ever truly fixed.
          </p>
        </WeatherTopic>

        <WeatherTopic
          title="ELR, DALR & SALR"
          diagram={<ThermalDiagram />}
          tip="A steep ELR (big temperature drop with height) makes for a great thermic day; a shallow or inverted ELR near the ground — common on cold, calm mornings — suppresses thermals until it burns off, often mid-morning."
        >
          <p>
            The <strong>ELR</strong> (Environmental Lapse Rate) is how fast the actual surrounding air cools with
            height on a given day — measured from a real sounding, and different every day. This is the one line on
            the graph that isn't a fixed constant.
          </p>
          <p>
            The <strong>DALR</strong> (Dry Adiabatic Lapse Rate) is a fixed constant, about 3°C per 1,000ft (~9.8°C
            per km): the rate a rising, unsaturated parcel of air cools purely from expanding as pressure drops.
            It's fixed because it comes straight from the physics of an expanding gas — nothing about the weather on
            a particular day changes it.
          </p>
          <p>
            The <strong>SALR</strong> (Saturated Adiabatic Lapse Rate) takes over once the parcel has cooled enough
            for its water vapour to condense into cloud, at cloud base. Condensation releases latent heat into the
            rising air, which partly offsets the cooling — so the SALR is always shallower than the DALR, typically
            around 1.5–3°C per 1,000ft. Unlike the DALR, it isn't one fixed number: it's steeper (closer to the
            DALR) in cold, dry air with little moisture left to release, and much shallower in warm, moist air with
            plenty of condensation still happening.
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
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h5 className="font-semibold text-slate-800 dark:text-slate-100">Reading a tephigram</h5>
        <p className="mt-1 mb-3 text-sm text-slate-600 dark:text-slate-400">
          Built from a real early-morning balloon sounding, a tephigram plots the day's actual ELR alongside the
          DALR and SALR on one graph — exactly the comparison above, done properly, with the ground's forecast
          starting temperature added in. XC pilots use it to forecast cloud base, thermal strength, and how high the
          day is likely to work. It's one of the more technical tools in a pilot's forecasting kit — this course
          only covers the underlying idea, not how to read a real one in full — but the shape of the lines tells a
          consistent story wherever you see it. A few examples, in the same style as the diagram above:
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TephigramExample
            elrEnd={[90, 30]}
            cloudBase={[190, 120]}
            parcelTop={[150, 45]}
            title="Strong thermic day"
            blurb="Steep ELR all the way up — the parcel stays well warmer than its surroundings to a good height before capping."
          />
          <TephigramExample
            elrEnd={[170, 70]}
            cloudBase={null}
            parcelTop={[200, 140]}
            title="Capped, stable morning"
            blurb="Shallow ELR near the ground — a straight DALR parcel line crosses back almost immediately. Weak, low, easily-capped thermals until it breaks down."
          />
          <TephigramExample
            elrEnd={[100, 25]}
            cloudBase={[200, 130]}
            parcelTop={[140, 30]}
            title="Deep, moist instability"
            blurb="The parcel stays much warmer than the ELR even high up — the classic recipe for rapid overdevelopment into cumulonimbus."
          />
        </div>
      </div>

      <QuizBlock title="Section quiz" subtitle="Thermals & stability" questions={QUESTIONS} />
    </div>
  )
}
