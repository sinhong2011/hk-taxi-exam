export type SignShape =
  | "red-circle"
  | "red-circle-bar"
  | "red-triangle"
  | "blue-circle"
  | "blue-square"
  | "octagon"
  | "inverted-triangle"
  | "yellow-diamond";

export type Sign = {
  id: string;
  category: "禁制" | "警告" | "指令" | "指示" | "特殊";
  shape: SignShape;
  label: string;
  glyph?: string;
  description: string;
};

export const signs: Sign[] = [
  { id: "stop", category: "特殊", shape: "octagon", label: "停車", glyph: "STOP", description: "必須在路口白線前完全停定，觀察後才通過。" },
  { id: "yield", category: "特殊", shape: "inverted-triangle", label: "讓車", glyph: "讓", description: "讓主幹道車輛先行，必要時停車。" },

  { id: "no-entry", category: "禁制", shape: "red-circle-bar", label: "禁止進入", glyph: "⊘", description: "車輛不得進入標誌之後的一段路。" },
  { id: "no-left", category: "禁制", shape: "red-circle-bar", label: "不准左轉", glyph: "↰", description: "前面路口不准左轉。" },
  { id: "no-right", category: "禁制", shape: "red-circle-bar", label: "不准右轉", glyph: "↱", description: "前面路口不准右轉。" },
  { id: "no-uturn", category: "禁制", shape: "red-circle-bar", label: "不准掉頭", glyph: "↺", description: "前面一段路不准掉頭。" },
  { id: "no-overtake", category: "禁制", shape: "red-circle-bar", label: "禁止超車", glyph: "⇔", description: "由標誌起至解除標誌止之路段不得超車。" },
  { id: "no-stop", category: "禁制", shape: "red-circle", label: "不准停車", glyph: "✕", description: "該處任何時間不准停車。" },
  { id: "speed-limit", category: "禁制", shape: "red-circle", label: "速度限制", glyph: "50", description: "車速不得超過標誌所示 km/h。" },
  { id: "weight-limit", category: "禁制", shape: "red-circle", label: "重量限制", glyph: "5t", description: "總重量超過標示者不得駛入。" },
  { id: "height-limit", category: "禁制", shape: "red-circle", label: "高度限制", glyph: "4.5m", description: "高度超過標示者不得通過。" },

  { id: "warn-crossroad", category: "警告", shape: "red-triangle", label: "交叉路口", glyph: "✚", description: "前面有交叉路口，注意讓車。" },
  { id: "warn-ped", category: "警告", shape: "red-triangle", label: "行人過路處", glyph: "🚶", description: "前方有行人過路處，減速注意。" },
  { id: "warn-child", category: "警告", shape: "red-triangle", label: "前有學童", glyph: "🎒", description: "前面有學校或學童出入之路段。" },
  { id: "warn-bend", category: "警告", shape: "red-triangle", label: "彎路", glyph: "⤻", description: "前面有彎路，減速小心。" },
  { id: "warn-slope", category: "警告", shape: "red-triangle", label: "斜坡", glyph: "⬈", description: "前面有陡斜路段。" },
  { id: "warn-slippery", category: "警告", shape: "red-triangle", label: "路滑", glyph: "≋", description: "路面可能濕滑，加大距離。" },
  { id: "warn-narrow", category: "警告", shape: "red-triangle", label: "路面收窄", glyph: "><", description: "前方車道收窄，注意讓車。" },
  { id: "warn-tram", category: "警告", shape: "red-triangle", label: "電車站", glyph: "◼", description: "前方為電車站／電車軌，留意行人。" },

  { id: "must-straight", category: "指令", shape: "blue-circle", label: "只准直行", glyph: "↑", description: "只可按箭頭方向行駛。" },
  { id: "must-left", category: "指令", shape: "blue-circle", label: "只准左轉", glyph: "←", description: "必須左轉。" },
  { id: "must-right", category: "指令", shape: "blue-circle", label: "只准右轉", glyph: "→", description: "必須右轉。" },
  { id: "roundabout", category: "指令", shape: "blue-circle", label: "迴旋處", glyph: "↻", description: "按迴旋處行駛方向繞行，讓右方車先行。" },
  { id: "min-speed", category: "指令", shape: "blue-circle", label: "最低速度", glyph: "30", description: "車速不得低於標示 km/h。" },
  { id: "bus-lane", category: "指令", shape: "blue-circle", label: "巴士線", glyph: "B", description: "此車道供巴士使用，按時段限制。" },

  { id: "hospital", category: "指示", shape: "blue-square", label: "醫院", glyph: "H", description: "前方有醫院，保持肅靜。" },
  { id: "parking", category: "指示", shape: "blue-square", label: "泊車位", glyph: "P", description: "可泊車位置。" },
  { id: "oneway", category: "指示", shape: "blue-square", label: "單程路", glyph: "→", description: "單向行車路段。" },
  { id: "expressway", category: "指示", shape: "blue-square", label: "快速公路起", glyph: "⇞", description: "進入快速公路，須遵快速公路規則。" },
  { id: "tunnel", category: "指示", shape: "blue-square", label: "隧道", glyph: "⊓", description: "前方有隧道，開頭燈、除太陽眼鏡。" },
];

export const signCategories = ["全部", "禁制", "警告", "指令", "指示", "特殊"] as const;
