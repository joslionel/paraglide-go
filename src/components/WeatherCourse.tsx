import { FrontSymbol } from './FrontSymbol'
import { CloudIcon, type CloudType } from './CloudIcon'
import {
  WarmFrontCrossSection,
  ColdFrontCrossSection,
  PressureSystemDiagram,
  WindBarb,
  IsobarSpacingDiagram,
  TroughDiagram,
} from './WeatherDiagrams'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">{title}</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  )
}

function Topic({
  title,
  symbol,
  diagram,
  children,
  tip,
}: {
  title: string
  symbol?: React.ReactNode
  diagram: React.ReactNode
  children: React.ReactNode
  tip: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h5 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h5>
        {symbol}
      </div>
      <div className="mb-3 max-w-sm">{diagram}</div>
      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">{children}</div>
      <p className="mt-3 text-xs text-amber-600 dark:text-amber-500">
        <span className="font-semibold">For pilots: </span>
        {tip}
      </p>
    </div>
  )
}

const CLOUDS: { type: CloudType; name: string; blurb: string; tip: string }[] = [
  {
    type: 'cirrus',
    name: 'Cirrus',
    blurb: 'High (16,000ft+), thin, wispy — made of ice crystals. Fair weather on its own.',
    tip: "Often the first visible sign of a warm front, a day or more before the rain arrives — worth checking the chart if you see it thickening.",
  },
  {
    type: 'stratus',
    name: 'Stratus',
    blurb: 'Low, flat, featureless grey layer — forms in stable air, sometimes with drizzle.',
    tip: 'Usually a no-go day — poor visibility, weak or no thermals, and sometimes hill fog right at launch.',
  },
  {
    type: 'cumulus',
    name: 'Cumulus',
    blurb: 'Fluffy, flat-bottomed heaps, growing from rising thermals in unstable air.',
    tip: "The classic thermic-soaring marker — the flat base is roughly the top of the lift below it.",
  },
  {
    type: 'cumulonimbus',
    name: 'Cumulonimbus',
    blurb: 'A cumulus that has grown explosively tall — heavy showers, thunder, hail.',
    tip: 'Land immediately if one is building nearby — severe turbulence, lightning and violent gusts.',
  },
]

/** A short, illustrated introduction to reading a UK synoptic chart — the symbols (isobars, wind barbs, troughs), fronts, pressure systems, and the cloud types tied to each — with a paragliding-relevant takeaway throughout. Not a substitute for a proper met course; just enough to make sense of the chart above. */
export function WeatherCourse() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Reading the chart</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Everything on the chart above is built from a handful of symbols. Here's what each one means, and the sky
          evidence that confirms it.
        </p>
      </div>

      <Section title="Chart symbols">
        <Topic title="Isobars & pressure" diagram={<IsobarSpacingDiagram />} tip="Use the isobar spacing around a site as a quick gut-check on wind strength before you even open a forecast.">
          <p>
            Isobars are lines joining points of equal pressure (usually drawn every 4 hPa). Wind flows roughly along
            them, driven by the pressure difference — the bigger that difference over a given distance, the faster
            the air moves.
          </p>
          <p>So the spacing tells you the story directly: widely spaced isobars mean light wind; tightly packed ones mean strong wind.</p>
        </Topic>

        <Topic
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
            You won't see these on the surface pressure chart above — that only plots isobars and fronts. Barbs turn
            up on separate <em>surface observation</em> (station-plot) charts, where each one marks the wind actually
            reported at a weather station.
          </p>
        </Topic>

        <Topic
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
        </Topic>
      </Section>

      <Section title="Fronts">
        <Topic title="Warm front" symbol={<FrontSymbol type="warm" className="h-6 w-24" />} diagram={<WarmFrontCrossSection />} tip="Watch for the long build-up beforehand — thickening high cloud a day out is often the first sign, well before the rain and low cloud arrive.">
          <p>
            The leading edge of an advancing mass of warmer air. Because warm air is lighter, it doesn't push the
            cold air aside — it rides up and over it, on a very shallow slope (roughly 1 in 150).
          </p>
          <p>
            That shallow slope is why warm fronts announce themselves hours in advance: high, thin cirrus cloud
            thickens gradually into a grey overcast, then steady, prolonged rain as the front gets close. After it
            passes, the rain usually eases but it often stays cloudy, murky and milder.
          </p>
        </Topic>

        <Topic title="Cold front" symbol={<FrontSymbol type="cold" className="h-6 w-24" />} diagram={<ColdFrontCrossSection />} tip="The passage itself is the danger — sudden gusts, a wind shift, and possible thunderstorms or rotor. Be on the ground well before it arrives, not during.">
          <p>
            The leading edge of advancing colder air. Cold air is denser, so instead of riding over the warm air
            ahead of it, it undercuts and shoves it abruptly upwards — a much steeper slope (roughly 1 in 50).
          </p>
          <p>
            That abruptness is why cold fronts hit harder and faster than warm ones: a narrower band of heavier,
            sometimes thundery showers, squally gusts, and a sharp wind shift, followed by rapid clearance to bright,
            cold, "washed" air behind it.
          </p>
        </Topic>

        <Topic
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
        </Topic>

        <Topic
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
        </Topic>
      </Section>

      <Section title="Pressure systems">
        <Topic title="Depression (low)" diagram={<PressureSystemDiagram kind="low" />} tip="Generally not flyable near the centre or an active front — strong, gusty, and rapidly shifting wind, plus low cloud and rain.">
          <p>
            An area of low pressure. Air spirals in and rises, cooling as it goes — which is why lows bring cloud,
            rain and wind. In the Northern Hemisphere the wind circles <em>anticlockwise</em> around a low, roughly
            along the isobars.
          </p>
          <p>Fronts usually trail off a low's centre — the tighter the isobars around it, the stronger the wind.</p>
        </Topic>

        <Topic title="Anticyclone (high)" diagram={<PressureSystemDiagram kind="high" />} tip="Usually the best flying — settled, often light wind. Watch for two traps though: a strong ridge can mean no thermals at all (pure &quot;blue&quot; days), and in winter it can trap fog or haze under an inversion.">
          <p>
            An area of high pressure. Air sinks and spreads out at the surface, warming as it descends — which
            suppresses cloud and generally brings settled, clear weather. Wind circles <em>clockwise</em> around a
            high in the Northern Hemisphere, and is usually lighter than around a low.
          </p>
        </Topic>
      </Section>

      <div>
        <h4 className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">Clouds to know</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CLOUDS.map((c) => (
            <div key={c.type} className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
              <CloudIcon type={c.type} className="mx-auto h-16 w-16" />
              <h5 className="mt-2 font-semibold text-slate-800 dark:text-slate-100">{c.name}</h5>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.blurb}</p>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">{c.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
