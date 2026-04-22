// 粵語周星馳-style comments based on mock-exam result.
// Tone: affectionate-mean sifu. Wants you to pass but won't pretend you didn't fumble.
// Must be Traditional Chinese (繁體), Cantonese register (粵語), Stephen-Chow-film voice.

export type VerdictInput = {
  partA: { correct: number; total: number };
  partB: { correct: number; total: number };
  partAThreshold: number;
  partBThreshold: number;
  /** Fraction of questions left blank across both parts (0..1). Used to detect DNF. */
  skippedRatio?: number;
  /** Total elapsed seconds across both parts. Enables speedster easter eggs. */
  durationSec?: number;
  /** Sum of Part A + Part B time budgets in seconds. Default 75*60. */
  maxDurationSec?: number;
  /** Number of previous mock attempts. Enables retake-count easter egg. */
  retakeCount?: number;
};

export type VerdictBand =
  | "perfect"
  | "solid-pass"
  | "bare-pass"
  | "close-fail"
  | "imbalanced-a-pass"
  | "imbalanced-b-pass"
  | "mid-fail"
  | "bomb"
  | "dnf"
  // Easter-egg bands (rarer — override score-based bands)
  | "speedster-perfect"
  | "speedster-bomb"
  | "thresholds-exact"
  | "perfect-a-zero-b"
  | "perfect-b-zero-a"
  | "rounded-zero"
  | "retake-count-3-plus";

export type VerdictTone =
  | "hype"
  | "solid"
  | "close-fail"
  | "mid-fail"
  | "bomb"
  | "imbalanced";

export type VerdictComment = {
  band: VerdictBand;
  title: string;
  body: string;
  tone: VerdictTone;
};

type CommentVariant = { title: string; body: string };

type BandDef = {
  tone: VerdictTone;
  variants: CommentVariant[];
};

// ---------------------------------------------------------------------------
// Band → variants map
// ---------------------------------------------------------------------------

const BAND_DEFS: Record<VerdictBand, BandDef> = {
  perfect: {
    tone: "hype",
    variants: [
      {
        title: "唔好咁勁呀大佬",
        body:
          "喂喂喂，唔好咁勁呀大佬，的士 sifu 都要向你脫帽啦。不過識字唔等於識揸車，返街睇路啦。",
      },
      {
        title: "你考乜嘢牌呀",
        body: "滿分喎！你考乜嘢牌呀，去做考官啦係咁。",
      },
      {
        title: "唔係早就揸緊的士嘛",
        body: "嘩⋯⋯你唔係早就揸緊的士嘛？呢張牌唯有係一個形式。",
      },
      {
        title: "全卷冇錯一題",
        body:
          "全卷冇錯一題，我由細到大都未見過。你係咪將本則例當武俠小說咁背？等等⋯⋯你係咪真係背咗武俠小說？",
      },
      {
        title: "試題係你寫嘅",
        body:
          "滿分呢家嘢，唔係靠運氣。我懷疑呢張試題係你寫嘅，你依家係嚟交貨嘅。我唔係針對你，我係話⋯⋯你畀吓面啦。",
      },
    ],
  },
  "solid-pass": {
    tone: "solid",
    variants: [
      {
        title: "考牌過得嘅",
        body: "OK 嘅，考牌過得嘅。不過呢，街坊都係少啲搭你嘅車好。",
      },
      {
        title: "叉到㗎",
        body: "叉到㗎，不過唔好諗住下次仲咁好彩。記住今日份卷，夠皮。",
      },
      {
        title: "及格有餘",
        body:
          "及格有餘，但唔係滿分㗎。返去再溫一陣，等考官見到你張笑臉唔駛皺眉。",
      },
      {
        title: "有樣睇喎",
        body:
          "呢個分數有樣睇喎，唔似亂揀嘅。你可能真係識啲嘢⋯⋯可能啫，我冇話一定。",
      },
      {
        title: "企得穩",
        body:
          "兩邊都過咗線，企得穩穩陣陣。考官見到你個份卷，會講一句『呢個後生仔做得嘢』——然後繼續嘆佢嘅茶。",
      },
    ],
  },
  "bare-pass": {
    tone: "solid",
    variants: [
      {
        title: "夠秤嘅啫",
        body: "夠秤嘅啫，睇嚟你係靠彩嘅多。張牌收好，唔好畀人搶走。",
      },
      {
        title: "考官都搲晒頭",
        body: "過咗線就過咗線，考官都搲晒頭。聽日返嚟再考一次啦。",
      },
      {
        title: "幾驚險吖",
        body: "幾驚險吖，差啲就肥佬。繼續揸吓先啦。",
      },
      {
        title: "踩住條線",
        body:
          "你踩住條及格線上過咗海，對面岸嘅人都睇到你隻腳震。過就過咗，唔好話畀阿媽知就得。",
      },
      {
        title: "半桶水畢業",
        body:
          "半桶水畢業，畀我食煙時間諗吓點樣讚你⋯⋯算啦，你自己拎張牌走先啦。",
      },
    ],
  },
  "close-fail": {
    tone: "close-fail",
    variants: [
      {
        title: "差少少嗟",
        body:
          "差少少嗟，搞咩嘢啊⋯⋯你屋企個的士模型都考得過你啦。返去溫書，食碗飯先。",
      },
      {
        title: "一分之差",
        body: "一分之差，心口痛唔痛啊？再嚟一次啦，唔好喊。",
      },
      {
        title: "你個 GPS 都比你識路",
        body: "咁近？你個 GPS 都比你識路。返去執下個幾條錯題就得嘅。",
      },
      {
        title: "輸咗條毛",
        body:
          "輸咗條毛啫，成個宇宙都覺得可惜。呢幾分係你自己掟落街嘅，返去執返嚟就得。",
      },
      {
        title: "險過剃頭",
        body:
          "險過剃頭，剃完仲流血。下次考前唔好食太飽，留啲胃口畀張卷。",
      },
    ],
  },
  "imbalanced-a-pass": {
    tone: "imbalanced",
    variants: [
      {
        title: "知道點揸車，但唔知揸緊乜",
        body:
          "的士則例識得晒，道路守則零雞蛋。呢啲叫做『知道點揸車，但唔知自己揸緊乜』。",
      },
      {
        title: "後座乘客呢？",
        body: "掟錢入計程錶叻到飛起，但未學識點避車。後座嘅乘客呢？",
      },
      {
        title: "老闆識做，司機唔識",
        body:
          "的士則例滿分，道路守則就交白卷。老闆識做，司機就唔識。呢個世界真係荒謬。",
      },
      {
        title: "計錢一流揸車三流",
        body:
          "計錢一流，揸車三流。你呢個 combo 好危險㗎，返去先學識點揸，然後再諗點收錢。",
      },
    ],
  },
  "imbalanced-b-pass": {
    tone: "imbalanced",
    variants: [
      {
        title: "身份證仲係揸普通車",
        body:
          "揸車係識，但係做的士嘅規矩你一啲都唔識。考牌唔係考車，係考你做老闆。",
      },
      {
        title: "司機嘅 form OK，但⋯",
        body:
          "道路守則滿分，的士則例零分。司機嘅 form OK，但身份證仲係揸普通車。",
      },
      {
        title: "揸得但做唔到",
        body:
          "你揸車冇問題，但係則例呢味嘢⋯⋯你當佢透明？做的士唔係淨係會踩油㗎，返去畀本則例你看睇三日三夜。",
      },
      {
        title: "差一張牌就係的士佬",
        body:
          "差一張牌你就係的士佬喇，可惜差嗰張正正係依家呢張。道路你識哂，但的士嘅世界你未入到門口。",
      },
    ],
  },
  "mid-fail": {
    tone: "mid-fail",
    variants: [
      {
        title: "唔好嚟博",
        body: "都唔係唔識，但做的士係要清楚晒先㗎。再溫一個禮拜，唔好嚟博。",
      },
      {
        title: "入錯房間啦大佬",
        body: "成績唔見咗一半，你係咪考緊普通車牌呀？入錯房間啦大佬。",
      },
      {
        title: "唔好糟蹋 $$$",
        body: "返去溫多兩次先啦，唔好糟蹋 $$$。依家交張表都未夠皮。",
      },
      {
        title: "半識半唔識",
        body:
          "半識半唔識，呢種最累死人。你唔係完全唔識，你係唔夠認真。返去坐定定，唔好邊溫書邊睇手機。",
      },
      {
        title: "呢個分數好尷尬",
        body:
          "呢個分數好尷尬，連考官都唔知點嘆你——讚又唔係，罵又浪費口水。自己執生啦。",
      },
    ],
  },
  bomb: {
    tone: "bomb",
    variants: [
      {
        title: "做乜嘢揸車呀你？",
        body:
          "做乜嘢揸車呀你？等陣連乘客都要幫你搵返屋企嘅路。成個地圖打印出嚟貼廁所先啦。",
      },
      {
        title: "返去從頭睇起",
        body:
          "成張試題似咪你朋友畀你亂估？返去從頭睇起 15 章則例，唔好偷懶。",
      },
      {
        title: "我都唔忍心笑你",
        body: "我都唔忍心笑你⋯⋯真係唔忍心笑你⋯⋯唔係，我笑緊你㗎。",
      },
      {
        title: "成個地球震驚",
        body:
          "呢個分數，成個地球震驚。我同你講，你返屋企開電視追劇都好過嚟考牌，好唔好？",
      },
      {
        title: "唔係作弊，係作夢",
        body:
          "你冇作弊㗎——呢個分數連作弊都作得比你好。你係來作夢嘅。返去瞓醒先再嚟啦。",
      },
    ],
  },
  dnf: {
    tone: "bomb",
    variants: [
      {
        title: "跳題跳到飛起",
        body:
          "成張試卷一半空白，你係咪入嚟睇風景？下次坐定啲揸筆，唔好跳題跳到飛起。",
      },
      {
        title: "開考五分鐘就放棄",
        body:
          "咁多題未作答，你係咪開考五分鐘就放棄㗎？返去食碗麵先，有氣先再考過。",
      },
      {
        title: "張卷留白定係畫畫",
        body:
          "成張卷一大片空白，考官收到以為你送佢嘅水墨畫。你畀吓面啦，下次填滿佢先交。",
      },
      {
        title: "未答就走",
        body:
          "未答完就走，你當呢個係茶餐廳搭枱？咁都可以？返嚟坐好，由第一題開始。",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Easter-egg bands
  // ---------------------------------------------------------------------------

  "speedster-perfect": {
    tone: "hype",
    variants: [
      {
        title: "警局見",
        body:
          "喂，你係咪作弊啊？呢個時間仲要滿分？警局見。我唔係嚇你，我真係想知你點做到。",
      },
      {
        title: "張牌只係 formality",
        body:
          "你 probably 已經揸緊的士牌幾廿年，呢個 paper 只係 formality。今日真係打擾晒。",
      },
      {
        title: "試唔到你㗎",
        body: "快同準都識，我哋試唔到你㗎。考官叫你返屋企，因為試卷冇難度畀你。",
      },
      {
        title: "時間快到彈開",
        body:
          "分數滿，時間仲未食一半。你係咪偷咗試卷先答嘅？等等⋯⋯就算偷咗都要識答呀。即係你真係勁。",
      },
    ],
  },

  "speedster-bomb": {
    tone: "bomb",
    variants: [
      {
        title: "咁快交卷做乜",
        body:
          "咁快？畀錢你揸你都唔識揸啦。返去慢慢睇書先啦，字係要一個一個睇㗎。",
      },
      {
        title: "Usain Not Bolt",
        body:
          "15 分鐘就交卷？你係咪當自己係 Usain Bolt？成績就 Usain Not Bolt 啦。返去再坐耐啲。",
      },
      {
        title: "考卷當街市",
        body:
          "你當考卷係街市咩？買棵菜咁就走。呢張卷唔係畀你趕時間嘅，你坐都未坐暖張凳。",
      },
      {
        title: "賽車唔係賽題",
        body:
          "快唔代表準，賽車唔係賽題。你呢個速度加呢個分數，我都唔知應該讚你定係嗌你返屋企。",
      },
    ],
  },

  "thresholds-exact": {
    tone: "close-fail",
    variants: [
      {
        title: "踩界大師",
        body:
          "踩界大師！差一分都冇！你係咪早就計算好？我唔係讚你，我係懷疑你⋯⋯算啦，過咗就過咗。",
      },
      {
        title: "擦邊球冠軍",
        body:
          "34/30 擦邊球冠軍。唔知你係勁定係彩，總之你過咗就算。下次咪咁啦，我心臟受唔住。",
      },
      {
        title: "數學勁過答題",
        body:
          "兩邊都啱啱夠皮，你嘅數學勁過你嘅答題。走火警都冇咁準，走得慢一步都會燒咗條命。",
      },
      {
        title: "多一分都浪費",
        body:
          "多一分都浪費——呢個就係你嘅哲學？考試唔係做生意喎大佬，儲多啲分數唔使交稅㗎。",
      },
    ],
  },

  "perfect-a-zero-b": {
    tone: "imbalanced",
    variants: [
      {
        title: "則例教授",
        body:
          "你識哂成本的士則例，但係唔識點揸車？你去開咪錶當秘書都好過，唔使學揸車。",
      },
      {
        title: "一半嘅牌",
        body:
          "則例教授，道路守則幼稚園。你嘅牌係一半，另一半仲要搵回來——唔知嚟緊有冇貨。",
      },
      {
        title: "你識點收錢啫",
        body:
          "的士則例滿分代表你識點收錢，但係唔識點揸車去收。即係⋯⋯你想做收錢佬咋？",
      },
      {
        title: "讀書勁過揸車",
        body:
          "你肯定係讀書嗰類，唔係揸車嗰類。去做考車師傅嗰間駕駛學校嘅老闆啦，唔使自己揸。",
      },
    ],
  },

  "perfect-b-zero-a": {
    tone: "imbalanced",
    variants: [
      {
        title: "考錯張牌",
        body:
          "道路守則滿分，的士則例零雞蛋。喂，你係咪考錯張牌呀？去隔籬房考普通車牌仲實際。",
      },
      {
        title: "做老闆 zero",
        body:
          "你揸車一流，做老闆 zero。去搵個的士佬跟住學幾日先，睇下佢點同乘客傾計、點收錢。",
      },
      {
        title: "司機裝束十足",
        body:
          "道路守則咁熟，但的士嘅規矩完全唔知——你著上的士佬件衫走嚟考試？衫到分數未到。",
      },
      {
        title: "揸得快但做乜",
        body:
          "揸車技巧滿分，但你完全唔知做的士係做乜嘢。返去睇本則例兩個禮拜，然後再嚟見我。",
      },
    ],
  },

  "rounded-zero": {
    tone: "bomb",
    variants: [
      {
        title: "零",
        body:
          "零。呢個成績大家都唔敢相信，只有我先肯同你講：返屋企食飯啦。食多兩碗飯再諗吓人生。",
      },
      {
        title: "零係一個記號",
        body:
          "成績單上嘅零係一個記號。記號代表：你仲未開始。由第一頁揭起，唔好急。",
      },
      {
        title: "連估都冇估中",
        body:
          "四揀一，你都可以零分？連隨便亂填都應該食中幾條㗎。你係咪逐條揀錯嗰個？呢個都算係一種天賦。",
      },
      {
        title: "白紙一張",
        body:
          "白紙一張咁清白，我都唔敢用紅筆改。你確定呢張係考的士牌？唔係去幼稚園報名？",
      },
    ],
  },

  "retake-count-3-plus": {
    tone: "mid-fail",
    variants: [
      {
        title: "又嚟",
        body:
          "又嚟？已經第幾次肥佬喇。我同你講，返去逐章睇先，唔好再嚟浪費時間。",
      },
      {
        title: "熟面孔",
        body:
          "熟面孔喇喎！今次仲係肥佬。唔係我嘥你時間，係你嘥自己時間——坐定啲，執返本書。",
      },
      {
        title: "唔好再試",
        body:
          "試咗幾次都係咁，問題唔喺張卷度，問題喺溫書嘅方法度。返去搵個肯教你嘅朋友先。",
      },
      {
        title: "考官記得你",
        body:
          "考官已經記得你個樣，見到你就知今日會有好戲睇。唔好畀佢再有戲睇，聽日返去乖乖坐定睇書。",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Pure helper: map (partA, partB, thresholds, extras) → band
// ---------------------------------------------------------------------------

type BandExtras = {
  skippedRatio?: number;
  durationSec?: number;
  maxDurationSec?: number;
  retakeCount?: number;
};

export function getBandForScore(
  partA: { correct: number; total: number },
  partB: { correct: number; total: number },
  thresholds: { partA: number; partB: number },
  skippedRatioOrExtras: number | BandExtras = 0,
): VerdictBand {
  // Back-compat: callers may pass a bare skippedRatio number.
  const extras: BandExtras =
    typeof skippedRatioOrExtras === "number"
      ? { skippedRatio: skippedRatioOrExtras }
      : skippedRatioOrExtras;

  const skippedRatio = extras.skippedRatio ?? 0;
  const durationSec = extras.durationSec;
  const maxDurationSec = extras.maxDurationSec ?? 75 * 60;
  const retakeCount = extras.retakeCount ?? 0;

  // 1. DNF — heavy skip overrides everything
  if (skippedRatio >= 0.5) return "dnf";

  const total = partA.correct + partB.correct;
  const maxTotal = partA.total + partB.total;
  const aPass = partA.correct >= thresholds.partA;
  const bPass = partB.correct >= thresholds.partB;
  const isPerfect =
    partA.correct === partA.total && partB.correct === partB.total;
  const bombCutoff = (maxTotal * 40) / 75;
  const isBombScore = !aPass && !bPass && total < bombCutoff;

  // 2. Rounded zero — the absolute worst
  if (total === 0) return "rounded-zero";

  // 3. Perfect Part A, near-zero Part B
  if (partA.correct === partA.total && partB.correct <= 3) {
    return "perfect-a-zero-b";
  }

  // 4. Perfect Part B, near-zero Part A
  if (partB.correct === partB.total && partA.correct <= 3) {
    return "perfect-b-zero-a";
  }

  // 5. Speedster perfect — perfect AND very fast
  if (
    isPerfect &&
    typeof durationSec === "number" &&
    maxDurationSec > 0 &&
    durationSec / maxDurationSec < 0.45
  ) {
    return "speedster-perfect";
  }

  // 6. Speedster bomb — bombing AND very fast
  if (
    isBombScore &&
    typeof durationSec === "number" &&
    maxDurationSec > 0 &&
    durationSec / maxDurationSec < 0.3
  ) {
    return "speedster-bomb";
  }

  // 7. Exact-threshold — both parts land precisely on the pass line
  if (
    partA.correct === thresholds.partA &&
    partB.correct === thresholds.partB
  ) {
    return "thresholds-exact";
  }

  // 8. Perfect — both full marks
  if (isPerfect) return "perfect";

  // Solid / bare pass
  if (aPass && bPass) {
    const ratio = total / maxTotal;
    if (ratio >= 65 / 75) return "solid-pass";
    return "bare-pass";
  }

  // At least one side fails
  const aGap = thresholds.partA - partA.correct;
  const bGap = thresholds.partB - partB.correct;

  // Retake-stern: 3+ prior attempts AND still failing → override mid-fail/bomb
  if (retakeCount >= 3 && (!aPass || !bPass)) {
    // Only override the softer/harsher score bands, not imbalanced/close-fail
    // which have their own narrative. Kick in for mid-fail-range only.
    const maxGap = Math.max(aPass ? 0 : aGap, bPass ? 0 : bGap);
    const isCloseFail = maxGap >= 1 && maxGap <= 3;
    const isImbalanced =
      (aPass && !bPass && bGap >= 5) || (!aPass && bPass && aGap >= 5);
    if (!isCloseFail && !isImbalanced) {
      return "retake-count-3-plus";
    }
  }

  // imbalanced
  if (aPass && !bPass && bGap >= 5) return "imbalanced-a-pass";
  if (!aPass && bPass && aGap >= 5) return "imbalanced-b-pass";

  // close-fail
  const maxGap = Math.max(aPass ? 0 : aGap, bPass ? 0 : bGap);
  if (maxGap >= 1 && maxGap <= 3) return "close-fail";

  // bomb
  if (isBombScore) return "bomb";

  // mid-fail catchall
  return "mid-fail";
}

// ---------------------------------------------------------------------------
// Public: pick a verdict comment (random variant per call)
// ---------------------------------------------------------------------------

function pickVariant(band: VerdictBand): CommentVariant {
  const def = BAND_DEFS[band];
  const idx = Math.floor(Math.random() * def.variants.length);
  return def.variants[idx];
}

export function getVerdictComment(input: VerdictInput): VerdictComment {
  const band = getBandForScore(
    input.partA,
    input.partB,
    { partA: input.partAThreshold, partB: input.partBThreshold },
    {
      skippedRatio: input.skippedRatio ?? 0,
      durationSec: input.durationSec,
      maxDurationSec: input.maxDurationSec,
      retakeCount: input.retakeCount,
    },
  );
  const def = BAND_DEFS[band];
  const variant = pickVariant(band);
  return {
    band,
    tone: def.tone,
    title: variant.title,
    body: variant.body,
  };
}
