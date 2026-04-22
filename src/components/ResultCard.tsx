import { forwardRef } from "react";
import { topicLabels, type Topic } from "../data/topics";
import type { VerdictComment } from "../data/verdictComments";

// ---------------------------------------------------------------------------
// Shareable poster card (1080×1350 portrait).
// All styling is inline so html-to-image captures it reliably without
// depending on the page's stylesheet. Colors mirror global.css tokens.
// ---------------------------------------------------------------------------

// Design tokens copied from global.css :root to keep the card self-contained.
const TOK = {
  paper: "#0f1013",
  paper2: "#16171b",
  paperRaised: "#1b1c21",
  ink: "#ece6d7",
  ink2: "#b8b2a3",
  ink3: "#8a857a",
  muted: "#68635a",
  line: "rgba(236, 230, 215, 0.12)",
  lineStrong: "rgba(236, 230, 215, 0.22)",
  red: "#e64150",
  redDeep: "#b3313c",
  redSoft: "rgba(230, 65, 80, 0.12)",
  olive: "#a6c277",
  fontSans:
    '"PingFang TC", "Microsoft JhengHei", "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  fontSerif:
    'Georgia, "Songti TC", "Noto Serif TC", "Source Han Serif TC", "STSong", serif',
};

export type TopicRow = {
  topic: Topic;
  correct: number;
  wrong: number;
  total: number;
  rate: number; // wrong / total
};

export type ResultCardProps = {
  verdict: VerdictComment;
  partA: { correct: number; total: number; pass: boolean };
  partB: { correct: number; total: number; pass: boolean };
  overallPass: boolean;
  topicRows: TopicRow[];
  date: Date;
  // Optional display-only signature shown in the header. Never persisted —
  // lives only in the rendered PNG the user explicitly chooses to export.
  nickname?: string;
};

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

const ResultCard = forwardRef<HTMLDivElement, ResultCardProps>(function ResultCard(
  { verdict, partA, partB, overallPass, topicRows, date, nickname },
  ref,
) {
  const shownRows = topicRows.slice(0, 7);
  const trimmedNick = nickname?.trim() ?? "";

  return (
    <div
      ref={ref}
      style={{
        // Fixed sizing for consistent PNG export
        width: 1080,
        height: 1350,
        background: TOK.paper,
        color: TOK.ink,
        fontFamily: TOK.fontSans,
        padding: "72px 80px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
        // Radial red glow in top-right, mirrors site body background
        backgroundImage: `radial-gradient(900px 500px at 85% -5%, rgba(230, 65, 80, 0.10), transparent 60%)`,
      }}
    >
      {/* 1. Brand header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          paddingBottom: 24,
          borderBottom: `1px solid ${TOK.line}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              background: TOK.red,
              borderRadius: "50%",
              transform: "translateY(2px)",
            }}
          />
          <span
            style={{
              fontFamily: TOK.fontSerif,
              fontSize: 24,
              fontWeight: 600,
              color: TOK.ink,
              letterSpacing: "-0.01em",
            }}
          >
            的士筆試・模擬試結果
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          {trimmedNick && (
            <div
              style={{
                fontFamily: TOK.fontSerif,
                fontStyle: "italic",
                fontSize: 18,
                color: TOK.ink2,
                letterSpacing: "-0.005em",
                maxWidth: 520,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {trimmedNick}
            </div>
          )}
          <div
            style={{
              fontSize: 14,
              color: TOK.muted,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.04em",
            }}
          >
            {formatDate(date)}
          </div>
        </div>
      </div>

      {/* 2+3. Verdict comment block (title + body) */}
      <div
        style={{
          marginTop: 48,
          paddingLeft: 20,
          borderLeft: `3px solid ${TOK.red}`,
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: TOK.red,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          評語
        </div>
        <div
          style={{
            fontFamily: TOK.fontSerif,
            fontSize: 64,
            fontWeight: 500,
            lineHeight: 1.15,
            color: TOK.ink,
            letterSpacing: "-0.02em",
            marginBottom: 20,
          }}
        >
          「{verdict.title}」
        </div>
        <div
          style={{
            fontFamily: TOK.fontSerif,
            fontSize: 22,
            lineHeight: 1.6,
            color: TOK.ink2,
            fontStyle: "italic",
          }}
        >
          {verdict.body}
        </div>
      </div>

      {/* 4. Score block: Part A / Part B side by side */}
      <div
        style={{
          marginTop: 56,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderTop: `1px solid ${TOK.lineStrong}`,
          borderBottom: `1px solid ${TOK.lineStrong}`,
        }}
      >
        <ScoreCell label="Part A" correct={partA.correct} total={partA.total} pass={partA.pass} rightBorder />
        <ScoreCell label="Part B" correct={partB.correct} total={partB.total} pass={partB.pass} />
      </div>

      {/* 5. Verdict line — 通過 / 不通過 (huge) */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          alignItems: "baseline",
          gap: 20,
        }}
      >
        <span
          style={{
            fontSize: 13,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: TOK.muted,
            fontWeight: 600,
          }}
        >
          最終判斷
        </span>
        <span
          style={{
            fontFamily: TOK.fontSerif,
            fontSize: 88,
            lineHeight: 1,
            fontWeight: 500,
            color: overallPass ? TOK.olive : TOK.red,
            letterSpacing: "-0.03em",
          }}
        >
          {overallPass ? "通過" : "不通過"}
        </span>
        <span
          style={{
            fontFamily: TOK.fontSerif,
            fontSize: 28,
            fontStyle: "italic",
            color: overallPass ? TOK.olive : TOK.red,
          }}
        >
          {overallPass ? "Pass" : "Fail"}
        </span>
      </div>

      {/* 6. Per-topic mini bars */}
      <div style={{ marginTop: 48, flex: 1 }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: TOK.muted,
            fontWeight: 500,
            marginBottom: 20,
          }}
        >
          按主題錯誤率
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {shownRows.map((r) => (
            <TopicBar key={r.topic} row={r} />
          ))}
          {shownRows.length === 0 && (
            <div style={{ color: TOK.muted, fontSize: 14, fontFamily: TOK.fontSerif, fontStyle: "italic" }}>
              未有主題資料
            </div>
          )}
        </div>
      </div>

      {/* 7. Footer */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 20,
          borderTop: `1px solid ${TOK.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: 13,
          color: TOK.muted,
          letterSpacing: "0.04em",
        }}
      >
        <span>的士筆試備考手冊　・　2026 年 4 月版</span>
        <span style={{ fontFamily: TOK.fontSerif, color: TOK.ink3 }}>
          Mock Exam · Self-Assessment
        </span>
      </div>
    </div>
  );
});

function ScoreCell({
  label,
  correct,
  total,
  pass,
  rightBorder,
}: {
  label: string;
  correct: number;
  total: number;
  pass: boolean;
  rightBorder?: boolean;
}) {
  return (
    <div
      style={{
        padding: "36px 28px",
        borderRight: rightBorder ? `1px solid ${TOK.line}` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: TOK.muted,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span
          style={{
            fontFamily: TOK.fontSerif,
            fontSize: 72,
            lineHeight: 1,
            fontWeight: 500,
            color: TOK.ink,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.03em",
          }}
        >
          {correct}
        </span>
        <span
          style={{
            fontFamily: TOK.fontSerif,
            fontSize: 28,
            color: TOK.muted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ／{total}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: TOK.fontSerif,
            fontSize: 32,
            color: pass ? TOK.olive : TOK.red,
          }}
        >
          {pass ? "✓" : "✗"}
        </span>
      </div>
    </div>
  );
}

function TopicBar({ row }: { row: TopicRow }) {
  const pct = Math.round(row.rate * 100);
  // bar fill color intensifies with error rate
  const barColor = row.rate >= 0.5 ? TOK.red : row.rate >= 0.25 ? TOK.redDeep : TOK.olive;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr 90px",
        gap: 20,
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 16, color: TOK.ink, fontWeight: 500 }}>
        {topicLabels[row.topic]}
      </div>
      <div
        style={{
          position: "relative",
          height: 10,
          background: TOK.line,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${Math.max(2, pct)}%`,
            background: barColor,
            borderRadius: 2,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 14,
          color: TOK.ink2,
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
          fontFamily: TOK.fontSerif,
        }}
      >
        錯 {row.wrong}/{row.total}
      </div>
    </div>
  );
}

export default ResultCard;
