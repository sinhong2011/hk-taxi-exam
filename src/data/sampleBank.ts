// Official Transport Department sample-paper questions (Approach C).
// Source: TD《的士筆試指引》(2026 年 4 月版). Every question and answer here is
// verbatim from that document — no synthesis, no paraphrase. The `explain`
// field carries the TD citation ("官方答案：X. 來源：XX P.Y") so users studying
// wrong answers can go straight to the original page.
//
// Composition:
//   Part A samples (6): 2 regs + 2 places + 2 routes
//   Part B samples (4): all roadcode
// Different from the real exam ratio (40+35) — this is diagnostic only.

import type { MockQuestion } from "./question";

export const sampleQuestions: MockQuestion[] = [
  // -------------------------------------------------------------------------
  // Part A — 6 官方樣本
  // -------------------------------------------------------------------------
  {
    id: "reg:sample-meter-authority",
    kind: "則例・的士營運",
    topic: "regs",
    question:
      "每部的士須安裝一個設計及構造獲________批准及在指定位置和方式下裝配之的士計程錶。",
    options: ["的士車主", "運輸署署長", "警務處處長", "機電工程署署長"],
    correct: 1,
    explain: "官方答案：B 運輸署署長。來源：的士營運 P.1。",
  },
  {
    id: "reg:sample-meter-spec",
    kind: "則例・的士營運",
    topic: "regs",
    question: "下列哪一項不符合的士計程錶的構造規定？",
    options: [
      "不可封實，以便壞了時司機可隨時修理",
      "錶面應設有照明設備",
      "錶面上顯示根據規定的最低收費和遞增的附加費",
      "錶面上顯示車費和附加費的數字、高度不少於 10 毫米",
    ],
    correct: 0,
    explain:
      "官方答案：A 不可封實，以便壞了時司機可隨時修理（此項違反規定）。來源：的士營運 P.1。",
  },
  {
    id: "place:sample-sino-plaza",
    kind: "地方",
    topic: "places",
    question: "信和廣場位於哪個區域／街道？",
    options: ["大圍", "深水埗", "元朗", "銅鑼灣"],
    correct: 3,
    explain: "官方答案：D 銅鑼灣。來源：TD《的士筆試指引》官方樣本。",
  },
  {
    id: "place:sample-southorn-centre",
    kind: "地方",
    topic: "places",
    question: "修頓中心位於哪個區域／街道？",
    options: ["尖沙咀", "太子", "灣仔", "香港仔"],
    correct: 2,
    explain: "官方答案：C 灣仔。來源：TD《的士筆試指引》官方樣本。",
  },
  {
    id: "route:sample-sai-wan-to-diocesan",
    kind: "路線",
    topic: "routes",
    question:
      "若由西灣河嘉亨灣駛至旺角拔萃男書院，在正常交通情況下，以及不需考慮隧道收費（如適用）的情形下，哪一條路線最直接可行？",
    options: [
      "經東區海底隧道、觀塘道、龍翔道及竹園道",
      "經告士打道、紅磡海底隧道及公主道",
      "經中環及灣仔繞道、干諾道中、西區海底隧道、西九龍公路及麗翔道",
    ],
    correct: 1,
    explain:
      "官方答案：B 經告士打道、紅磡海底隧道及公主道。來源：TD《的士筆試指引》官方樣本。",
  },
  {
    id: "route:sample-tsuen-wan-to-sheung-wan",
    kind: "路線",
    topic: "routes",
    question:
      "若由荃灣悅來酒店駛至上環港澳碼頭，在正常交通情況下，以及不需考慮隧道收費（如適用）的情形下，哪一條路線最直接可行？",
    options: [
      "經青葵公路、西九龍公路及西區海底隧道",
      "經青衣南橋、昂船洲大橋、青沙公路、西九龍公路及西區海底隧道",
      "經龍翔道、竹園道、窩打老道、公主道、紅磡海底隧道及告士打道",
    ],
    correct: 0,
    explain:
      "官方答案：A 經青葵公路、西九龍公路及西區海底隧道。來源：TD《的士筆試指引》官方樣本。",
  },

  // -------------------------------------------------------------------------
  // Part B — 4 官方樣本
  // -------------------------------------------------------------------------
  {
    id: "rc:sample-flooded-road",
    kind: "道路使用者守則",
    topic: "roadcode",
    question: "駛過水浸的街道後，你應________。",
    options: [
      "閃動車頭燈警告迎面車輛",
      "響號警告尾隨車輛",
      "立即試驗煞車系統的性能",
    ],
    correct: 2,
    explain: "官方答案：C 立即試驗煞車系統的性能。來源：道路使用者守則 P.87。",
  },
  {
    id: "rc:sample-red-pole-signage",
    kind: "道路使用者守則",
    topic: "roadcode",
    question:
      "若用以豎立『不准停車』標誌的標誌杆為紅色則代表________不准停車。",
    options: [
      "上午七時至下午七時",
      "上午七時至十時及下午四時至七時",
      "上午七時至午夜十二時",
    ],
    correct: 2,
    explain:
      "官方答案：C 上午七時至午夜十二時。來源：道路使用者守則 P.91。",
  },
  {
    id: "rc:sample-motorcycle-passenger",
    kind: "道路使用者守則",
    topic: "roadcode",
    question:
      "電單車後座（側車固定座位除外），不可以運載少於________歲的乘客。",
    options: ["8", "10", "12"],
    correct: 0,
    explain: "官方答案：A 8 歲。來源：道路使用者守則 P.103。",
  },
  {
    id: "rc:sample-foggy-roadworks",
    kind: "道路使用者守則",
    topic: "roadcode",
    // Image-based TD sample question. The "道路工程反光標誌" referenced in
    // the original paper is the standard red-triangle workman-digging warning
    // (109a5 in the 道路使用者守則 第八章 catalog). QuestionCard renders the
    // sign above this prompt, so the text no longer needs the inline bracket
    // placeholder that used to stand in for the image.
    question: "在薄霧天氣下，看到此標誌時，你應﹕",
    options: [
      "以正常車速駛經工地，以免阻塞工地或附近的工程人員及車輛",
      "慢駛，與前車保持安全距離，並提防在工地或附近，工程人員及車輛會突然走近或闖入行車線",
      "立即停車，並切勿駛越這標誌，這標誌會在薄霧天氣消除後才被移除",
    ],
    correct: 1,
    explain:
      "官方答案：B 慢駛，與前車保持安全距離，並提防在工地或附近，工程人員及車輛會突然走近或闖入行車線。來源：道路使用者守則 P.87 及 88。",
    imageSrc: "/signs/109a5.gif",
    imageAlt: "道路工程反光標誌：紅色三角形內有工程人員掘地圖案",
  },
];

export function getSampleBankSize(): number {
  return sampleQuestions.length;
}

// Part A / Part B split for the sample-mode runner. Part B is defined as all
// roadcode samples; everything else goes into Part A.
export function getSamplePartA(): MockQuestion[] {
  return sampleQuestions.filter((q) => q.topic !== "roadcode");
}

export function getSamplePartB(): MockQuestion[] {
  return sampleQuestions.filter((q) => q.topic === "roadcode");
}
