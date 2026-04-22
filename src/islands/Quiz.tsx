import { useEffect, useMemo, useState } from "react";
import { places } from "../data/places";
import { routes } from "../data/routes";
import { fareTable } from "../data/fares";
import { regChoices } from "../data/quizBank";
import { shuffle, pickDistractors } from "../lib/quiz-helpers";
import QuestionCard from "../components/QuestionCard";

type Question = {
  id: string;
  kind: string;
  question: string;
  options: string[];
  correct: number;
  explain?: string;
};

type StoredWrong = {
  id: string;
  kind: string;
  question: string;
  correctAnswer: string;
  wrongAt: number;
};

const STORAGE_KEY = "taxi_review_v2";

function buildQuestion(): Question {
  const bank = Math.random();
  if (bank < 0.5) {
    const p = places[Math.floor(Math.random() * places.length)];
    const samePool = places.filter((x) => x.category === p.category);
    const distractors = pickDistractors(samePool, p, 3, (x) => x.location);
    const options = shuffle([p.location, ...distractors.map((d) => d.location)]);
    return {
      id: `place:${p.id}`,
      kind: `地方・${p.category}`,
      question: `「${p.name}」位於哪裡？`,
      options,
      correct: options.indexOf(p.location),
    };
  }
  if (bank < 0.72) {
    const r = routes[Math.floor(Math.random() * routes.length)];
    const distractors = pickDistractors(routes, r, 3, (x) => x.via);
    const options = shuffle([r.via, ...distractors.map((d) => d.via)]);
    return {
      id: `route:${r.id}`,
      kind: "路線",
      question: `由「${r.from}」前往「${r.to}」的最直接路線是？`,
      options,
      correct: options.indexOf(r.via),
    };
  }
  if (bank < 0.85) {
    const f = fareTable[Math.floor(Math.random() * fareTable.length)];
    const options = shuffle([
      `$${f.first2km}`,
      `$${(f.first2km + 2).toFixed(1)}`,
      `$${(f.first2km - 2.5).toFixed(1)}`,
      `$${(f.first2km + 5).toFixed(1)}`,
    ]);
    return {
      id: `fare:${f.area}`,
      kind: "收費",
      question: `${f.area}的士首 2 公里收費是？`,
      options,
      correct: options.indexOf(`$${f.first2km}`),
    };
  }
  return { ...regChoices[Math.floor(Math.random() * regChoices.length)] };
}

function readWrongs(): StoredWrong[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredWrong[]) : [];
  } catch {
    return [];
  }
}

function writeWrongs(list: StoredWrong[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

type Mode = "all" | "review";

export default function Quiz() {
  const [mode, setMode] = useState<Mode>("all");
  const [wrongs, setWrongs] = useState<StoredWrong[]>([]);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => buildQuestion());
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  useEffect(() => {
    setWrongs(readWrongs());
  }, []);

  useEffect(() => {
    setSelected(null);
    if (mode === "all") {
      setQuestion(buildQuestion());
    } else if (wrongs.length > 0) {
      const w = wrongs[index % wrongs.length];
      setQuestion(buildQuestionFromWrong(w));
    }
  }, [index, mode]);

  function buildQuestionFromWrong(w: StoredWrong): Question {
    // rebuild from id
    const [type, ref] = w.id.split(":");
    if (type === "place") {
      const p = places.find((x) => x.id === Number(ref));
      if (p) {
        const samePool = places.filter((x) => x.category === p.category);
        const distractors = pickDistractors(samePool, p, 3, (x) => x.location);
        const options = shuffle([p.location, ...distractors.map((d) => d.location)]);
        return {
          id: w.id,
          kind: w.kind,
          question: w.question,
          options,
          correct: options.indexOf(p.location),
        };
      }
    }
    if (type === "route") {
      const r = routes.find((x) => x.id === Number(ref));
      if (r) {
        const distractors = pickDistractors(routes, r, 3, (x) => x.via);
        const options = shuffle([r.via, ...distractors.map((d) => d.via)]);
        return {
          id: w.id,
          kind: "路線",
          question: w.question,
          options,
          correct: options.indexOf(r.via),
        };
      }
    }
    if (type === "fare") {
      const f = fareTable.find((x) => x.area === ref);
      if (f) {
        const options = shuffle([
          `$${f.first2km}`,
          `$${(f.first2km + 2).toFixed(1)}`,
          `$${(f.first2km - 2.5).toFixed(1)}`,
          `$${(f.first2km + 5).toFixed(1)}`,
        ]);
        return {
          id: w.id,
          kind: w.kind,
          question: w.question,
          options,
          correct: options.indexOf(`$${f.first2km}`),
        };
      }
    }
    // reg-static — look up original
    const r = regChoices.find((q) => q.id === w.id);
    if (r) return { ...r };
    // fallback: synthesize
    return {
      id: w.id,
      kind: w.kind,
      question: w.question,
      options: [w.correctAnswer, "其他選項一", "其他選項二", "其他選項三"],
      correct: 0,
    };
  }

  const answered = selected !== null;

  const choose = (i: number) => {
    if (answered || !question) return;
    setSelected(i);
    const isCorrect = i === question.correct;
    setScore((s) => ({
      right: s.right + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));

    const existing = readWrongs();
    if (!isCorrect) {
      if (!existing.find((w) => w.id === question.id)) {
        const updated = [
          {
            id: question.id,
            kind: question.kind,
            question: question.question,
            correctAnswer: question.options[question.correct],
            wrongAt: Date.now(),
          },
          ...existing,
        ];
        writeWrongs(updated);
        setWrongs(updated);
      }
    } else {
      // remove from wrong list if previously stored
      const updated = existing.filter((w) => w.id !== question.id);
      if (updated.length !== existing.length) {
        writeWrongs(updated);
        setWrongs(updated);
      }
    }
  };

  const next = () => setIndex((n) => n + 1);
  const resetScore = () => { setScore({ right: 0, total: 0 }); setIndex((n) => n + 1); };
  const clearWrongs = () => {
    writeWrongs([]);
    setWrongs([]);
    if (mode === "review") setMode("all");
  };

  const percent = useMemo(
    () => (score.total === 0 ? 0 : Math.round((score.right / score.total) * 100)),
    [score]
  );

  const modeBtnCls = (active: boolean, disabled = false) =>
    [
      "relative inline-flex items-center gap-1.5 py-1 text-[13px] tracking-[0.04em] transition-colors",
      active
        ? "font-semibold text-red after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-red"
        : disabled
          ? "cursor-default text-muted opacity-40"
          : "text-muted hover:not-disabled:text-ink-2",
    ].join(" ");

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-8 flex items-baseline justify-between text-xs tracking-[0.08em] text-muted uppercase">
        <span>測驗・{mode === "all" ? "隨機抽題" : "錯題重做"}</span>
        <span className="font-serif text-lg text-ink tracking-normal normal-case tabular-nums">
          <b className="font-medium">{score.right}</b> / {score.total}
          <span className="ml-3 text-muted">{percent}%</span>
        </span>
      </div>

      <div className="mb-10 flex flex-wrap items-center gap-5">
        <button
          type="button"
          className={modeBtnCls(mode === "all")}
          onClick={() => { setMode("all"); resetScore(); }}
        >
          隨機抽題
        </button>
        <button
          type="button"
          className={modeBtnCls(mode === "review", wrongs.length === 0)}
          onClick={() => { setMode("review"); resetScore(); }}
          disabled={wrongs.length === 0}
        >
          錯題重做
          <span
            className={`inline-flex rounded-full px-1.5 py-0.5 font-serif text-xs font-medium text-paper tabular-nums ${
              wrongs.length === 0 ? "bg-muted opacity-50" : "bg-red"
            }`}
          >
            {wrongs.length}
          </span>
        </button>
        {wrongs.length > 0 && (
          <button
            type="button"
            className="ml-auto py-1 text-[11px] tracking-[0.08em] text-muted transition-colors hover:text-red"
            onClick={clearWrongs}
          >
            清除錯題
          </button>
        )}
      </div>

      {mode === "review" && wrongs.length === 0 ? (
        <div className="px-5 py-20 text-center font-serif text-muted italic">暫無錯題　·　答錯時會自動儲存</div>
      ) : (
        <div className="flex flex-col gap-6" key={`${mode}-${index}`}>
          <QuestionCard
            question={question}
            selected={selected}
            onSelect={choose}
            showExplain={answered}
          />

          <div className="mt-6 flex justify-end gap-5">
            <button
              type="button"
              className="py-2 text-[13px] font-semibold tracking-[0.05em] text-muted uppercase transition-colors hover:text-ink"
              onClick={resetScore}
            >
              重置成績
            </button>
            <button
              type="button"
              className="py-2 text-[13px] font-semibold tracking-[0.05em] text-red uppercase transition-colors hover:text-red-deep"
              onClick={next}
            >
              {answered ? "下一題 →" : "跳過"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
