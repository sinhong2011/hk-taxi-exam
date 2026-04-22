// Per-area distractor pool for fare questions.
// Generator in partABank.ts will pick 3 from the correct area's pool.
// Covers common confusion patterns:
//   - wrong-area rate swaps (e.g. $25.5 looks right but is 新界's first2km when
//     the question is about 市區)
//   - old/superseded rates (fossils from earlier fare hikes)
//   - first-2km vs subsequent-km confusion
//   - near-misses (±$1–$3 around the correct value)
//   - plausible round numbers
//
// Keep each string in the same display format the correct answer uses
// (prefix "$", one decimal for half-dollar values). If the generator
// picks a string that happens to equal the correct answer, it should
// dedupe; these pools intentionally include cross-area correct values
// as distractors — that's the point.

// Area literal re-declared locally: fares.ts defines the union inline on
// FareRow but does not export it. Keep in sync with fares.ts if it changes.
export type Area = "市區" | "新界" | "大嶼山";

export const fareDistractorPools: Record<Area, string[]> = {
  // Correct 市區 anchors: first2km $29, upperStep $2.1, threshold $102.5, afterStep $1.4
  市區: [
    "$25.5",  // 新界 first2km — classic area swap
    "$24",    // 大嶼山 first2km — area swap
    "$27",    // near-miss below correct first2km
    "$30",    // near-miss round number above
    "$28",    // near-miss below
    "$31",    // near-miss above
    "$82.5",  // 新界 threshold — threshold-as-first2km confusion
    "$2.1",   // urban upperStep — first2km/subsequent swap
    "$1.4",   // urban afterStep — first2km/subsequent swap
    "$102.5", // urban threshold — threshold-as-first2km confusion
  ],

  // Correct 新界 anchors: first2km $25.5, upperStep $1.9, threshold $82.5, afterStep $1.4
  新界: [
    "$29",    // 市區 first2km — area swap
    "$24",    // 大嶼山 first2km — area swap
    "$23.5",  // near-miss below
    "$27.5",  // near-miss above
    "$26",    // near-miss above
    "$25",    // near-miss round number
    "$102.5", // 市區 threshold — threshold confusion
    "$1.9",   // NT upperStep — first2km/subsequent swap
    "$1.4",   // NT afterStep — first2km/subsequent swap
    "$82.5",  // NT threshold — threshold-as-first2km confusion
  ],

  // Correct 大嶼山 anchors: first2km $24, upperStep $1.9, threshold $195, afterStep $1.6
  大嶼山: [
    "$29",    // 市區 first2km — area swap
    "$25.5",  // 新界 first2km — area swap
    "$22",    // near-miss below
    "$26",    // near-miss above
    "$25",    // near-miss round number
    "$23",    // near-miss below
    "$195",   // Lantau threshold — threshold-as-first2km confusion
    "$1.9",   // Lantau upperStep — first2km/subsequent swap
    "$1.6",   // Lantau afterStep — first2km/subsequent swap
    "$82.5",  // 新界 threshold — cross-area threshold confusion
  ],
};
