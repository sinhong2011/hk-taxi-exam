// Part A generator for mock mode.
// Draws a mixed 40-Q paper from the static regChoices bank + dynamically
// generated places/routes/fares questions. Ratio comes straight from the
// design doc § Data model changes.
//
// Every emitted MockQuestion MUST carry an explicit `topic` field so the
// result-screen rollup can group without re-deriving from id prefixes.

import type { MockQuestion } from "./question";
import type { Topic } from "./topics";
import { places } from "./places";
import { routes } from "./routes";
import { fareTable, type FareRow } from "./fares";
import { regChoices } from "./quizBank";
import { fareDistractorPools, type Area } from "./fareDistractors";
import { shuffle, pickDistractors } from "../lib/quiz-helpers";

// Matches TD official guide: 30 的士則例 (regs-combined) + 9 地方 + 1 路線 = 40
// Sub-split of the 30 regs-combined slots across our finer-grained topics,
// proportional to current bank sizes:
//   regs bank = 26, fleet = 11, demerit = 7, fares dynamic (12 effective).
//   Allocation: 18 regs + 4 fleet + 4 demerit + 4 fares = 30.
// Note: TD lumps these under 「的士則例」; we keep the finer-grained topic
// breakdown for the user-facing weakness report, but the total adheres to
// the official 30/9/1 spec.
export const PART_A_RATIO: Record<Topic, number> = {
  regs: 18,
  fleet: 4,
  demerit: 4,
  fares: 4,
  places: 9,
  routes: 1,
  roadcode: 0,
};

// ---------------------------------------------------------------------------
// Static draws (regs / fleet / demerit): filter regChoices by topic, shuffle,
// take N. Each static entry is already shaped like MockQuestion; we just copy.
// ---------------------------------------------------------------------------

function drawStatic(topic: Topic, n: number): MockQuestion[] {
  const bucket = regChoices.filter((q) => q.topic === topic);
  if (bucket.length < n) {
    throw new Error(
      `Part A bank too small for topic=${topic}: need ${n}, have ${bucket.length}`,
    );
  }
  return shuffle(bucket)
    .slice(0, n)
    .map((q) => ({ ...q }));
}

// ---------------------------------------------------------------------------
// Fare generator: pick a random FareRow + one of its numeric fields, build a
// 4-option question using fareDistractorPools[area] for distractors.
// ---------------------------------------------------------------------------

type FareField = "first2km" | "upperStep" | "threshold" | "afterStep";

// Keep this in sync with fareFieldMeta keys. Used by getPartABankSizes() to
// compute honest bank capacity for fares: rows × fields, not rows alone.
const FARE_FIELDS: readonly FareField[] = [
  "first2km",
  "upperStep",
  "threshold",
  "afterStep",
];

const fareFieldMeta: Record<
  FareField,
  { prompt: (area: string) => string; explain?: string }
> = {
  first2km: {
    prompt: (area) => `${area}的士首 2 公里收費是？`,
  },
  upperStep: {
    prompt: (area) => `${area}的士在達到跳錶分界線前，每 200 米／每分鐘等候的跳錶金額是？`,
  },
  threshold: {
    prompt: (area) => `${area}的士收費跳錶分界線（改收較低跳錶金額）在多少？`,
  },
  afterStep: {
    prompt: (area) => `${area}的士達到跳錶分界線之後，每 200 米／每分鐘等候的跳錶金額是？`,
  },
};

function formatFare(n: number): string {
  // Match the pool format: "$29", "$25.5", "$102.5" — no trailing .0.
  return `$${n}`;
}

function buildFareQuestion(): MockQuestion {
  const row: FareRow = fareTable[Math.floor(Math.random() * fareTable.length)];
  const field = FARE_FIELDS[Math.floor(Math.random() * FARE_FIELDS.length)];
  const correctAnswer = formatFare(row[field]);
  const area = row.area as Area;

  const pool = fareDistractorPools[area].filter((v) => v !== correctAnswer);
  const distractors = shuffle(pool).slice(0, 3);
  const options = shuffle([correctAnswer, ...distractors]);

  return {
    id: `fare:${area}:${field}:${Math.random().toString(36).slice(2, 8)}`,
    kind: `收費・${area}`,
    question: fareFieldMeta[field].prompt(area),
    options,
    correct: options.indexOf(correctAnswer),
    topic: "fares",
  };
}

// ---------------------------------------------------------------------------
// Place generator: pick a random place, draw 3 distractors from the same
// category (same pattern as Quiz.tsx). 4-option question.
// ---------------------------------------------------------------------------

function buildPlaceQuestion(pickedIds: Set<number>): MockQuestion {
  // Draw without replacement within the mock.
  let p = places[Math.floor(Math.random() * places.length)];
  let guard = 0;
  while (pickedIds.has(p.id) && guard < 50) {
    p = places[Math.floor(Math.random() * places.length)];
    guard++;
  }
  pickedIds.add(p.id);

  const samePool = places.filter((x) => x.category === p.category);
  const distractors = pickDistractors(samePool, p, 3, (x) => x.location);
  const options = shuffle([p.location, ...distractors.map((d) => d.location)]);

  return {
    id: `place:${p.id}`,
    kind: `地方・${p.category}`,
    question: `「${p.name}」位於哪裡？`,
    options,
    correct: options.indexOf(p.location),
    topic: "places",
  };
}

// ---------------------------------------------------------------------------
// Route generator: pick a random route, 2 distractors by `via`. 3-option
// question per exam spec (Part A routes are 3-option).
// ---------------------------------------------------------------------------

function buildRouteQuestion(pickedIds: Set<number>): MockQuestion {
  let r = routes[Math.floor(Math.random() * routes.length)];
  let guard = 0;
  while (pickedIds.has(r.id) && guard < 50) {
    r = routes[Math.floor(Math.random() * routes.length)];
    guard++;
  }
  pickedIds.add(r.id);

  const distractors = pickDistractors(routes, r, 2, (x) => x.via);
  const options = shuffle([r.via, ...distractors.map((d) => d.via)]);

  return {
    id: `route:${r.id}`,
    kind: "路線",
    question: `由「${r.from}」前往「${r.to}」的最直接路線是？`,
    options,
    correct: options.indexOf(r.via),
    topic: "routes",
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Build one full 40-question Part A paper. Returns questions in randomized
// order; sampling is without replacement within each bucket. Throws if any
// bucket is too small to fill its slot (caller / StartScreen should check
// sizes up front via getPartABankSizes).
export function buildPartAMock(): MockQuestion[] {
  const result: MockQuestion[] = [];

  // Static draws (copy-by-spread so downstream mutation is harmless).
  result.push(...drawStatic("regs", PART_A_RATIO.regs));
  result.push(...drawStatic("fleet", PART_A_RATIO.fleet));
  result.push(...drawStatic("demerit", PART_A_RATIO.demerit));

  // Dynamic draws.
  for (let i = 0; i < PART_A_RATIO.fares; i++) {
    result.push(buildFareQuestion());
  }
  const pickedPlaces = new Set<number>();
  for (let i = 0; i < PART_A_RATIO.places; i++) {
    result.push(buildPlaceQuestion(pickedPlaces));
  }
  const pickedRoutes = new Set<number>();
  for (let i = 0; i < PART_A_RATIO.routes; i++) {
    result.push(buildRouteQuestion(pickedRoutes));
  }

  return shuffle(result);
}

// Exposed for Mock.tsx StartScreen "bank big enough?" check.
// Static buckets (regs/fleet/demerit) = matching entries in regChoices.
// Dynamic buckets report honest *generable question* capacity, not raw source-array length:
//   - fares = rows × fields (3 × 4 = 12): each FareRow yields N distinct questions
//     via FARE_FIELDS, so 3 "rows" is misleading when the generator actually
//     produces 12 unique (area, field) combos.
//   - places / routes = 1 question per source item, so count equals array length.
export function getPartABankSizes(): Record<Topic, number> {
  return {
    regs: regChoices.filter((q) => q.topic === "regs").length,
    fleet: regChoices.filter((q) => q.topic === "fleet").length,
    demerit: regChoices.filter((q) => q.topic === "demerit").length,
    fares: fareTable.length * FARE_FIELDS.length,
    places: places.length,
    routes: routes.length,
    roadcode: 0,
  };
}
