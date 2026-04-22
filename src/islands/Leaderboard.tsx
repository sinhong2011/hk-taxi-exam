import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";
import { getOrCreateDeviceId } from "../lib/identity";

// Thresholds match Mock.tsx — kept in sync by hand for now. Worth hoisting to
// a shared constants module if a third consumer shows up.
const PART_A_THRESHOLD = 34;
const PART_B_THRESHOLD = 30;

type MockRunRow = {
  id: string;
  display_name: string;
  part_a_correct: number;
  part_a_total: number;
  part_b_correct: number;
  part_b_total: number;
  verdict: "pass" | "fail";
  duration_sec: number;
  device_id: string;
  created_at: string;
};

type LoadState = "loading" | "ready" | "error";

function fmtDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(r)}`;
  return `${pad(m)}:${pad(r)}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Leaderboard() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MockRunRow[]>([]);
  const [myDeviceId, setMyDeviceId] = useState<string>("");

  const fetchRows = async () => {
    setLoadState("loading");
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("mock_runs")
        .select(
          "id, display_name, part_a_correct, part_a_total, part_b_correct, part_b_total, verdict, duration_sec, device_id, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (err) {
        setError(err.message);
        setLoadState("error");
        return;
      }
      setRows((data ?? []) as MockRunRow[]);
      setLoadState("ready");
    } catch (e) {
      setError((e as Error)?.message ?? "未知錯誤");
      setLoadState("error");
    }
  };

  useEffect(() => {
    setMyDeviceId(getOrCreateDeviceId());
    if (supabaseReady) void fetchRows();
    else setLoadState("ready");
  }, []);

  // Client-side rank: total score DESC, duration ASC (faster wins tiebreak),
  // then most recent. Top 50 shown.
  const ranked = useMemo(() => {
    return rows
      .slice()
      .sort((a, b) => {
        const scoreDiff =
          b.part_a_correct + b.part_b_correct - (a.part_a_correct + a.part_b_correct);
        if (scoreDiff !== 0) return scoreDiff;
        const timeDiff = a.duration_sec - b.duration_sec;
        if (timeDiff !== 0) return timeDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 50);
  }, [rows]);

  if (!supabaseReady) {
    return (
      <div className="mx-auto max-w-[640px]">
        <div className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-red uppercase">龍虎榜</div>
        <h1 className="mb-4 font-serif text-[clamp(32px,5vw,48px)] leading-[1.15] font-medium tracking-[-0.02em] text-ink">
          未配置
        </h1>
        <p className="max-w-[58ch] text-base leading-[1.75] text-ink-2">
          龍虎榜功能未配置。請在 <code>.env</code> 設定 <code>PUBLIC_SUPABASE_URL</code> 與{" "}
          <code>PUBLIC_SUPABASE_ANON_KEY</code>。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[880px]">
      <div className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-red uppercase">龍虎榜</div>
      <h1 className="mb-3 font-serif text-[clamp(32px,5vw,48px)] leading-[1.15] font-medium tracking-[-0.02em] text-ink">
        前五十名
      </h1>
      <div className="mb-8 max-w-[58ch] text-base leading-[1.75] text-ink-2">
        按總分排序，同分者較快者居前，再同則以最新者居前。匿名顯示名稱為使用者自訂。
      </div>

      {loadState === "loading" && (
        <div className="text-sm text-muted">載入中…</div>
      )}

      {loadState === "error" && (
        <div className="mb-4 border border-red bg-red-soft px-[18px] py-4">
          <div className="mb-1.5 font-semibold text-red-deep">龍虎榜暫時載入唔到</div>
          <div className="mb-2.5 text-[13.5px] text-ink-2">食咗 cookie 未？{error ? `（${error}）` : ""}</div>
          <button
            type="button"
            className="py-2 text-[13px] font-semibold tracking-[0.05em] text-red uppercase transition-colors hover:text-red-deep"
            onClick={() => void fetchRows()}
          >
            再試 →
          </button>
        </div>
      )}

      {loadState === "ready" && ranked.length === 0 && (
        <div className="border border-l-2 border-line border-l-red px-6 py-6 text-[15px] text-ink-2">
          <div className="mb-2 font-serif text-xl text-ink">未有人提交</div>
          <div className="mb-4">第一個做 sifu 啦。</div>
          <a
            href="/mock"
            className="inline-block py-2 text-[13px] font-semibold tracking-[0.05em] text-red uppercase transition-colors hover:text-red-deep"
          >
            去模擬試 →
          </a>
        </div>
      )}

      {loadState === "ready" && ranked.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm tabular-nums">
            <thead>
              <tr>
                <th className="border-b border-line-strong px-3 py-3 text-left text-[11px] font-semibold tracking-[0.12em] text-muted whitespace-nowrap uppercase">#</th>
                <th className="border-b border-line-strong px-3 py-3 text-left text-[11px] font-semibold tracking-[0.12em] text-muted whitespace-nowrap uppercase">名</th>
                <th className="border-b border-line-strong px-3 py-3 text-right text-[11px] font-semibold tracking-[0.12em] text-muted whitespace-nowrap uppercase">Part A</th>
                <th className="border-b border-line-strong px-3 py-3 text-right text-[11px] font-semibold tracking-[0.12em] text-muted whitespace-nowrap uppercase">Part B</th>
                <th className="border-b border-line-strong px-3 py-3 text-right text-[11px] font-semibold tracking-[0.12em] text-muted whitespace-nowrap uppercase">總分</th>
                <th className="border-b border-line-strong px-3 py-3 text-right text-[11px] font-semibold tracking-[0.12em] text-muted whitespace-nowrap uppercase">時間</th>
                <th className="border-b border-line-strong px-3 py-3 text-right text-[11px] font-semibold tracking-[0.12em] text-muted whitespace-nowrap uppercase max-sm:hidden">日期</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const isMe = r.device_id === myDeviceId;
                const aPass = r.part_a_correct >= PART_A_THRESHOLD;
                const bPass = r.part_b_correct >= PART_B_THRESHOLD;
                const total = r.part_a_correct + r.part_b_correct;
                const rowCls = isMe
                  ? "[&>td]:bg-red-soft [&>td]:text-ink"
                  : "[&>td]:text-ink-2";
                return (
                  <tr key={r.id} className={rowCls}>
                    <td className={`w-10 border-b border-line px-3 py-3 font-serif text-[15px] whitespace-nowrap max-sm:w-8 max-sm:text-sm ${isMe ? "font-semibold text-red" : "text-muted"}`}>
                      {i + 1}
                    </td>
                    <td className="border-b border-line px-3 py-3 font-serif text-[15px] tracking-[-0.005em] text-ink max-sm:text-sm">
                      <span>{r.display_name}</span>
                      {isMe && (
                        <span className="ml-2 font-sans text-[11px] font-semibold tracking-[0.08em] text-red uppercase">
                          你
                        </span>
                      )}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-right font-mono whitespace-nowrap">
                      {r.part_a_correct}/{r.part_a_total}{" "}
                      <span className={aPass ? "text-olive" : "text-red"}>
                        {aPass ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="border-b border-line px-3 py-3 text-right font-mono whitespace-nowrap">
                      {r.part_b_correct}/{r.part_b_total}{" "}
                      <span className={bPass ? "text-olive" : "text-red"}>
                        {bPass ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className={`border-b border-line px-3 py-3 text-right font-serif text-base whitespace-nowrap ${isMe ? "text-red" : "text-ink"}`}>
                      {total}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-right font-mono whitespace-nowrap">{fmtDuration(r.duration_sec)}</td>
                    <td className="border-b border-line px-3 py-3 text-right font-mono whitespace-nowrap max-sm:hidden">{fmtDate(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4 text-xs text-muted">
            顯示最新 200 筆中排名前 50。自動重新整理：重新載入此頁。
          </div>
        </div>
      )}
    </div>
  );
}
