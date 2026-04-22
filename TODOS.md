# TODOS

Deferred work captured during /plan-eng-review of the mock-exam mode build (2026-04-21).
These items were considered and explicitly deferred with context, not silently dropped.

---

## 1. Spaced repetition engine on top of `taxi_review_v2`

**What:** Implement a proper spaced-repetition loop that resurfaces missed questions on
a forgetting-curve schedule (e.g., 1 day, 3 days, 7 days, 21 days). Integrate with the
existing wrong-answer store (`taxi_review_v2` for casual quiz wrongs + `taxi_mock_v1`
wrongs from mock runs).

**Why:** Cramming builds short-term recall that decays fast. SR is the strongest
retention mechanic for long-term mastery. Useful if you retain the tool post-exam
for knowledge upkeep, if you fail the exam and need to retake, or if other candidates
ever use the tool.

**Pros:**
- Compounds learning over time. Cheap per-retake benefit.
- Converts this from "exam prep" to "long-term driver-knowledge maintenance."

**Cons:**
- Not useful at T-14 where mode is cramming, not retaining.
- Real SR systems (SM-2, Anki-style) have subtle edge cases (interval growth, lapse
  handling, easiness factor tuning). Non-trivial to get right.

**Context for future-you:** The wrong-answer store already keeps question IDs,
categories, and timestamps. The missing piece is a "next review at" field and a
dispatcher UI. See `src/islands/Quiz.tsx:24` (`STORAGE_KEY`) for the current shape.
Extending to SR means adding `nextReviewAt: number` and `interval: number` per entry,
plus a new mode in Quiz that filters by `nextReviewAt <= now()`.

**Depends on / blocked by:** Nothing. Can be built standalone after the mock ships.

**Estimated effort:** Human ~1-2 days / CC ~2-3 hours.

---

## 2. Signs drill for the 330 gif images in `public/signs/`

**What:** New `/signs-drill` page that cycles through the 330 road-sign gif images as
flashcards or multiple-choice questions ("what does this sign mean?" / "which sign
means 'no overtaking'?").

**Why:** You downloaded 330 sign images via `scripts/fetch-signs.sh` but they're not
in any practice flow yet. Content is cached but dormant. If the real exam includes
sign-recognition Qs in Part B (TD sources are ambiguous), having a drill closes a
real gap.

**Pros:**
- Uses existing assets (no new content work).
- Visual recognition is a distinct learning modality from text MCQ.
- Satisfies the "don't leave 330 unused files" sense of closure.

**Cons:**
- Per TD exam format references, signs appear thinly in Part B (~5 Qs max). Effort
  ratio: 1 day of build for maybe 5 exam Qs coverage. Poor signal-to-work.
- Requires metadata: each sign needs a human-readable label. `src/data/signs.ts`
  (57 lines) may or may not cover all 330 — need to check.
- Authoring distractors for 330 items = substantial content work.

**Context for future-you:** `scripts/fetch-signs.sh` fetches the signs, `scripts/fetch-sign-captions.mjs`
likely populates `src/data/signs.ts`. Check what's already labeled. The `/signs.astro`
page (120 lines) probably already displays them in gallery form — drill mode would
reuse that data source.

**Depends on / blocked by:** Nothing structurally. `src/data/signs.ts` may need to
expand to cover all 330 if it currently doesn't.

**Estimated effort:** Human ~1 day / CC ~2 hours (gated on content labels existing).

---

## 3. Trend chart on mock StartScreen (replace text table)

**What:** Replace the "last 3 runs" text table with a minimal line chart showing Part
A score over time and Part B score over time. X-axis = run timestamp, Y-axis = score
/ 40 and / 35.

**Why:** Visual trend answers "am I getting better?" at a glance. Text table requires
the user to compare three numbers mentally. Useful once retakes stack (>5 runs).

**Pros:**
- Small visual polish.
- Scales better than a text table at 10+ runs.

**Cons:**
- Either adds a chart dependency (recharts/@visx/chartjs) at ~100KB gzipped, or
  needs hand-rolled SVG (~100 LOC of non-trivial geometry).
- The text table already does the job for the 3-5 retakes you're realistically
  going to do before the exam. Low marginal value.

**Context for future-you:** `src/islands/Mock.tsx` reads `taxi_mock_v1` from
localStorage and renders a text table on StartScreen. Swap the renderer when ready.
If choosing a library, recharts is the most Astro-friendly React chart library.

**Depends on / blocked by:** Mock.tsx shipping first (this is a v2 polish).

**Estimated effort:** Human ~2-4 hours / CC ~30-45 minutes.

---

## 4. PWA service worker cache versioning for dev iteration

**What:** When any data file (`quizBank.ts`, `roadCode.ts`, `places.ts`, etc.) changes,
bump the service worker cache version so stale bundles don't serve deleted question
IDs. Simplest form: include a content hash of the data files in the SW `CACHE_NAME`.

**Why:** You iterate on banks while also using the tool for real study. If the SW
cached an old bundle and you removed a question from `quizBank.ts`, the mock can
reference a deleted ID and the wrong-answer review breaks silently. Real bug risk,
especially during active development.

**Pros:**
- Defense against a subtle bug class that's annoying to diagnose live.
- Cheap to implement once (a build-time hash step).

**Cons:**
- Adds build-time complexity (compute hash, inject into SW).
- Workaround exists: Cmd+Shift+R after bank changes, or disable SW in dev via
  `import.meta.env.DEV` check. Often easier.

**Context for future-you:** `public/sw.js` is the existing service worker. See
Astro PWA integration patterns — `@vite-pwa/astro` handles cache versioning
automatically. Current setup is hand-rolled (per homepage assertion of PWA).
Consider swapping to `@vite-pwa/astro` if not done already.

**Depends on / blocked by:** Need to decide whether to keep hand-rolled sw.js or
migrate to `@vite-pwa/astro`. The latter obviates this TODO.

**Estimated effort:** Hand-rolled bump: human ~1 hour / CC ~15 min. Migrate to
`@vite-pwa/astro`: human ~2-3 hours / CC ~45 min.
