// Re-scrape TD's 《道路使用者守則》 chapter 8 pages and rebuild
// public/signs/catalog.json with captions taken from each <img title="..." alt="...">.
//
// The previous version used a greedy "caption follows image" regex that tried
// to grab surrounding text, which only caught 110 of 329 entries because TD's
// pages pack sign thumbnails into grid tables where caption text lives on the
// image's own title/alt attribute, not in sibling text.
//
// Run: node scripts/fetch-sign-captions.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "public", "signs", "catalog.json");

const BASE =
  "https://www.td.gov.hk/tc/road_safety/road_users_code/index/chapter_8_the_language_of_the_road";

const PAGES = [
  ["禁制／指令", "signs_giving_orders_"],
  ["警告", "signs_giving_warning_"],
  ["方向", "direction_signs_"],
  ["提示", "signs_giving_information_"],
  ["臨時", "temporary_signs_"],
  ["道路標記", "road_markings_giving_orders_"],
  ["提示標記", "road_markings_giving_warning_and_information_"],
];

// Files that live in public/signs/ but don't appear on TD's chapter 8 pages
// (they are referenced elsewhere in the code or were added manually). We keep
// these captions authored so no image on /roadcode renders without context.
const AUTHORED_FALLBACKS = {
  "113b6_n2.jpg":
    "標誌上會劃上國際暢通易達的圖案，指示前往適合行動不便人士使用設施的路線或入口",
  "115a6.jpg": "分流人字形標記",
};

function decodeHtmlEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function getAttr(tag, name) {
  const m = tag.match(new RegExp("\\b" + name + '\\s*=\\s*"([^"]*)"', "i"));
  return m ? decodeHtmlEntities(m[1]).trim() : "";
}

function captionFromImg(tag) {
  return getAttr(tag, "title") || getAttr(tag, "alt");
}

const entries = [];

for (const [label, slug] of PAGES) {
  const url = BASE + "/" + slug + "/index.html";
  process.stderr.write("→ " + label + " (" + slug + ") … ");
  const html = await fetch(url).then((r) => r.text());
  // TD consistently emits self-closing <img ... /> tags for sign thumbnails;
  // this regex grabs the whole tag so we can read its title/alt attrs.
  const imgRE = /<img\b[^>]*\bsrc\s*=\s*"([^"]+\.(?:gif|png|jpg))"[^>]*\/?>/gi;
  let m;
  let count = 0;
  while ((m = imgRE.exec(html))) {
    const src = m[1];
    const fname = path.basename(src);
    const caption = captionFromImg(m[0]).slice(0, 160);
    entries.push({ category: label, file: fname, caption });
    count += 1;
  }
  process.stderr.write(count + " imgs\n");
}

const seen = new Set();
const unique = entries.filter((e) => {
  if (seen.has(e.file)) return false;
  seen.add(e.file);
  return true;
});

// Merge the freshly scraped data with the existing catalog so we (a) preserve
// the entry ordering (minimal diff), (b) keep authored fallbacks for files TD
// doesn't list, and (c) append any newly-discovered TD entries at the end.
let existing = [];
try {
  existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
} catch {
  // first run
}

const byFile = new Map(unique.map((e) => [e.file, e]));
const final = [];
const addedFromTd = new Set();

for (const e of existing) {
  const td = byFile.get(e.file);
  if (td) {
    final.push(td);
    addedFromTd.add(e.file);
  } else if (AUTHORED_FALLBACKS[e.file]) {
    final.push({ category: e.category, file: e.file, caption: AUTHORED_FALLBACKS[e.file] });
  } else {
    final.push(e);
  }
}

for (const e of unique) {
  if (!addedFromTd.has(e.file)) final.push(e);
}

fs.writeFileSync(outPath, JSON.stringify(final, null, 2), "utf8");
const captioned = final.filter((e) => e.caption && e.caption.trim()).length;
process.stderr.write(
  "✓ " + final.length + " entries, " + captioned + " captioned (" +
    Math.round((100 * captioned) / final.length) + "%) → " + outPath + "\n",
);
