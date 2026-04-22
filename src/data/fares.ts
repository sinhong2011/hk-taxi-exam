// 的士收費參考資料
// 來源：運輸署《的士營運小冊子》(2026 年 3 月修訂) 附錄丙、第七章、第十四章
// partABank.ts 的收費題目生成器依賴 fareTable / FareRow 的 shape，請勿改動。

export type FareRow = {
  area: "市區" | "新界" | "大嶼山";
  color: string;
  first2km: number;
  upperStep: number;
  threshold: number;
  afterStep: number;
};

// 三區的士的基本跳錶（附錄丙）
// first2km  = 首 2 公里（或其任何部分）之收費
// upperStep = 其後每 200 米／每分鐘等候時間之收費（未達 threshold 前）
// threshold = 應收款額達此水平後轉用 afterStep
// afterStep = 達到 threshold 後，其後每 200 米／每分鐘之收費
export const fareTable: FareRow[] = [
  { area: "市區", color: "#e23d3d", first2km: 29, upperStep: 2.1, threshold: 102.5, afterStep: 1.4 },
  { area: "新界", color: "#2fa96c", first2km: 25.5, upperStep: 1.9, threshold: 82.5, afterStep: 1.4 },
  { area: "大嶼山", color: "#2d7bd1", first2km: 24, upperStep: 1.9, threshold: 195, afterStep: 1.6 },
];

// ── 附加費（附錄丙・其他收費） ────────────────────────────────
export type Surcharge = {
  id: string;
  label: string;
  amount: string;
  condition?: string;
  hot?: boolean;
};

export const surcharges: Surcharge[] = [
  {
    id: "luggage",
    label: "行李費（每件）",
    amount: "$6",
    condition: "擺放於車尾行李廂之行李；擺放在乘客車廂內之輕便手提行李除外",
    hot: true,
  },
  {
    id: "animal",
    label: "動物或雀鳥費（每隻）",
    amount: "$5",
    condition: "隨行之動物或雀鳥；是否接載由司機酌情決定",
    hot: true,
  },
  {
    id: "radio",
    label: "電召預約費（每程）",
    amount: "$5",
    condition: "市區／新界／大嶼山三區劃一 $5",
    hot: true,
  },
  {
    id: "wheelchair",
    label: "輪椅、拐杖及輔助行動物件",
    amount: "免費",
    condition: "傷殘乘客攜帶之輪椅、拐杖或其他輔助行動物件，不論大小及擺放位置",
  },
  {
    id: "light-luggage",
    label: "輕便手提行李",
    amount: "免費",
    condition: "擺放於乘客車廂內，每件長、闊、高總和不超過 140 厘米",
  },
];

// ── 隧道／收費道路附加費（附錄丙） ────────────────────────────
export type AreaExtra = {
  id: string;
  label: string;
  amount: string;
  appliesTo: Array<"市區" | "新界" | "大嶼山">;
  condition?: string;
  exemption?: string;
  hot?: boolean;
};

export const areaExtras: AreaExtra[] = [
  {
    id: "cross-harbour",
    label: "海底隧道（紅隧）",
    amount: "隧道費 + $25 回程費",
    appliesTo: ["市區", "新界", "大嶼山"],
    condition: "乘客繳付隧道費，加司機回程費 $25",
    exemption: "於過海的士站上車，或最終目的地非位於海港另一方，可免回程費",
    hot: true,
  },
  {
    id: "eastern-harbour",
    label: "東區海底隧道",
    amount: "隧道費 + $25 回程費",
    appliesTo: ["市區", "新界", "大嶼山"],
    condition: "乘客繳付隧道費，加司機回程費 $25",
    exemption: "於過海的士站上車，或最終目的地非位於海港另一方，可免回程費",
    hot: true,
  },
  {
    id: "western-harbour",
    label: "西區海底隧道",
    amount: "隧道費 + $25 回程費",
    appliesTo: ["市區", "新界", "大嶼山"],
    condition: "乘客繳付隧道費，加司機回程費 $25",
    exemption: "於過海的士站上車，或最終目的地非位於海港另一方，可免回程費",
    hot: true,
  },
  {
    id: "tai-lam",
    label: "大欖隧道",
    amount: "司機所付的隧道費",
    appliesTo: ["市區", "新界"],
    condition: "只收司機實付之隧道費，不另加回程費",
  },
  {
    id: "other-tolls",
    label: "其他收費隧道／道路／區",
    amount: "按使用費",
    appliesTo: ["市區", "新界", "大嶼山"],
    condition: "依實際使用費計算，由乘客繳付",
  },
];

// ── 與收費相關的規則（第七章、第十四章） ─────────────────────
export type FareRule = {
  id: string;
  title: string;
  desc: string;
  hot?: boolean;
};

export const fareRules: FareRule[] = [
  {
    id: "meter-start",
    title: "跳錶起計時點",
    desc: "由啟程的時候起計算，或由指定的時間及地點以供租用人使用的時候起計算。",
  },
  {
    id: "meter-display",
    title: "咪錶顯示規格",
    desc: "錶面須顯示法定最低收費及遞增附加費；車費與附加費數字高度不少於 10 毫米。",
  },
  {
    id: "fare-table-display",
    title: "車內須展示收費表",
    desc: "的士可供出租期間，須讓乘客清楚看到中英對照收費表；設計、構造及位置須符合署長規定。",
  },
  {
    id: "coin-float",
    title: "輔幣規定（最低數值）",
    desc: "司機須備 $10 面額鈔票或 $2 或以上面額硬幣達 $90；$1 或以下面額硬幣達 $10。",
    hot: true,
  },
  {
    id: "e-payment-2026",
    title: "電子支付（2026/4/1 起）",
    desc: "必須容許透過至少一種二維碼電子繳費媒介及至少一種非二維碼電子繳費媒介繳付車費。",
    hot: true,
  },
  {
    id: "cross-harbour-refusal",
    title: "過海的士站候客司機",
    desc: "在過海的士站候客之司機，可拒絕接載非經由海底隧道、東隧或西隧而到達目的地之乘客。",
  },
  {
    id: "cargo-limits",
    title: "運載貨物限制",
    desc: "的士不得運載個人手提行李以外的貨物；不得接載危險或厭惡性質、或未經牢固包裝之貨物。",
  },
  {
    id: "receipt-format",
    title: "車費收據格式",
    desc: "收據須符合署長指明格式（附錄甲），列明車號、上落車時間、總公里、收費公里及分鐘、附加費、總車費；若打印設備故障，須以附錄乙樣本手寫。",
  },
  {
    id: "belt-refusal",
    title: "乘客不繫安全帶",
    desc: "乘客如拒絕或沒有佩帶安全帶，司機可拒絕租賃或駕駛；乘客須下車並支付咪錶已錄之法定車資。",
  },
  {
    id: "fleet-custom-fare",
    title: "車隊的士自訂車費",
    desc: "車隊持牌人可就預約行程自訂車費（咪錶車費外加預約費，或行程前協定整筆車費）；街頭截乘仍須按法定收費表。",
  },
];

// ── 與收費相關之違例（附錄己・記分制） ────────────────────────
// 十分級罪行之一 = 濫收車費。詳細罰則請參考 regulations 章節。
export type FareOffence = {
  id: string;
  label: string;
  points: 3 | 5 | 10;
  hot?: boolean;
};

export const fareOffences: FareOffence[] = [
  { id: "overcharge", label: "濫收車費", points: 10, hot: true },
  { id: "refuse-hire", label: "故意拒絕或忽略接受租用", points: 10, hot: true },
  { id: "refuse-destination", label: "拒絕或忽略駕駛的士至租用人指示的地方", points: 10, hot: true },
  { id: "tamper-meter", label: "毀損、損壞或更改的士計程錶", points: 10, hot: true },
  { id: "tout", label: "兜客", points: 5 },
  { id: "detour", label: "沒有採用最直接而切實可行的路綫駛往目的地（兜路）", points: 5 },
  { id: "share-without-consent", label: "未經租用人同意容許他人登上的士（釣泥鯭）", points: 5 },
  { id: "mislead-fare", label: "欺騙或拒絕知會乘客適當的收費及路綫", points: 5 },
  { id: "refuse-passenger-count", label: "拒絕或忽略運載租用人要求數目的乘客", points: 5 },
  { id: "no-receipt", label: "拒絕或忽略發出收據", points: 3 },
  { id: "meter-not-recording", label: "沒有將的士計程錶設定於記錄位置", points: 3 },
];

// ── 下列 legacy 匯出供 fares.astro 舊版表格使用，保留以維持相容 ──
export const extraFees = [
  { item: "每件行李（車廂內輕便除外）", urban: "$6", nt: "$6", lantau: "$6" },
  { item: "每隻動物／雀鳥", urban: "$5", nt: "$5", lantau: "$5" },
  { item: "每程電召預約", urban: "$5", nt: "$5", lantau: "$5" },
  { item: "殘疾乘客輪椅／拐杖", urban: "免費", nt: "免費", lantau: "免費" },
];

export const tunnels = [
  { name: "紅隧 / 東隧 / 西隧", fee: "$25 (隧道費) + $25 (回程費)" },
  { name: "大欖隧道", fee: "司機所付的隧道費" },
  { name: "其他收費隧道／道路／區", fee: "按使用費" },
];

export const tunnelExceptions = [
  "在過海的士站上車 → 免回程費",
  "最終目的地非位於海港另一方 → 免回程費",
];
