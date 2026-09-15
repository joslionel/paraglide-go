import { FrontSymbol } from './FrontSymbol'
import { WarmFrontCrossSection, ColdFrontCrossSection, PressureSystemDiagram } from './WeatherDiagrams'

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
        <h4 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
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

/** A short, illustrated introduction to reading a UK synoptic chart — fronts, depressions and anticyclones — with a paragliding-relevant takeaway for each. Not a substitute for a proper met course; just enough to make sense of the chart above. */
export function WeatherCourse() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Reading the chart</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The wiggly coloured lines are weather fronts — the leading edges of moving air masses. The dashed circles
          are isobars, joining points of equal pressure; the tighter they're packed, the stronger the wind.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      </div>
    </div>
  )
}
