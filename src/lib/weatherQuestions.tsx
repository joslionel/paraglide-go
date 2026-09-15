import type { ReactNode } from 'react'
import { FrontSymbol, type FrontType } from '../components/FrontSymbol'
import { WindBarb } from '../components/WeatherDiagrams'

export type SectionId = 'symbols' | 'fronts' | 'systems' | 'clouds' | 'thermals' | 'wind'

export interface Question {
  section: SectionId
  prompt: string
  visual?: ReactNode
  options: string[]
  correct: number
  explanation: string
}

function frontVisual(type: FrontType) {
  return <FrontSymbol type={type} className="h-6 w-20 shrink-0" />
}

export const ALL_QUESTIONS: Question[] = [
  // ---- Chart symbols: isobars, pressure, wind barbs, troughs ----
  {
    section: 'symbols',
    prompt: 'What do isobars on a chart join together?',
    options: ['Points of equal temperature', 'Points of equal pressure', 'Points of equal wind speed', 'Points of equal humidity'],
    correct: 1,
    explanation: "Isobars connect points of equal atmospheric pressure — that's literally what the name means (iso- \"equal\", -bar \"pressure\").",
  },
  {
    section: 'symbols',
    prompt: 'On the chart, tightly packed isobars (close together) indicate…',
    options: ['Calm conditions', 'Strong wind', 'Heavy rain, regardless of wind', 'Clear skies'],
    correct: 1,
    explanation: 'The closer the isobars, the steeper the pressure gradient — and the stronger the wind.',
  },
  {
    section: 'symbols',
    prompt: 'Widely spaced isobars generally indicate…',
    options: ['Strong wind', 'Light wind', 'Imminent thunderstorms', 'No wind at all'],
    correct: 1,
    explanation: 'A gentle pressure gradient over distance means a gentler push on the air — lighter wind.',
  },
  {
    section: 'symbols',
    prompt: 'On a wind barb, what do the "feathers" at the end represent?',
    options: ['Wind direction', 'Wind speed', 'Air pressure', 'Temperature'],
    correct: 1,
    explanation: 'The shaft shows direction (pointing the way the wind blows from); the feathers on the end encode speed.',
  },
  {
    section: 'symbols',
    prompt: 'On a wind barb, one full-length feather represents approximately…',
    options: ['5 knots', '10 knots', '25 knots', '50 knots'],
    correct: 1,
    explanation: 'A half barb is ~5 knots, a full barb ~10 knots, and a solid pennant (triangle) ~50 knots — added together for the total.',
  },
  {
    section: 'symbols',
    prompt: 'On a wind barb, a solid filled triangle (pennant) represents approximately…',
    options: ['5 knots', '10 knots', '25 knots', '50 knots'],
    correct: 3,
    explanation: "Pennants are the big jump in the encoding — one is worth five full barbs' worth of speed.",
  },
  {
    section: 'symbols',
    prompt: 'Roughly how strong is the wind shown by this barb?',
    visual: <WindBarb knots={25} />,
    options: ['Calm', 'About 10 knots', 'About 25 knots', 'About 50+ knots'],
    correct: 2,
    explanation: 'Two full barbs (10 kt each) plus one half barb (5 kt) = 25 knots.',
  },
  {
    section: 'symbols',
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
    section: 'symbols',
    prompt: 'What weather does a trough passage often bring?',
    options: ['A brief windshift and a band of showers', 'Weeks of settled sunshine', 'No noticeable change at all', 'A sudden rise in temperature only'],
    correct: 0,
    explanation: 'Similar in miniature to a cold front — a shift in wind direction and a line of showers as it crosses.',
  },
  {
    section: 'symbols',
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

  // ---- Fronts ----
  {
    section: 'fronts',
    prompt: 'Which front does this symbol represent?',
    visual: frontVisual('cold'),
    options: ['Warm front', 'Cold front', 'Occluded front', 'Anticyclone'],
    correct: 1,
    explanation: 'Triangles pointing the direction of travel — the front is a steep, fast-moving wedge of cold air undercutting the warmer air ahead.',
  },
  {
    section: 'fronts',
    prompt: 'Which front does this symbol represent?',
    visual: frontVisual('warm'),
    options: ['Warm front', 'Cold front', 'Occluded front', 'Anticyclone'],
    correct: 0,
    explanation: 'Semicircles pointing the direction of travel — warm air riding up and over retreating cold air on a shallow slope.',
  },
  {
    section: 'fronts',
    prompt: 'Which front does this symbol represent?',
    visual: frontVisual('occluded'),
    options: ['Warm front', 'Cold front', 'Occluded front', 'A ridge of high pressure'],
    correct: 2,
    explanation: "Alternating triangles and semicircles on the same side — a cold front that's caught up with the warm front ahead of it.",
  },
  {
    section: 'fronts',
    prompt: 'Which front does this symbol represent?',
    visual: frontVisual('stationary'),
    options: ['Warm front', 'Occluded front', 'Stationary front', 'A trough'],
    correct: 2,
    explanation: 'Warm-front semicircles and cold-front triangles on opposite sides of the line — neither air mass is winning, so the boundary is holding roughly still.',
  },
  {
    section: 'fronts',
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
    section: 'fronts',
    prompt: 'Which type of front typically gives the longest, steadiest build-up of rain as it approaches?',
    options: ['Cold front', 'Warm front', 'Occluded front', "None — fronts don't affect rainfall"],
    correct: 1,
    explanation: 'Warm fronts are shallow-sloped and slow, so the cloud and rain sequence unfolds gradually over many hours as it approaches.',
  },
  {
    section: 'fronts',
    prompt: 'What typically happens right after a cold front passes?',
    options: ['Drizzle continues for hours', 'Rapid clearance to bright, colder air', 'Pressure keeps falling sharply', 'Wind drops to completely calm'],
    correct: 1,
    explanation: 'The cold, unstable air behind a cold front usually clears quickly to bright skies — though it can stay showery and gusty for a while.',
  },
  {
    section: 'fronts',
    prompt: 'An occluded front forms when…',
    options: ['A warm front catches up with a cold front', 'A cold front catches up with the warm front ahead of it', 'High pressure builds over a depression', 'Two warm fronts merge'],
    correct: 1,
    explanation: 'Cold fronts move faster than warm fronts, so in a maturing depression they eventually catch up and lift the warm sector clear of the ground.',
  },
  {
    section: 'fronts',
    prompt: "A wind that 'veers' is one that…",
    options: ['Changes direction clockwise over time', 'Changes direction anticlockwise over time', 'Increases in speed only', 'Drops to calm'],
    correct: 0,
    explanation: 'Veering is a clockwise shift — e.g. from south, through southwest, to west — classically seen as a warm front or cold front passes.',
  },
  {
    section: 'fronts',
    prompt: "A wind that 'backs' is one that…",
    options: ['Changes direction clockwise', 'Changes direction anticlockwise over time', 'Only happens at night', 'Is a sign of an anticyclone'],
    correct: 1,
    explanation: "Backing is the opposite of veering — an anticlockwise shift. It's the less usual pattern ahead of a normal depression, worth noticing.",
  },

  // ---- Pressure systems ----
  {
    section: 'systems',
    prompt: 'In the Northern Hemisphere, which way does wind circulate around a depression (low)?',
    options: ['Clockwise', 'Anticlockwise', "It doesn't rotate", 'Depends on the season'],
    correct: 1,
    explanation: 'Air spirals inward and rises around a low — anticlockwise in the Northern Hemisphere.',
  },
  {
    section: 'systems',
    prompt: 'In the Northern Hemisphere, which way does wind circulate around an anticyclone (high)?',
    options: ['Clockwise', 'Anticlockwise', "It doesn't rotate", 'Depends on the season'],
    correct: 0,
    explanation: 'Air sinks and spreads out around a high — clockwise in the Northern Hemisphere, usually more gently than around a low.',
  },
  {
    section: 'systems',
    prompt: 'Which pressure system generally gives the best flying conditions?',
    options: ['A depression', 'An anticyclone', 'An occluded front', 'A cold front, while it passes'],
    correct: 1,
    explanation: 'Settled, often lighter wind — though watch for no-thermal "blue" days under a strong ridge, or fog trapped under a winter inversion.',
  },

  // ---- Clouds ----
  {
    section: 'clouds',
    prompt: 'Which cloud is typically the first visible sign of an approaching warm front, sometimes a day or more ahead?',
    options: ['Cumulonimbus', 'Stratus', 'Cirrus', 'Cumulus'],
    correct: 2,
    explanation: 'High, thin cirrus thickening gradually is the classic early warning of a warm front, well before the rain arrives.',
  },
  {
    section: 'clouds',
    prompt: 'Cirrus cloud is made mostly of…',
    options: ['Water droplets', 'Ice crystals', 'Dust', 'Pollen'],
    correct: 1,
    explanation: "It forms so high up (16,000 ft+) that it's far too cold for liquid water — hence the wispy, ice-crystal look.",
  },
  {
    section: 'clouds',
    prompt: 'Roughly what altitude does cirrus cloud form at?',
    options: ['Below 6,500 ft', 'Around 10,000–15,000 ft', '16,000 ft and above', 'Only at ground level'],
    correct: 2,
    explanation: "It's a high cloud — well above where a paraglider flies, which is exactly why it's a warning sign rather than an immediate hazard.",
  },
  {
    section: 'clouds',
    prompt: 'Which cloud type is a flat, featureless grey layer often linked to stable, murky conditions or drizzle?',
    options: ['Cirrus', 'Stratus', 'Cumulus', 'Cumulonimbus'],
    correct: 1,
    explanation: 'Stratus forms in stable air as a flat, low layer — usually a poor-visibility, weak-or-no-thermals kind of day.',
  },
  {
    section: 'clouds',
    prompt: 'Which cloud marks the top of a rising thermal and is generally a good sign for soaring?',
    options: ['Stratus', 'Cirrus', 'Cumulus', 'Cumulonimbus'],
    correct: 2,
    explanation: "Cumulus forms where a rising thermal cools enough to condense — its flat base roughly marks the top of the lift below it.",
  },
  {
    section: 'clouds',
    prompt: 'Which cloud type carries the highest risk to a pilot — heavy showers, lightning, hail and severe turbulence?',
    options: ['Cirrus', 'Stratus', 'Cumulus', 'Cumulonimbus'],
    correct: 3,
    explanation: 'Land immediately if one is building nearby — cumulonimbus brings some of the most violent weather in the sky.',
  },
  {
    section: 'clouds',
    prompt: 'A cumulonimbus is essentially…',
    options: [
      'A completely different cloud from cumulus',
      'A cumulus cloud that has grown explosively tall in very unstable air',
      'A type of stratus cloud',
      'A cloud that only forms over the sea',
    ],
    correct: 1,
    explanation: 'Same family as the friendly fair-weather cumulus — just fed by much stronger, deeper instability.',
  },
  {
    section: 'clouds',
    prompt: 'Altostratus is best described as…',
    options: ['A high, wispy ice cloud', 'A mid-level, fairly uniform grey sheet the sun looks dim through', 'A low, dark storm cloud', 'A patchy, sheep-like mid-level cloud'],
    correct: 1,
    explanation: 'A mid-level layer cloud — often the next stage after cirrus as a warm front continues to thicken.',
  },
  {
    section: 'clouds',
    prompt: 'Which fog forms on clear, calm nights as the ground radiates heat away?',
    options: ['Advection fog', 'Radiation fog', 'Hill fog', 'Sea fog'],
    correct: 1,
    explanation: 'Classic overnight valley fog — usually clears once the sun gets to work on the ground after sunrise.',
  },
  {
    section: 'clouds',
    prompt: 'Which type of fog is common along UK coasts when relatively warm, moist air moves over the colder sea?',
    options: ['Radiation fog', 'Advection fog', 'Hill fog', 'Valley fog'],
    correct: 1,
    explanation: "This one can sit for days rather than burning off by mid-morning like radiation fog does — it isn't tied to the overnight radiation cycle.",
  },
  {
    section: 'clouds',
    prompt: "'Hill fog' is really just…",
    options: [
      'A unique fog type found nowhere else',
      'Ordinary cloud (often stratus) that happens to be sitting at or below the height of the high ground',
      'Fog caused specifically by wind turbines',
      'A rare, once-a-decade phenomenon',
    ],
    correct: 1,
    explanation: "Directly relevant on a hill launch — if forecast cloud base is at or below takeoff height, expect zero-visibility hill fog regardless of the word \"fog\" appearing anywhere.",
  },

  // ---- Thermals, lapse rates & stability ----
  {
    section: 'thermals',
    prompt: 'What is the DALR (Dry Adiabatic Lapse Rate)?',
    options: [
      'The rate the surrounding air actually cools with height on a given day',
      'The fixed rate a rising, unsaturated air parcel cools as it expands (~3°C per 1,000ft)',
      'The rate air cools once cloud has formed',
      'A type of front',
    ],
    correct: 1,
    explanation: "It's a fixed physical constant of dry air — unlike the ELR, it doesn't change from day to day.",
  },
  {
    section: 'thermals',
    prompt: 'What is the ELR (Environmental Lapse Rate)?',
    options: [
      'A fixed physical constant, the same every day',
      "The actual measured rate the surrounding air's temperature falls with height on a given day",
      'The rate of cooling inside a cloud only',
      'Only relevant in summer',
    ],
    correct: 1,
    explanation: "This is the one that varies — measured from a real sounding — and it's what you compare against the DALR/SALR to judge stability.",
  },
  {
    section: 'thermals',
    prompt: "Once a rising thermal's air has cooled enough to form cloud, it continues cooling at roughly…",
    options: ['The DALR, unchanged', 'A slower rate, the SALR, because condensation releases heat', 'A faster rate than before', 'It stops cooling entirely'],
    correct: 1,
    explanation: 'Condensation releases latent heat into the rising air, slowing its cooling — which is part of why cloudy thermals can punch on up so effectively.',
  },
  {
    section: 'thermals',
    prompt: 'Air is described as unstable when…',
    options: [
      'A rising parcel is always colder than its surroundings',
      'A rising parcel stays warmer than its surroundings, so it keeps accelerating upward',
      "There's no wind at all",
      'Pressure is very high',
    ],
    correct: 1,
    explanation: "Warmer-than-surroundings means less dense — it keeps rising under its own buoyancy. That's what makes a thermal work.",
  },
  {
    section: 'thermals',
    prompt: "A thermal typically stops rising (reaches its 'top') when…",
    options: ['It reaches 10,000ft, always', 'Its temperature cools to match the surrounding air', 'It has been rising for exactly one hour', 'The pilot chooses to stop'],
    correct: 1,
    explanation: 'Once it\'s no longer warmer than its surroundings it loses its buoyancy — often at a stable layer or inversion that caps further rise.',
  },
  {
    section: 'thermals',
    prompt: 'A tephigram is best described as…',
    options: [
      'A type of cloud',
      'A graph plotting temperature against height, used to assess stability, cloud base and likely thermal strength',
      'A synonym for a depression',
      'A wind barb variant',
    ],
    correct: 1,
    explanation: "Built from a real morning balloon sounding, it's the tool behind exactly the ELR-vs-DALR/SALR comparison covered in this section.",
  },

  // ---- Local winds: valley winds, sea breezes, wave ----
  {
    section: 'wind',
    prompt: 'An anabatic wind is…',
    options: [
      'A downslope wind that develops at night as slopes cool',
      'An upslope wind that develops during the day as sun-warmed slopes heat the air against them',
      'Another name for a sea breeze',
      'Only found at the coast',
    ],
    correct: 1,
    explanation: 'Warmed air rises up the sun-facing slope, often building through the morning into a useful soaring breeze.',
  },
  {
    section: 'wind',
    prompt: 'A katabatic wind is…',
    options: ['An upslope daytime wind', 'A downslope wind that develops at night as slopes radiate heat away and cool', 'A wind found only above 10,000ft', 'Another name for wave lift'],
    correct: 1,
    explanation: 'Cooled, denser air sinks down the slope under gravity — a classic cause of cold, still air pooling in valley floors overnight.',
  },
  {
    section: 'wind',
    prompt: 'A sea breeze develops because…',
    options: [
      'The sea heats up faster than the land',
      'The land heats up faster than the sea, and cooler air flows in from the sea to replace the rising warm air',
      'Wind always blows onshore in summer',
      'Tides pull air landward',
    ],
    correct: 1,
    explanation: 'Land has a much lower heat capacity than water, so it warms (and cools) faster — driving the whole circulation.',
  },
  {
    section: 'wind',
    prompt: 'The leading edge of a sea breeze pushing inland is called…',
    options: ['A katabatic front', 'A sea-breeze front', 'An occlusion', 'A trough'],
    correct: 1,
    explanation: 'It behaves a bit like a miniature cold front — cooler sea air undercutting and lifting the warmer air over the land.',
  },
  {
    section: 'wind',
    prompt: 'Mountain wave (wave lift) forms when…',
    options: [
      'A strong, fairly steady wind is deflected by a ridge into standing oscillations downwind',
      'The ground heats unevenly',
      'Two fronts collide',
      'Cold air sinks into a valley at night',
    ],
    correct: 0,
    explanation: "The oscillations stay fixed relative to the ridge even though the air is racing through them — that's what makes wave clouds look motionless in a strong wind.",
  },
  {
    section: 'wind',
    prompt: 'Which cloud often reveals wave lift, sitting motionless at the wave crest even in strong wind?',
    options: ['Cumulonimbus', 'Lenticular cloud', 'Stratus', 'Cirrus'],
    correct: 1,
    explanation: 'Its smooth, lens-like shape forms right at the crest of the standing wave — a classic visual giveaway.',
  },
  {
    section: 'wind',
    prompt: 'The dangerous turbulence often found beneath a mountain wave, on the lee side near the ground, is called…',
    options: ['Rotor', 'An inversion', 'A trough', 'A sea-breeze front'],
    correct: 0,
    explanation: 'Violently turbulent, rolling air — one of the more serious hazards in mountain flying.',
  },
]
