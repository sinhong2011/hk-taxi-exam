// Pure presentation component for a single MCQ.
// Shared by Quiz.tsx (casual mode) and Mock.tsx (Part A / Part B runners).
// Parent owns state (selection, storage, advancement). No effects here.

type QuestionCardProps = {
  question: {
    id: string;
    kind: string;
    question: string;
    options: string[];
    correct: number;
    explain?: string;
    imageSrc?: string;
    imageAlt?: string;
  };
  selected: number | null;
  onSelect: (idx: number) => void;
  showExplain: boolean;
};

export default function QuestionCard({
  question,
  selected,
  onSelect,
  showExplain,
}: QuestionCardProps) {
  const answered = selected !== null;
  const correct = answered && selected === question.correct;

  return (
    <>
      <div className="text-[11px] font-semibold tracking-[0.16em] text-red uppercase">
        {question.kind}
      </div>
      {question.imageSrc && (
        <div className="flex max-w-full items-center justify-center rounded-sm bg-white p-3">
          <img
            src={question.imageSrc}
            alt={question.imageAlt ?? "題目圖像"}
            loading="lazy"
            decoding="async"
            className="block max-h-[200px] max-w-full object-contain"
          />
        </div>
      )}
      <div className="font-serif text-[clamp(22px,4vw,28px)] leading-[1.35] font-medium tracking-[-0.01em] text-ink">
        {question.question}
      </div>
      <div className="flex flex-col gap-1 pt-2">
        {question.options.map((opt, i) => {
          const isCorrect = answered && i === question.correct;
          const isWrong = answered && i === selected && i !== question.correct;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              disabled={answered}
              className={[
                "flex items-baseline gap-3.5 py-3 text-left font-sans text-[15px] transition-[color,padding] duration-150 disabled:cursor-default",
                isCorrect
                  ? "text-olive [&_.qletter]:text-olive"
                  : isWrong
                    ? "text-red line-through decoration-red"
                    : "text-ink enabled:hover:pl-1.5 enabled:hover:text-red",
              ].join(" ")}
            >
              <span className="qletter min-w-5 font-serif text-[15px] text-muted">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`pt-1 font-serif text-sm leading-[1.7] ${
            correct ? "text-olive" : "text-red"
          }`}
        >
          {correct ? "答對了。" : "錯了。"}
          {!correct && (
            <>
              正確答案是 {String.fromCharCode(65 + question.correct)}：
              {question.options[question.correct]}
            </>
          )}
          {showExplain && question.explain && (
            <div className="mt-1.5 font-sans text-[13.5px] text-ink-2">
              {question.explain}
            </div>
          )}
        </div>
      )}
    </>
  );
}
