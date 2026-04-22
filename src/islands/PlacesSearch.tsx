import { useMemo, useState } from "react";
import { places, placeCategories } from "../data/places";

const highlight = (text: string, q: string) => {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
};

// Google Maps deep-link helpers. Appending 香港 disambiguates HK-specific names.
const mapsSearchUrl = (query: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} 香港`)}`;

export default function PlacesSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("全部");

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (category !== "全部" && p.category !== category) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
    });
  }, [query, category]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <input
          type="search"
          placeholder="搜尋地方名或位置…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border-0 border-b border-line-strong bg-transparent py-3 font-serif text-lg tracking-[-0.01em] text-ink transition-colors placeholder:text-muted placeholder:italic focus:border-b-red focus:outline-none"
        />
        <div className="flex flex-wrap gap-[18px] text-[13px]">
          <button
            type="button"
            onClick={() => setCategory("全部")}
            className={`relative py-0.5 tracking-[0.02em] transition-colors ${
              category === "全部"
                ? "font-semibold text-red after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-red"
                : "text-muted hover:text-ink"
            }`}
          >
            全部<span className="ml-1 text-[11px] text-muted tabular-nums">{places.length}</span>
          </button>
          {placeCategories.map((c) => {
            const count = places.filter((p) => p.category === c).length;
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`relative py-0.5 tracking-[0.02em] transition-colors ${
                  active
                    ? "font-semibold text-red after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-red"
                    : "text-muted hover:text-ink"
                }`}
              >
                {c}<span className="ml-1 text-[11px] text-muted tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-20 text-center font-serif text-muted italic">沒有符合的結果</div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[50px_minmax(0,1.2fr)_minmax(0,1fr)_90px] items-baseline gap-5 py-3 max-tablet:grid-cols-[40px_minmax(0,1fr)_80px] max-tablet:gap-3.5"
            >
              <div className="font-serif text-[13px] text-muted tabular-nums">
                {String(p.id).padStart(3, "0")}
              </div>
              <a
                href={mapsSearchUrl(`${p.name} ${p.location}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[15px] leading-[1.4] font-medium text-ink underline decoration-transparent underline-offset-[3px] transition-colors hover:text-red hover:decoration-red"
                aria-label={`在 Google Maps 搜尋 ${p.name}（${p.location}）`}
              >
                {highlight(p.name, query)}
              </a>
              <a
                href={mapsSearchUrl(p.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm leading-[1.5] text-ink-2 underline decoration-transparent underline-offset-[3px] transition-colors hover:text-red hover:decoration-red max-tablet:col-[2/3] max-tablet:text-[13px] max-tablet:text-muted"
                aria-label={`在 Google Maps 搜尋區域：${p.location}`}
              >
                {highlight(p.location, query)}
              </a>
              <div className="text-right text-[10.5px] tracking-[0.12em] text-muted uppercase">
                {p.category}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
