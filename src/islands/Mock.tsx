import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QuestionCard from "../components/QuestionCard";
import ResultCard, { type TopicRow } from "../components/ResultCard";
import { buildPartAMock, getPartABankSizes, PART_A_RATIO } from "../data/partABank";
import { buildPartBMock, getRoadCodeBankSize } from "../data/roadCodeBank";
import {
  getSampleBankSize,
  getSamplePartA,
  getSamplePartB,
} from "../data/sampleBank";
import type { MockQuestion } from "../data/question";
import { topicLabels, topicToRoute, type Topic } from "../data/topics";
import { getVerdictComment, type VerdictComment } from "../data/verdictComments";

// ---------------------------------------------------------------------------
// Constants / types
// ---------------------------------------------------------------------------

// Thresholds verified against the TD 《的士筆試指引》 (2026 年 4 月版):
//   Part A ≥ 34 / 40, Part B ≥ 30 / 35. UI labels call these 「及格標準」.
const PART_A_THRESHOLD = 34;
const PART_B_THRESHOLD = 30;
// TD spec: 45 minutes total for all 75 questions (Part A + Part B combined).
// The real exam has no Part A/B split timer and no intermission pause; this
// single countdown ticks through Part A, intermission, and Part B.
const MOCK_TOTAL_SECONDS = 45 * 60;
const STORAGE_KEY = "taxi_mock_v1";
const IN_PROGRESS_KEY = "taxi_mock_in_progress_v1";
const HISTORY_CAP = 50;

type Phase = "start" | "partA" | "intermission" | "partB" | "done";

// "ranked"   = real-exam fidelity (timed, no pause).
// "practice" = pausable, autosaved.
// "sample"   = 10 TD-official sample questions (6 Part A + 4 Part B), no
//              timer, no autosave. Diagnostic mode:
//              the killer feature is that every wrong answer carries the
//              TD source-page citation stored in `explain`.
type MockMode = "ranked" | "practice" | "sample";

type TopicStat = { c: number; t: number };

type PartResult = {
  correct: number;
  total: number;
  byTopic: Partial<Record<Topic, TopicStat>>;
  wrongIds: string[];
};

type MockState = {
  mode: MockMode;
  phase: Phase;
  partAQuestions: MockQuestion[];
  partBQuestions: MockQuestion[];
  partBCapped: boolean;
  currentIdx: number;
  partAAnswers: (number | null)[];
  partBAnswers: (number | null)[];
  partAStartedAt: number;
  partBStartedAt: number | null;
};

type MockRun = {
  ts: number;
  mode?: MockMode; // optional for backwards-compat with pre-existing runs (treat missing as "ranked")
  partA: { correct: number; total: number; byTopic: Partial<Record<Topic, TopicStat>> };
  partB: { correct: number; total: number; byTopic: Partial<Record<Topic, TopicStat>> };
  wrongIds: string[];
  durationSec: number;
};

// Snapshot of an in-progress PRACTICE run. Ranked mode NEVER persists mid-run —
// that would defeat the "no pause" design contract. Only the phases where
// progress can be meaningfully resumed are saved; "start" and "done" are not.
type InProgressMock = {
  mode: "practice";
  version: 1;
  partAQuestions: MockQuestion[];
  partBQuestions: MockQuestion[];
  partBCapped: boolean;
  phase: Exclude<Phase, "start" | "done">;
  currentIdx: number;
  partAAnswers: (number | null)[];
  partBAnswers: (number | null)[];
  startedAt: number;
  savedAt: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readRuns(): MockRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MockRun[]) : [];
  } catch {
    return [];
  }
}

function writeRuns(list: MockRun[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = list.slice(0, HISTORY_CAP);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

// ---------------------------------------------------------------------------
// In-progress practice snapshot (separate key from completed-runs history).
// Written on every answer / advance / phase transition during practice mode.
// NOTE on corruption: localStorage writes are synchronous, but a refresh
// landing between setItem's internal phases is theoretically possible. In
// practice the try/catch in readInProgress catches any JSON parse failure
// and returns null (user sees a fresh StartScreen — minor UX loss, no crash).
// ---------------------------------------------------------------------------

function writeInProgress(state: MockState) {
  if (typeof window === "undefined") return;
  // Only practice mode persists mid-run. Ranked is "no pause, no resume" by
  // design; sample is a 10-Q diagnostic that doesn't need resume semantics.
  if (state.mode !== "practice") return;
  if (state.phase === "start" || state.phase === "done") return;
  try {
    const payload: InProgressMock = {
      mode: "practice",
      version: 1,
      partAQuestions: state.partAQuestions,
      partBQuestions: state.partBQuestions,
      partBCapped: state.partBCapped,
      phase: state.phase,
      currentIdx: state.currentIdx,
      partAAnswers: state.partAAnswers,
      partBAnswers: state.partBAnswers,
      startedAt: state.partAStartedAt,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private-mode; silent failure OK */
  }
}

function readInProgress(): InProgressMock | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(IN_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.version === 1 ? (parsed as InProgressMock) : null;
  } catch {
    return null;
  }
}

function clearInProgress() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(IN_PROGRESS_KEY);
  } catch {}
}

function computeScores(answers: (number | null)[], questions: MockQuestion[]): PartResult {
  let correct = 0;
  const byTopic: Partial<Record<Topic, TopicStat>> = {};
  const wrongIds: string[] = [];
  answers.forEach((a, i) => {
    const q = questions[i];
    const bucket = byTopic[q.topic] ?? { c: 0, t: 0 };
    bucket.t += 1;
    if (a !== null && a === q.correct) {
      correct += 1;
      bucket.c += 1;
    } else {
      wrongIds.push(q.id);
    }
    byTopic[q.topic] = bucket;
  });
  return { correct, total: questions.length, byTopic, wrongIds };
}

function mmss(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function formatTs(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Mock() {
  const [state, setState] = useState<MockState | null>(null);
  const [phase, setPhase] = useState<Phase>("start");
  const [history, setHistory] = useState<MockRun[]>([]);
  const [inProgress, setInProgress] = useState<InProgressMock | null>(null);

  useEffect(() => {
    setHistory(readRuns());
    setInProgress(readInProgress());
  }, []);

  // Core mutator: update state AND autosave if we're in practice mode.
  // Wrapping in one helper keeps the two operations lockstep — no way to
  // bump state without the snapshot also rolling forward.
  const updateState = (updater: (s: MockState) => MockState) => {
    setState((s) => {
      if (!s) return s;
      const next = updater(s);
      writeInProgress(next);
      return next;
    });
  };

  const start = (mode: MockMode) => {
    // Sample mode uses the fixed 10-question TD sample set; ranked/practice
    // build fresh 40+35 mocks from the generative banks. `partBCapped` is
    // already "true" for sample since the set isn't 35 Qs — result screen
    // already renders the 題庫縮減 hint when capped, which reads naturally.
    let partA: MockQuestion[];
    let partBQuestions: MockQuestion[];
    let partBCapped: boolean;
    if (mode === "sample") {
      partA = getSamplePartA();
      partBQuestions = getSamplePartB();
      partBCapped = true;
    } else {
      partA = buildPartAMock();
      const partB = buildPartBMock(35);
      partBQuestions = partB.questions;
      partBCapped = partB.capped;
    }
    const next: MockState = {
      mode,
      phase: "partA",
      partAQuestions: partA,
      partBQuestions,
      partBCapped,
      currentIdx: 0,
      partAAnswers: new Array(partA.length).fill(null),
      partBAnswers: new Array(partBQuestions.length).fill(null),
      partAStartedAt: Date.now(),
      partBStartedAt: null,
    };
    setState(next);
    setPhase("partA");
    // Only practice autosaves; writeInProgress no-ops for ranked/sample.
    writeInProgress(next);
    setInProgress(null); // banner gone; we're live now
  };

  const resume = (snap: InProgressMock) => {
    const next: MockState = {
      mode: "practice",
      phase: snap.phase,
      partAQuestions: snap.partAQuestions,
      partBQuestions: snap.partBQuestions,
      partBCapped: snap.partBCapped,
      currentIdx: snap.currentIdx,
      partAAnswers: snap.partAAnswers,
      partBAnswers: snap.partBAnswers,
      partAStartedAt: snap.startedAt,
      // If we're resuming into Part B, preserve a plausible partBStartedAt.
      // Practice has no timer so the value is only used for total-duration
      // reporting on the result screen. Approximate with savedAt.
      partBStartedAt: snap.phase === "partB" ? snap.savedAt : null,
    };
    setState(next);
    setPhase(snap.phase);
    setInProgress(null);
  };

  const discardInProgress = () => {
    clearInProgress();
    setInProgress(null);
  };

  const finishPartA = () => {
    updateState((s) => ({ ...s, phase: "intermission", currentIdx: 0 }));
    setPhase("intermission");
  };

  const beginPartB = () => {
    updateState((s) => ({
      ...s,
      phase: "partB",
      currentIdx: 0,
      partBStartedAt: Date.now(),
    }));
    setPhase("partB");
  };

  const finishPartB = () => {
    // Run is over; wipe the resume key. writeInProgress is a no-op for "done"
    // phase anyway, but clearing is explicit so stale snapshots don't linger.
    clearInProgress();
    setState((s) => (s ? { ...s, phase: "done" } : s));
    setPhase("done");
  };

  const restart = () => {
    clearInProgress();
    setState(null);
    setPhase("start");
    setHistory(readRuns());
    setInProgress(readInProgress());
  };

  // Single unified 45-minute countdown — ranked mode only. The timer spans
  // Part A → intermission → Part B and does NOT pause between phases (the
  // real exam has no intermission pause). Expiry auto-advances to "done"
  // from wherever the user is; unanswered questions stay null and count
  // as wrong in computeScores.
  //
  // Practice mode intentionally skips this: startedAt=0 + durationSec=0
  // means useCountdown's remaining = 0 at t=0, but we gate the expiry
  // callback on `shouldTime` so it never fires, and we pass `undefined`
  // down to PartRunner / Interstitial so those components render their
  // no-timer variants.
  const shouldTime =
    state !== null &&
    state.mode === "ranked" &&
    (phase === "partA" || phase === "intermission" || phase === "partB");

  const expireRef = useRef(() => {});
  expireRef.current = () => {
    // Force-end the run. writeInProgress is already a no-op for "done"
    // phase, and ranked runs never persist anyway, but clearing is
    // explicit so nothing stale lingers.
    clearInProgress();
    setState((s) => (s ? { ...s, phase: "done" } : s));
    setPhase("done");
  };

  const countdownStart = state?.partAStartedAt ?? 0;
  const countdownDuration = shouldTime ? MOCK_TOTAL_SECONDS : 0;
  const remainingAll = useCountdown(
    countdownStart,
    countdownDuration,
    () => {
      if (shouldTime) expireRef.current();
    },
  );
  const remaining = shouldTime ? remainingAll : undefined;

  if (phase === "start" || !state) {
    return (
      <StartScreen
        history={history}
        onStart={start}
        inProgress={inProgress}
        onResume={resume}
        onDiscard={discardInProgress}
      />
    );
  }
  if (phase === "partA") {
    return (
      <PartRunner
        label="Part A"
        mode={state.mode}
        total={state.partAQuestions.length}
        questions={state.partAQuestions}
        answers={state.partAAnswers}
        remaining={remaining}
        currentIdx={state.currentIdx}
        onAnswer={(idx, choice) =>
          updateState((s) => {
            const next = s.partAAnswers.slice();
            next[idx] = choice;
            return { ...s, partAAnswers: next };
          })
        }
        onAdvance={(nextIdx) => updateState((s) => ({ ...s, currentIdx: nextIdx }))}
        onFinish={finishPartA}
      />
    );
  }
  if (phase === "intermission") {
    return (
      <Interstitial
        onBegin={beginPartB}
        remaining={remaining}
        partBCount={state.partBQuestions.length}
        isSample={state.mode === "sample"}
      />
    );
  }
  if (phase === "partB") {
    return (
      <PartRunner
        label="Part B"
        mode={state.mode}
        total={state.partBQuestions.length}
        questions={state.partBQuestions}
        answers={state.partBAnswers}
        remaining={remaining}
        currentIdx={state.currentIdx}
        onAnswer={(idx, choice) =>
          updateState((s) => {
            const next = s.partBAnswers.slice();
            next[idx] = choice;
            return { ...s, partBAnswers: next };
          })
        }
        onAdvance={(nextIdx) => updateState((s) => ({ ...s, currentIdx: nextIdx }))}
        onFinish={finishPartB}
      />
    );
  }
  // done
  return <ResultScreen state={state} onRestart={restart} />;
}

// ---------------------------------------------------------------------------
// StartScreen
// ---------------------------------------------------------------------------

function StartScreen({
  history,
  onStart,
  inProgress,
  onResume,
  onDiscard,
}: {
  history: MockRun[];
  onStart: (mode: MockMode) => void;
  inProgress: InProgressMock | null;
  onResume: (snap: InProgressMock) => void;
  onDiscard: () => void;
}) {
  const sizes = getPartABankSizes();
  const partBSize = getRoadCodeBankSize();
  const sampleSize = getSampleBankSize();

  const shortages: string[] = [];
  (Object.keys(PART_A_RATIO) as Topic[]).forEach((t) => {
    const need = PART_A_RATIO[t];
    if (need > 0 && sizes[t] < need) {
      shortages.push(`${topicLabels[t]} 只有 ${sizes[t]} 題，需 ${need} 題`);
    }
  });
  const partBShort = partBSize < 35;
  // Shortage only blocks the generative ranked/practice modes. Sample mode
  // draws from a fixed 10-Q TD bank, so it's always available as long as the
  // bank itself has content (sanity-check the stub isn't empty).
  const blocked = shortages.length > 0;
  const sampleAvailable = sampleSize > 0;

  const last3 = history.slice(0, 3);

  const primaryBtnCls =
    "py-2 text-left text-[15px] font-semibold tracking-[0.1em] text-red uppercase transition-colors enabled:hover:text-red-deep disabled:cursor-not-allowed disabled:opacity-35";
  const ghostBtnCls =
    "py-2 text-left text-[15px] font-semibold tracking-[0.1em] text-muted uppercase transition-colors enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-35";
  const ctaCaptionCls = "text-[11.5px] leading-[1.6] tracking-[0.02em] text-muted";

  return (
    <div className="mx-auto max-w-[640px]">
      {inProgress && (
        <div className="mb-8 border border-l-2 border-line border-l-olive px-6 py-5">
          <div className="mb-2 text-xs font-medium tracking-[0.12em] text-olive uppercase">
            進行中嘅練習
          </div>
          <h2 className="mb-2.5 font-serif text-2xl font-medium tracking-[-0.01em] text-ink">
            練習模式進行中
          </h2>
          <div className="mb-4 text-sm leading-[1.7] text-ink-2">
            你喺 {formatTs(inProgress.savedAt)} 答到 Part {inProgress.phase === "partA" ? "A" : "B"} 第{" "}
            {inProgress.currentIdx + 1} 題。要繼續，定係放棄重來？
          </div>
          <div className="flex items-baseline gap-5">
            <button
              type="button"
              className="py-2 text-sm font-semibold tracking-[0.05em] text-red uppercase transition-colors hover:text-red-deep"
              onClick={() => onResume(inProgress)}
            >
              繼續 →
            </button>
            <button
              type="button"
              className="py-2 text-[13px] font-semibold tracking-[0.05em] text-muted uppercase transition-colors hover:text-ink"
              onClick={onDiscard}
            >
              放棄重來
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-red uppercase">實戰模擬</div>
      <h1 className="mb-6 font-serif text-[clamp(32px,5vw,48px)] leading-[1.15] font-medium tracking-[-0.02em] text-ink">模擬試</h1>

      <div className="mb-8 border border-l-2 border-line border-l-red px-6 py-5 text-sm leading-[1.7] text-ink-2">
        <div className="mb-1.5">
          <b className="text-ink">Part A</b>　40 題　·　及格標準 34
        </div>
        <div className="mb-1.5">
          <b className="text-ink">Part B</b>　35 題　·　及格標準 30
        </div>
        <div className="text-[13px] text-muted">
          計分模擬試：全卷 75 題共 45 分鐘計時（無分兩節），兩部分均須達及格標準方算通過。中途不可暫停，重新整理頁面將遺失進度。
        </div>
      </div>

      {blocked && (
        <div className="mb-6 border border-red bg-red-soft px-[18px] py-3.5 text-[13.5px] text-ink">
          <div className="mb-1.5 font-semibold text-red-deep">題庫不足</div>
          {shortages.map((msg, i) => (
            <div key={i} className="text-ink-2">{msg}</div>
          ))}
        </div>
      )}
      {partBShort && (
        <div className="mb-6 border border-l-2 border-line border-l-navy px-[18px] py-3 text-[13.5px] text-ink-2">
          Part B 題庫只有 {partBSize} 題，將以 {partBSize} 題計分。
        </div>
      )}

      <div className="mb-8">
        <div className="mb-3 text-xs font-medium tracking-[0.12em] text-muted uppercase">最近三次紀錄</div>
        {last3.length === 0 ? (
          <div className="font-serif text-sm text-muted italic">尚未有紀錄</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {last3.map((r, i) => {
              const isPractice = r.mode === "practice";
              const isSample = r.mode === "sample";
              const aPass = r.partA.correct >= PART_A_THRESHOLD;
              const bPass = r.partB.correct >= PART_B_THRESHOLD;
              return (
                <div
                  key={i}
                  className="border-b border-line pb-1.5 text-[13.5px] text-ink-2 tabular-nums"
                >
                  {formatTs(r.ts)}　·　Part A {r.partA.correct}/{r.partA.total}
                  {!isSample && ` ${aPass ? "✓" : "✗"}`}　·　Part B {r.partB.correct}/{r.partB.total}
                  {!isSample && ` ${bPass ? "✓" : "✗"}`}
                  {isPractice && <span className="ml-2 text-xs text-muted">· 練習</span>}
                  {isSample && <span className="ml-2 text-xs text-olive">· 官方樣本</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Three-button mode picker. Ranked is the primary CTA; practice and
          官方樣本 are ghost alternatives. 官方樣本 is NOT gated by the
          generative-bank shortage check — it uses a fixed 10-Q TD set. */}
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <button
            type="button"
            className={primaryBtnCls}
            onClick={() => onStart("ranked")}
            disabled={blocked}
          >
            開始計分模擬試 →
          </button>
          <div className={ctaCaptionCls}>全卷 45 分鐘計時 · 不可暫停</div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <button
            type="button"
            className={ghostBtnCls}
            onClick={() => onStart("practice")}
            disabled={blocked}
          >
            練習模式（可暫停）→
          </button>
          <div className={ctaCaptionCls}>唔計時 · 自動保存進度</div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <button
            type="button"
            className={ghostBtnCls}
            onClick={() => onStart("sample")}
            disabled={!sampleAvailable}
          >
            官方樣本（{sampleSize} 題）→
          </button>
          <div className={ctaCaptionCls}>
            {sampleSize} 條 TD 官方題目 · 附來源頁數 · 唔計時 · 唔上榜
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timer hook
// ---------------------------------------------------------------------------

function useCountdown(startedAt: number, durationSec: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(() =>
    durationSec > 0
      ? Math.max(0, durationSec - Math.floor((Date.now() - startedAt) / 1000))
      : 0,
  );
  const expiredRef = useRef(false);

  useEffect(() => {
    // Disabled state (durationSec <= 0) — used for practice mode, where this
    // hook is mounted at the top of Mock() but shouldn't do anything. Skip
    // both the tick loop and the expiry callback.
    if (durationSec <= 0) {
      expiredRef.current = false;
      setRemaining(0);
      return;
    }
    expiredRef.current = false;
    const tick = () => {
      const left = Math.max(0, durationSec - Math.floor((Date.now() - startedAt) / 1000));
      setRemaining(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, durationSec, onExpire]);

  return remaining;
}

// ---------------------------------------------------------------------------
// PartRunner — shared by Part A / Part B
// ---------------------------------------------------------------------------

function PartRunner({
  label,
  mode,
  total,
  questions,
  answers,
  remaining,
  currentIdx,
  onAnswer,
  onAdvance,
  onFinish,
}: {
  label: string;
  mode: MockMode;
  total: number;
  questions: MockQuestion[];
  answers: (number | null)[];
  // Seconds left on the unified 45-min countdown. Undefined in practice mode.
  // Expiry is handled by the top-level Mock component — PartRunner only
  // displays the value here.
  remaining: number | undefined;
  currentIdx: number;
  onAnswer: (idx: number, choice: number) => void;
  onAdvance: (nextIdx: number) => void;
  onFinish: () => void;
}) {
  // Practice + sample both skip the timer display — sample is a 10-Q
  // diagnostic where timing is meaningless. Display reuses PartRunnerPractice
  // with a mode-aware status label in the quiz-head.
  if (mode === "practice" || mode === "sample") {
    return (
      <PartRunnerPractice
        label={label}
        mode={mode}
        total={total}
        questions={questions}
        answers={answers}
        currentIdx={currentIdx}
        onAnswer={onAnswer}
        onAdvance={onAdvance}
        onFinish={onFinish}
      />
    );
  }
  return (
    <PartRunnerRanked
      label={label}
      total={total}
      questions={questions}
      answers={answers}
      remaining={remaining ?? 0}
      currentIdx={currentIdx}
      onAnswer={onAnswer}
      onAdvance={onAdvance}
      onFinish={onFinish}
    />
  );
}

function PartRunnerRanked({
  label,
  total,
  questions,
  answers,
  remaining,
  currentIdx,
  onAnswer,
  onAdvance,
  onFinish,
}: {
  label: string;
  total: number;
  questions: MockQuestion[];
  answers: (number | null)[];
  remaining: number;
  currentIdx: number;
  onAnswer: (idx: number, choice: number) => void;
  onAdvance: (nextIdx: number) => void;
  onFinish: () => void;
}) {
  const question = questions[currentIdx];
  const selected = answers[currentIdx];
  const answered = selected !== null;

  const handleSelect = (i: number) => {
    if (answered) return;
    onAnswer(currentIdx, i);
  };

  const next = () => {
    if (currentIdx + 1 >= total) {
      onFinish();
    } else {
      onAdvance(currentIdx + 1);
    }
  };

  const lowTime = remaining <= 60;

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-8 flex items-baseline justify-between border-b border-line pb-5 text-xs tracking-[0.08em] text-muted uppercase">
        <span>{label}　·　第 {currentIdx + 1} 題 / {total}</span>
        <span
          className={`font-serif text-lg tracking-normal normal-case tabular-nums ${lowTime ? "text-red" : "text-ink"}`}
          aria-live="polite"
        >
          {mmss(remaining)}
        </span>
      </div>

      <div className="flex flex-col gap-6" key={`${label}-${currentIdx}`}>
        <QuestionCard
          question={question}
          selected={selected}
          onSelect={handleSelect}
          showExplain={answered}
        />

        <div className="mt-2 flex justify-end gap-5 border-t border-line pt-5">
          <button className="py-2 text-[13px] font-semibold tracking-[0.05em] text-muted uppercase transition-colors hover:text-ink" onClick={next}>
            {answered ? "" : "跳過"}
          </button>
          <button className="py-2 text-[13px] font-semibold tracking-[0.05em] text-red uppercase transition-colors hover:text-red-deep" onClick={next}>
            {currentIdx + 1 >= total ? "完成本部分 →" : answered ? "下一題 →" : "跳過 →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Practice + sample variant: no timer, no auto-advance, mode indicator where
// the countdown normally sits. User progresses via the bottom buttons only.
// The only difference between practice and sample here is the status label
// text ("練習中・唔計時" vs "官方樣本・唔計時").
function PartRunnerPractice({
  label,
  mode,
  total,
  questions,
  answers,
  currentIdx,
  onAnswer,
  onAdvance,
  onFinish,
}: {
  label: string;
  mode: "practice" | "sample";
  total: number;
  questions: MockQuestion[];
  answers: (number | null)[];
  currentIdx: number;
  onAnswer: (idx: number, choice: number) => void;
  onAdvance: (nextIdx: number) => void;
  onFinish: () => void;
}) {
  const question = questions[currentIdx];
  const selected = answers[currentIdx];
  const answered = selected !== null;

  const handleSelect = (i: number) => {
    if (answered) return;
    onAnswer(currentIdx, i);
  };

  const next = () => {
    if (currentIdx + 1 >= total) {
      onFinish();
    } else {
      onAdvance(currentIdx + 1);
    }
  };

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-8 flex items-baseline justify-between border-b border-line pb-5 text-xs tracking-[0.08em] text-muted uppercase">
        <span>{label}　·　第 {currentIdx + 1} 題 / {total}</span>
        <span className={`font-sans text-xs tracking-[0.08em] uppercase tabular-nums ${mode === "sample" ? "text-olive" : "text-muted"}`}>
          {mode === "sample" ? "官方樣本・唔計時" : "練習中・唔計時"}
        </span>
      </div>

      <div className="flex flex-col gap-6" key={`${label}-${currentIdx}`}>
        <QuestionCard
          question={question}
          selected={selected}
          onSelect={handleSelect}
          showExplain={answered}
        />

        <div className="mt-2 flex justify-end gap-5 border-t border-line pt-5">
          <button className="py-2 text-[13px] font-semibold tracking-[0.05em] text-muted uppercase transition-colors hover:text-ink" onClick={next}>
            {answered ? "" : "跳過"}
          </button>
          <button className="py-2 text-[13px] font-semibold tracking-[0.05em] text-red uppercase transition-colors hover:text-red-deep" onClick={next}>
            {currentIdx + 1 >= total ? "完成本部分 →" : answered ? "下一題 →" : "跳過 →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intermission
// ---------------------------------------------------------------------------

function Interstitial({
  onBegin,
  remaining,
  partBCount,
  isSample,
}: {
  onBegin: () => void;
  // Seconds left on the unified 45-min countdown. Undefined in practice/sample.
  // IMPORTANT: the timer does NOT pause here — matches the real exam, where
  // there's no intermission at all. A user who sits on this screen eats into
  // their Part B answering budget.
  remaining: number | undefined;
  partBCount: number;
  isSample: boolean;
}) {
  const showTimer = remaining !== undefined;
  const lowTime = showTimer && remaining <= 60;
  return (
    <div className="mx-auto max-w-[640px] pt-10 text-center">
      {showTimer && (
        <div className="mb-4 flex justify-end border-b border-line pb-5 text-xs tracking-[0.08em] text-muted uppercase">
          <span
            className={`font-serif text-lg tracking-normal normal-case tabular-nums ${lowTime ? "text-red" : "text-ink"}`}
            aria-live="polite"
          >
            {mmss(remaining)}
          </span>
        </div>
      )}
      <div className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-red uppercase">
        {isSample ? "完成 Part A 樣本" : "完成 Part A"}
      </div>
      <h1 className="mb-6 font-serif text-[clamp(32px,5vw,48px)] leading-[1.15] font-medium tracking-[-0.02em] text-ink">
        準備開始 Part B？
      </h1>
      <p className="mx-auto mb-8 max-w-[58ch] text-base leading-[1.75] text-ink-2">
        Part B 為 道路使用者守則 部分，共 {partBCount} 題。
        {showTimer ? "計時不會暫停，請盡快繼續。" : "請準備好後按下按鈕開始。"}
      </p>
      <button
        type="button"
        className="py-2 text-[15px] font-semibold tracking-[0.1em] text-red uppercase transition-colors hover:text-red-deep"
        onClick={onBegin}
      >
        開始 Part B →
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResultScreen
// ---------------------------------------------------------------------------

function ResultScreen({
  state,
  onRestart,
}: {
  state: MockState;
  onRestart: () => void;
}) {
  const a = useMemo(() => computeScores(state.partAAnswers, state.partAQuestions), [state]);
  const b = useMemo(() => computeScores(state.partBAnswers, state.partBQuestions), [state]);

  const aPass = a.correct >= PART_A_THRESHOLD;
  const bPass = b.correct >= PART_B_THRESHOLD;
  const overall = aPass && bPass;
  const isSample = state.mode === "sample";

  // Compute 粵語 verdict comment once per result screen mount.
  // Random pick is intentional — retakes get fresh lines.
  const verdict = useMemo<VerdictComment>(() => {
    const skippedCount =
      state.partAAnswers.filter((x) => x === null).length +
      state.partBAnswers.filter((x) => x === null).length;
    const totalCount = state.partAAnswers.length + state.partBAnswers.length;
    const skippedRatio = totalCount === 0 ? 0 : skippedCount / totalCount;
    // NOTE: `durationSec` accuracy is being fixed in a parallel change — here
    // we just pipe through whatever elapsed wall-clock we have. If Part B
    // never started (rare), fall through to undefined so speedster bands skip.
    const durationSec =
      state.partBStartedAt !== null
        ? Math.max(0, Math.floor((Date.now() - state.partAStartedAt) / 1000))
        : undefined;
    // Retake count = prior runs stored in history before this one landed.
    // readRuns() reads pre-write history; safe to call here since this useMemo
    // runs before the write effect below.
    const retakeCount = readRuns().length;
    return getVerdictComment({
      partA: { correct: a.correct, total: a.total },
      partB: { correct: b.correct, total: b.total },
      partAThreshold: PART_A_THRESHOLD,
      partBThreshold: PART_B_THRESHOLD,
      skippedRatio,
      durationSec,
      maxDurationSec: MOCK_TOTAL_SECONDS,
      retakeCount,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wroteRef = useRef(false);
  useEffect(() => {
    if (wroteRef.current) return;
    wroteRef.current = true;
    // Actual elapsed time from Part A start to now (result screen mount = run finished).
    const durationSec = Math.max(
      0,
      Math.floor((Date.now() - state.partAStartedAt) / 1000),
    );
    const run: MockRun = {
      ts: Date.now(),
      mode: state.mode,
      partA: { correct: a.correct, total: a.total, byTopic: a.byTopic },
      partB: { correct: b.correct, total: b.total, byTopic: b.byTopic },
      wrongIds: [...a.wrongIds, ...b.wrongIds],
      durationSec,
    };
    const existing = readRuns();
    writeRuns([run, ...existing]);
  }, [state, a, b]);

  // Combined per-topic breakdown
  const combinedByTopic = useMemo(() => {
    const merged: Partial<Record<Topic, TopicStat>> = {};
    const merge = (src: Partial<Record<Topic, TopicStat>>) => {
      (Object.keys(src) as Topic[]).forEach((t) => {
        const cur = merged[t] ?? { c: 0, t: 0 };
        cur.c += src[t]!.c;
        cur.t += src[t]!.t;
        merged[t] = cur;
      });
    };
    merge(a.byTopic);
    merge(b.byTopic);
    const rows = (Object.keys(merged) as Topic[])
      .filter((t) => merged[t]!.t > 0)
      .map((t) => {
        const { c, t: total } = merged[t]!;
        return { topic: t, correct: c, wrong: total - c, total, rate: total === 0 ? 0 : (total - c) / total };
      })
      .sort((x, y) => y.rate - x.rate);
    return rows;
  }, [a, b]);

  const topWeak = useMemo(
    () => combinedByTopic.filter((r) => r.total >= 2 && r.wrong > 0).slice(0, 3),
    [combinedByTopic],
  );

  const cardTopicRows: TopicRow[] = useMemo(
    () =>
      combinedByTopic.map((r) => ({
        topic: r.topic,
        correct: r.correct,
        wrong: r.wrong,
        total: r.total,
        rate: r.rate,
      })),
    [combinedByTopic],
  );

  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  // Display-only signature for the shareable result card. Session-only
  // state: never written to localStorage, never sent over the network.
  // Lives only in the rendered PNG the user explicitly chooses to export.
  const [nickname, setNickname] = useState("");

  // Light cosmetic filter: strip control chars + bidi/zero-width tricks,
  // collapse whitespace, cap length. No moderation — content stays on-device.
  const cleanedNickname = nickname
    .replace(/[\x00-\x1F\x7F\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);

  // Feature detection (runs once on mount; APIs can't appear mid-session).
  const [canShare, setCanShare] = useState(false);
  const [canCopy, setCanCopy] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    // Web Share API with files — best-in-class for mobile (IG / WhatsApp / one-tap).
    if (typeof navigator.canShare === "function") {
      try {
        const probe = new File([new Blob([""])], "probe.png", { type: "image/png" });
        if (navigator.canShare({ files: [probe] })) setCanShare(true);
      } catch {
        /* Safari < 15 throws — treat as unsupported */
      }
    }
    // Clipboard image write — works on desktop Chrome/Edge/Safari, paste into any app.
    if (typeof window !== "undefined" && "ClipboardItem" in window && navigator.clipboard) {
      setCanCopy(true);
    }
  }, []);

  // Shared generator: produces the PNG data URL once per click. All three actions reuse it.
  const generatePng = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0f1013",
    });
  };

  const exportCard = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const dataUrl = await generatePng();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `mock-result-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Card export failed:", err);
      if (typeof window !== "undefined") window.alert("圖片儲存失敗，請再試一次。");
    } finally {
      setExporting(false);
    }
  };

  const shareCard = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const dataUrl = await generatePng();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `mock-result-${Date.now()}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "的士筆試模擬試結果",
          text: "呢個係我嘅模擬試成績 —",
          files: [file],
        });
      } else {
        // Shouldn't hit if canShare flag was true, but fall back safely.
        await exportCard();
      }
    } catch (err) {
      // AbortError = user cancelled the share sheet. Don't alarm them.
      if ((err as Error)?.name !== "AbortError") {
        console.error("Card share failed:", err);
        if (typeof window !== "undefined") window.alert("分享失敗，請再試一次。");
      }
    } finally {
      setExporting(false);
    }
  };

  const copyCard = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const dataUrl = await generatePng();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      if (typeof window !== "undefined") window.alert("已複製到剪貼板，去邊度都 paste 得。");
    } catch (err) {
      console.error("Card copy failed:", err);
      if (typeof window !== "undefined") window.alert("複製失敗，試下「儲存成圖片」。");
    } finally {
      setExporting(false);
    }
  };

  const allQuestions: MockQuestion[] = [...state.partAQuestions, ...state.partBQuestions];
  const allAnswers: (number | null)[] = [...state.partAAnswers, ...state.partBAnswers];

  const wrongByTopic = useMemo(() => {
    const map = new Map<Topic, { q: MockQuestion; userAnswer: number | null }[]>();
    allQuestions.forEach((q, i) => {
      const ans = allAnswers[i];
      if (ans === null || ans !== q.correct) {
        const list = map.get(q.topic) ?? [];
        list.push({ q, userAnswer: ans });
        map.set(q.topic, list);
      }
    });
    return map;
  }, [allQuestions, allAnswers]);

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-red uppercase">{isSample ? "官方樣本" : "模擬試結果"}</div>
      {isSample ? (
        <>
          <h1 className="mb-2 font-serif text-[clamp(32px,5vw,48px)] leading-[1.15] font-medium tracking-[-0.02em] text-ink">
            TD 官方題目完成
          </h1>
          <div className="mb-8 max-w-[58ch] text-base leading-[1.75] text-ink-2">
            呢十條題目全部來自運輸署《的士筆試指引》(2026 年 4 月版)，每條都附原文頁數。
          </div>
          <div className="mb-8 border border-l-2 border-line border-l-olive px-6 py-5">
            <div className="mb-2.5 text-[11px] font-semibold tracking-[0.14em] text-olive uppercase">
              點樣睇呢個分數
            </div>
            <div className="font-serif text-[15px] leading-[1.7] text-ink-2">
              官方樣本只得 10 題，唔能夠準確反映真實考試分數。重點係睇官方出題風格，比對你理解嘅差距。每條錯題下面有來源頁數，可以直接去睇原文。
            </div>
          </div>
        </>
      ) : (
        <>
          <h1 className="mb-2 font-serif text-[clamp(32px,5vw,48px)] leading-[1.15] font-medium tracking-[-0.02em] text-ink">
            {overall ? (
              <>
                通過<span className="text-olive">・</span>
                <span className="text-olive italic">Pass</span>
              </>
            ) : (
              <>
                不通過<span className="text-red">・</span>
                <span className="text-red italic">Fail</span>
              </>
            )}
          </h1>
          <div className="mb-8 max-w-[58ch] text-base leading-[1.75] text-ink-2">
            及格標準以運輸署《的士筆試指引》(2026 年 4 月版) 為準。
          </div>

          {/* 粵語周星馳-style 評語 */}
          <div className="mb-8 border border-l-2 border-line border-l-red bg-red-soft px-6 py-5">
            <div className="mb-2.5 text-[11px] font-semibold tracking-[0.14em] text-red uppercase">評語</div>
            <div className="mb-2.5 font-serif text-[clamp(22px,3.2vw,28px)] leading-[1.25] tracking-[-0.01em] text-ink">
              「{verdict.title}」
            </div>
            <div className="font-serif text-[15px] leading-[1.7] text-ink-2 italic">
              {verdict.body}
            </div>
          </div>
        </>
      )}

      <div className="mb-8 border-t border-line">
        <PartLine
          label="Part A"
          correct={a.correct}
          total={a.total}
          threshold={PART_A_THRESHOLD}
          note={undefined}
          isSample={isSample}
        />
        <PartLine
          label="Part B"
          correct={b.correct}
          total={b.total}
          threshold={PART_B_THRESHOLD}
          note={!isSample && state.partBCapped ? "題庫縮減" : undefined}
          isSample={isSample}
        />
      </div>
      {isSample && (
        <div className="-mt-6 mb-8 font-serif text-[12.5px] leading-[1.6] text-muted italic">
          （TD 真實及格標準為 Part A {PART_A_THRESHOLD}/40、Part B {PART_B_THRESHOLD}/35；官方樣本題目數不同，呢度唔作對齊。）
        </div>
      )}

      <div className="mb-3 text-xs font-medium tracking-[0.12em] text-muted uppercase">按主題拆解</div>
      <table className="data-table mb-8">
        <thead>
          <tr>
            <th>主題</th>
            <th>答對</th>
            <th>答錯</th>
            <th>錯誤率</th>
          </tr>
        </thead>
        <tbody>
          {combinedByTopic.map((r) => (
            <tr key={r.topic}>
              <td className="label">{topicLabels[r.topic]}</td>
              <td>{r.correct}</td>
              <td className={r.wrong > 0 ? "text-red" : "text-ink-2"}>{r.wrong}</td>
              <td>{Math.round(r.rate * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {topWeak.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 text-xs font-medium tracking-[0.12em] text-muted uppercase">下一步修訂</div>
          <div className="flex flex-col gap-1.5">
            {topWeak.map((r) => (
              <a
                key={r.topic}
                href={topicToRoute[r.topic]}
                className="border-b border-line py-2.5 text-left text-[15px] font-semibold text-red transition-colors hover:text-red-deep"
              >
                去修訂 · {topicLabels[r.topic]}　<span className="text-xs text-muted">（錯 {r.wrong}/{r.total}）</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {wrongByTopic.size > 0 && (
        <div className="mb-8">
          <div className="mb-3 text-xs font-medium tracking-[0.12em] text-muted uppercase">錯題詳解</div>
          {Array.from(wrongByTopic.entries()).map(([topic, items]) => (
            <details key={topic} className="border-b border-line py-3">
              <summary className="flex cursor-pointer list-none justify-between text-sm font-medium text-ink">
                <span>{topicLabels[topic]}</span>
                <span className="text-xs text-muted tabular-nums">{items.length} 題</span>
              </summary>
              <div className="mt-3 flex flex-col gap-4">
                {items.map(({ q, userAnswer }, i) => (
                  <div key={i} className="text-[13.5px] leading-[1.65] text-ink-2">
                    {/* Image-based Qs show a small thumbnail so the user can
                        connect the wrong-answer row back to the sign they saw
                        during the run. Kept small (~72px) so it doesn't
                        dominate the text review list. White inner bg mirrors
                        the main QuestionCard image treatment. */}
                    {q.imageSrc && (
                      <div className="mb-2 inline-flex rounded-[3px] border border-line bg-white p-1.5">
                        <img
                          src={q.imageSrc}
                          alt={q.imageAlt ?? "題目圖像"}
                          loading="lazy"
                          decoding="async"
                          className="block size-[72px] object-contain"
                        />
                      </div>
                    )}
                    <div className="mb-1 text-ink">{q.question}</div>
                    <div>
                      你的答案：
                      <span className={userAnswer === null ? "text-muted" : "text-red"}>
                        {userAnswer === null ? "未作答" : q.options[userAnswer]}
                      </span>
                    </div>
                    <div>
                      正確答案：<span className="text-olive">{q.options[q.correct]}</span>
                    </div>
                    {q.explain &&
                      // In sample mode the `explain` field carries the TD
                      // source-page citation — that IS the whole point of
                      // 官方樣本. Promote it to a prominent callout box
                      // instead of a muted footnote.
                      (isSample ? (
                        <div className="mt-2.5 border border-l-2 border-line border-l-olive bg-red-soft px-3.5 py-2.5 font-serif text-[13.5px] leading-[1.7] text-ink">
                          <div className="mb-1 text-[10.5px] font-semibold tracking-[0.14em] text-olive uppercase">
                            TD 官方來源
                          </div>
                          {q.explain}
                        </div>
                      ) : (
                        <div className="mt-1 font-serif text-muted">{q.explain}</div>
                      ))}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Share-card signature panel — non-sample only. Optional nickname
          appears on the exported PNG header. Pure cosmetic: never persisted,
          never sent over the network. */}
      {!isSample && (
        <div className="mb-2 flex flex-col gap-2 border-t border-line py-6">
          <div className="text-xs font-medium tracking-[0.12em] text-muted uppercase">
            分享圖片署名（可留空）
          </div>
          <input
            type="text"
            className="w-full border-0 border-b border-line-strong bg-transparent py-3 font-serif text-base tracking-[-0.01em] text-ink transition-colors placeholder:text-muted placeholder:italic focus:border-b-red focus:outline-none"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="例：旺角阿明 / 的士新人 / 留空都得"
          />
          <div className="font-serif text-[12.5px] leading-[1.6] text-muted italic">
            只會印喺你下面儲存／分享嘅圖片上。本 app 唔會記低、亦唔會送去任何伺服器。
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-5 border-t border-line pt-5">
        {/* Share-card export buttons — hidden in sample mode. The offscreen
            ResultCard is designed around pass/fail against the 34/30 real-exam
            thresholds, which don't apply to 6+4 sample questions; exporting
            would produce a misleading poster. */}
        <div className="flex flex-wrap gap-2.5">
          {!isSample && canShare && (
            <button
              type="button"
              className="py-2 text-[13px] font-semibold tracking-[0.05em] text-muted uppercase transition-colors enabled:hover:text-ink disabled:cursor-wait disabled:opacity-50"
              onClick={shareCard}
              disabled={exporting}
            >
              {exporting ? "生成中…" : "分享 →"}
            </button>
          )}
          {!isSample && canCopy && (
            <button
              type="button"
              className="py-2 text-[13px] font-semibold tracking-[0.05em] text-muted uppercase transition-colors enabled:hover:text-ink disabled:cursor-wait disabled:opacity-50"
              onClick={copyCard}
              disabled={exporting}
            >
              {exporting ? "生成中…" : "複製圖片"}
            </button>
          )}
          {!isSample && (
            <button
              type="button"
              className="py-2 text-[13px] font-semibold tracking-[0.05em] text-muted uppercase transition-colors enabled:hover:text-ink disabled:cursor-wait disabled:opacity-50"
              onClick={exportCard}
              disabled={exporting}
            >
              {exporting ? "生成中…" : "儲存成圖片 ↓"}
            </button>
          )}
        </div>
        <button
          type="button"
          className="py-2 text-[13px] font-semibold tracking-[0.05em] text-red uppercase transition-colors hover:text-red-deep"
          onClick={onRestart}
        >
          再考一次 →
        </button>
      </div>

      {/* Offscreen share card — always rendered so cardRef is always live. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 -left-[99999px] h-[1350px] w-[1080px]"
      >
        <ResultCard
          ref={cardRef}
          verdict={verdict}
          partA={{ correct: a.correct, total: a.total, pass: aPass }}
          partB={{ correct: b.correct, total: b.total, pass: bPass }}
          overallPass={overall}
          topicRows={cardTopicRows}
          date={new Date()}
          nickname={cleanedNickname || undefined}
        />
      </div>
    </div>
  );
}

function PartLine({
  label,
  correct,
  total,
  threshold,
  note,
  isSample,
}: {
  label: string;
  correct: number;
  total: number;
  threshold: number;
  note?: string;
  // When true (sample mode), suppress the 及格標準 caption and the ✓/✗ glyph
  // since the sample set size is 6/4, not 40/35, so the threshold doesn't apply.
  isSample?: boolean;
}) {
  const pass = correct >= threshold;
  return (
    <div className="flex items-baseline justify-between border-b border-line py-4">
      <div>
        <span className="font-serif text-base text-ink">{label}</span>
      </div>
      <div className="font-serif tabular-nums">
        <span className="text-[22px] text-ink">{correct}</span>
        <span className="text-muted">／{total}</span>
        {!isSample && (
          <span className={`ml-2.5 text-sm ${pass ? "text-olive" : "text-red"}`}>
            {pass ? "✓" : "✗"}
          </span>
        )}
        {!isSample && (
          <span className="ml-3 font-sans text-xs text-muted">
            及格標準 {threshold}
            {note ? `・${note}` : ""}
          </span>
        )}
        {isSample && note && (
          <span className="ml-3 font-sans text-xs text-muted">{note}</span>
        )}
      </div>
    </div>
  );
}
