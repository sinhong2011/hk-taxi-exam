// Single source of truth for mock-exam topic taxonomy.
// Used by partABank / roadCodeBank / Mock.tsx result screen grouping.
export type Topic =
  | "regs"      // 則例 (meter, receipts, fares-as-rules, etc.)
  | "fleet"     // 車隊制度 (new post-Nov 2025 content)
  | "demerit"   // 記分制度
  | "fares"     // 收費數字
  | "places"    // 地方
  | "routes"    // 路線
  | "roadcode"; // 道路使用者守則 (all Part B)

export const topicLabels: Record<Topic, string> = {
  regs: "則例",
  fleet: "車隊",
  demerit: "記分",
  fares: "收費",
  places: "地方",
  routes: "路線",
  roadcode: "道路守則",
};

export const topicToRoute: Record<Topic, string> = {
  regs: "/regulations",
  fleet: "/regulations#fleet",
  demerit: "/regulations#demerit",
  fares: "/fares",
  places: "/places",
  routes: "/routes",
  roadcode: "/roadcode",
};
