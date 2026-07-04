import React, { useState, useRef } from "react";

/* ---------------- 数据配置 ---------------- */

const SYSTEMS = [
  { id: "liuren", name: "小六壬", sub: "掐指速断", glyph: "六" },
  { id: "bazi", name: "八字", sub: "命理推演", glyph: "命" },
  { id: "qimen", name: "奇门遁甲", sub: "时空布局", glyph: "奇" },
  { id: "meihua", name: "梅花易数", sub: "数理起卦", glyph: "梅" },
  { id: "liuyao", name: "六爻", sub: "摇钱成卦", glyph: "爻" },
  { id: "tarot", name: "塔罗", sub: "抽牌问心", glyph: "塔" },
];

// 各体系简介（选中时展示，帮助用户理解其源流与所长）
const SYSTEM_INTRO = {
  liuren:
    "小六壬相传为诸葛武侯所传，以「大安、留连、速喜、赤口、小吉、空亡」六神循环，用农历月、日、时辰三步掐指定局。长于对眼前小事、失物、行人、约见等即时之问速断吉凶。",
  bazi:
    "八字（四柱）以出生的年、月、日、时排出天干地支八字，以日干为「我」，观五行旺衰、十神格局与大运流年。重在推演一生格局与阶段趋势，宜问性情、事业、婚姻等长线之事。",
  qimen:
    "奇门遁甲被誉为「帝王之学」，融天、地、人、神四盘于九宫，以三奇六仪、八门九星布局，依节气定阴阳遁与局数。长于择时、谋事、方位与格局的时空推演。",
  meihua:
    "梅花易数传为北宋邵雍所创，可由数字或时间起卦，分「体、用」两卦观其生克比和，卦成即断、不拘器物。尤重心易与随机应感，宜问事之成败趋向。",
  liuyao:
    "六爻纳甲以三枚铜钱摇六次成卦，配纳干支、六亲、六神、世应，据动爻与用神旺衰断吉凶。体系严密、几乎可问诸事，为民间应用最广的占法之一。",
  tarot:
    "塔罗以二十二张大阿尔卡纳为核心，每张牌象征一段人生原型与心理历程，正逆位各有其义。它更像一面映照当下心境的镜子，宜问处境、抉择与内在动因。",
};

const MAJOR_ARCANA = [
  "愚者", "魔术师", "女祭司", "皇后", "皇帝", "教皇", "恋人", "战车",
  "力量", "隐士", "命运之轮", "正义", "倒吊人", "死神", "节制",
  "恶魔", "高塔", "星星", "月亮", "太阳", "审判", "世界",
];

// 大阿尔卡纳正/逆位关键词，供解读时参照
const TAROT_MEANINGS = {
  愚者: { up: "新的开始、冒险、纯真、自由", rev: "鲁莽、盲目、犹豫不前" },
  魔术师: { up: "创造、行动力、资源整合、自信", rev: "欺瞒、才能未展、意志薄弱" },
  女祭司: { up: "直觉、潜意识、静观、秘密", rev: "压抑、疏离、表里不一" },
  皇后: { up: "丰饶、母性、感性、滋养", rev: "依赖、过度保护、创造受阻" },
  皇帝: { up: "权威、秩序、责任、掌控", rev: "专断、僵化、失控" },
  教皇: { up: "传统、信仰、指引、规范", rev: "教条、叛逆、形式主义" },
  恋人: { up: "结合、抉择、爱与和谐", rev: "失衡、诱惑、错误的选择" },
  战车: { up: "意志、进取、胜利、掌控方向", rev: "失控、冲动、方向不明" },
  力量: { up: "内在力量、勇气、耐心、以柔克刚", rev: "自我怀疑、暴躁、软弱" },
  隐士: { up: "内省、独处、寻求真理、指引", rev: "孤僻、逃避、固执" },
  命运之轮: { up: "转机、循环、机遇、顺势而为", rev: "逆转、失控、时运不济" },
  正义: { up: "公正、平衡、因果、担当", rev: "偏颇、失衡、推诿" },
  倒吊人: { up: "牺牲、换位思考、静待、放下", rev: "徒劳、执迷、拖延" },
  死神: { up: "结束与重生、转变、放下", rev: "抗拒改变、停滞、纠缠" },
  节制: { up: "调和、节制、耐心、中道", rev: "失衡、极端、内耗" },
  恶魔: { up: "欲望、束缚、执念、诱惑", rev: "解脱、觉醒、挣脱枷锁" },
  高塔: { up: "突变、崩解、觉醒、旧格局瓦解", rev: "拖延的崩溃、勉强维持" },
  星星: { up: "希望、疗愈、灵感、信心", rev: "失望、迷惘、信心不足" },
  月亮: { up: "潜意识、幻象、不安、直觉", rev: "迷雾渐散、释放恐惧" },
  太阳: { up: "成功、喜悦、活力、光明", rev: "短暂受挫、过度乐观" },
  审判: { up: "觉醒、召唤、清算、重生", rev: "自责、犹疑、逃避审视" },
  世界: { up: "圆满、达成、整合、周期完成", rev: "未竟、拖延、功亏一篑" },
};

const TAROT_SPREADS = {
  1: { label: "单张 · 直取核心", positions: ["核心指引"] },
  3: { label: "三张 · 过去·现在·未来", positions: ["过去/成因", "现在/处境", "未来/趋向"] },
};

// 「编年历」编辑排版设计系统 token（源自 MYSAO .dc.html 简报风格）
const T = {
  canvas: "#EAE2D3",
  card: "#FFFCF7",
  card2: "#FCFAF6",
  card3: "#FAF7F1",
  coffee: "#241C12",
  coffeeDeep: "#15110B",
  ink: "#241C12",
  ink2: "#3A352E",
  ink3: "#43403A",
  inkSub: "#6B5440",
  monoLabel: "#A08B6B",
  gold: "#B8924A",
  goldTxt: "#8A6D38",
  goldLt: "#D8B878",
  goldLt2: "#C9A35E",
  goldBg: "#FBF3E2",
  jade: "#2E7D55",
  jadeBg: "#EAF3EC",
  jadeBd: "#CDE5D5",
  verm: "#B0463A",
  vermBg: "#FBEAE7",
  line: "#EFE7D8",
  line2: "#EAE2D3",
  cream: "#F3ECE0",
  creamDim: "#CDBFA6",
};

/* ---------------- 干支基础算法（确定性计算，不依赖AI） ---------------- */

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const JIEQI_BOUNDS = [
  { m: 2, d: 4 },
  { m: 3, d: 6 },
  { m: 4, d: 5 },
  { m: 5, d: 6 },
  { m: 6, d: 6 },
  { m: 7, d: 7 },
  { m: 8, d: 8 },
  { m: 9, d: 8 },
  { m: 10, d: 8 },
  { m: 11, d: 7 },
  { m: 12, d: 7 },
  { m: 1, d: 6 },
];

function mod(n, m) {
  return ((n % m) + m) % m;
}

function getDayGanZhi(date) {
  const ref = Date.UTC(1900, 0, 31, 12);
  const cur = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const dayOffset = Math.round((cur - ref) / 86400000);
  const stemIdx = mod(dayOffset, 10);
  const branchIdx = mod(dayOffset + 4, 12);
  return { stemIdx, branchIdx, text: STEMS[stemIdx] + BRANCHES[branchIdx] };
}

function getHourGanZhi(dayStemIdx, hour) {
  const branchIdx = mod(Math.floor((hour + 1) / 2), 12);
  const startStemIdx = mod(mod(dayStemIdx, 5) * 2, 10);
  const stemIdx = mod(startStemIdx + branchIdx, 10);
  return { stemIdx, branchIdx, text: STEMS[stemIdx] + BRANCHES[branchIdx] };
}

function getSolarMonthIndex(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const bounds = JIEQI_BOUNDS.map((b, i) => {
    const year = i === 11 ? y + 1 : y;
    return { idx: i, ts: Date.UTC(year, b.m - 1, b.d) };
  });
  const cur = Date.UTC(y, m - 1, d);
  const prevChou = Date.UTC(y, 0, JIEQI_BOUNDS[11].d);
  let monthIdx;
  if (cur < prevChou) {
    monthIdx = 10;
  } else if (cur < bounds[0].ts) {
    monthIdx = 11;
  } else {
    monthIdx = 0;
    for (let i = bounds.length - 1; i >= 0; i--) {
      if (cur >= bounds[i].ts) {
        monthIdx = i;
        break;
      }
    }
  }
  return monthIdx;
}

function computeBazi(date) {
  const monthIdx = getSolarMonthIndex(date);
  const lichun = new Date(date.getFullYear(), JIEQI_BOUNDS[0].m - 1, JIEQI_BOUNDS[0].d);
  let baziYear = date.getFullYear();
  if (date < lichun) baziYear -= 1;

  const yearStemIdx = mod(baziYear - 4, 10);
  const yearBranchIdx = mod(baziYear - 4, 12);
  const yearGZ = STEMS[yearStemIdx] + BRANCHES[yearBranchIdx];

  const monthStartStem = [2, 4, 6, 8, 0][mod(yearStemIdx, 5)];
  const monthStemIdx = mod(monthStartStem + monthIdx, 10);
  const monthBranchIdx = mod(monthIdx + 2, 12);
  const monthGZ = STEMS[monthStemIdx] + BRANCHES[monthBranchIdx];

  const day = getDayGanZhi(date);
  const hour = getHourGanZhi(day.stemIdx, date.getHours());

  return {
    year: yearGZ,
    month: monthGZ,
    day: day.text,
    hour: hour.text,
    dayStemIdx: day.stemIdx,
    yearBranchIdx,
  };
}

// ---------------- 奇门遁甲：局数精确计算 ----------------
// 依据用户提供的《阴阳遁局数对照表》：24节气分上元/中元/下元，各自固定局数
const JIEQI_24 = [
  { name: "小寒", m: 1, d: 6 },
  { name: "大寒", m: 1, d: 20 },
  { name: "立春", m: 2, d: 4 },
  { name: "雨水", m: 2, d: 19 },
  { name: "惊蛰", m: 3, d: 6 },
  { name: "春分", m: 3, d: 21 },
  { name: "清明", m: 4, d: 5 },
  { name: "谷雨", m: 4, d: 20 },
  { name: "立夏", m: 5, d: 6 },
  { name: "小满", m: 5, d: 21 },
  { name: "芒种", m: 6, d: 6 },
  { name: "夏至", m: 6, d: 21 },
  { name: "小暑", m: 7, d: 7 },
  { name: "大暑", m: 7, d: 23 },
  { name: "立秋", m: 8, d: 8 },
  { name: "处暑", m: 8, d: 23 },
  { name: "白露", m: 9, d: 8 },
  { name: "秋分", m: 9, d: 23 },
  { name: "寒露", m: 10, d: 8 },
  { name: "霜降", m: 10, d: 23 },
  { name: "立冬", m: 11, d: 7 },
  { name: "小雪", m: 11, d: 22 },
  { name: "大雪", m: 12, d: 7 },
  { name: "冬至", m: 12, d: 22 },
];

// [上元局, 中元局, 下元局]
const JU_TABLE = {
  冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6], 立春: [8, 5, 2],
  雨水: [9, 6, 3], 惊蛰: [1, 7, 4], 春分: [3, 9, 6], 清明: [4, 1, 7],
  谷雨: [5, 2, 8], 立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9],
  夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4], 立秋: [2, 5, 8],
  处暑: [1, 4, 7], 白露: [9, 3, 6], 秋分: [7, 1, 4], 寒露: [6, 9, 3],
  霜降: [5, 8, 2], 立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1],
};

const YANG_TERMS = new Set([
  "冬至", "小寒", "大寒", "立春", "雨水", "惊蛰",
  "春分", "清明", "谷雨", "立夏", "小满", "芒种",
]);

// 奇门遁甲解读所依据的典籍体系
const QIMEN_CLASSICS = ["《奇门遁甲统宗大全》", "《遁甲演义》（明·程道生）", "《御定奇门宝鉴》", "《开门之悟》（张志春）"];
const FOUNDATION_CLASSICS = ["《五行大义》", "《天干地支》", "《周易本义》", "《阴阳五行解密》"];

// 判断日期落在24节气中的哪一段（返回该段起始节气名）
function getJieqiPeriod(date) {
  const y = date.getFullYear();
  const points = JIEQI_24.map((t) => ({ name: t.name, ts: Date.UTC(y, t.m - 1, t.d) }));
  const prevDongzhi = { name: "冬至", ts: Date.UTC(y - 1, 11, 22) };
  const nextXiaohan = { name: "小寒", ts: Date.UTC(y + 1, 0, 6) };
  const all = [prevDongzhi, ...points, nextXiaohan];
  const cur = Date.UTC(y, date.getMonth(), date.getDate());
  let period = prevDongzhi.name;
  for (let i = all.length - 1; i >= 0; i--) {
    if (cur >= all[i].ts) {
      period = all[i].name;
      break;
    }
  }
  return period;
}

// 符头定元：干支为甲(stem0)或己(stem5)的日子是"符头"，其地支决定上/中/下元
function getYuanIndex(date) {
  for (let back = 0; back < 10; back++) {
    const d = new Date(date);
    d.setDate(d.getDate() - back);
    const { stemIdx, branchIdx } = getDayGanZhi(d);
    if (stemIdx === 0 || stemIdx === 5) {
      const r = mod(branchIdx, 3);
      if (r === 0) return 0; // 上元（子卯午酉）
      if (r === 2) return 1; // 中元（寅巳申亥）
      return 2; // 下元（辰未戌丑）
    }
  }
  return 0;
}

function computeQimenJu(date) {
  const period = getJieqiPeriod(date);
  const dunType = YANG_TERMS.has(period) ? "阳遁" : "阴遁";
  const yuanIdx = getYuanIndex(date);
  const yuanName = ["上元", "中元", "下元"][yuanIdx];
  const ju = JU_TABLE[period][yuanIdx];
  return { period, dunType, yuanName, ju };
}

// ---------------- 奇门遁甲：排地盘 + 值符值使飞宫 ----------------
const PALACE_NAMES = { 1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中", 6: "乾", 7: "兑", 8: "艮", 9: "离" };
const DIPAN_STARS = { 1: "天蓬", 2: "天芮", 3: "天冲", 4: "天辅", 5: "天禽", 6: "天心", 7: "天柱", 8: "天任", 9: "天英" };
const DIPAN_DOORS = { 1: "休门", 2: "死门", 3: "伤门", 4: "杜门", 6: "开门", 7: "惊门", 8: "生门", 9: "景门" };
const SIX_YI_SAN_QI = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
const XUN_SHOU_TO_YI = { 子: "戊", 戌: "己", 申: "庚", 午: "辛", 辰: "壬", 寅: "癸" };

function wrapPalace(p) {
  return mod(p - 1, 9) + 1;
}

// 三奇六仪按局数布入九宫：戊落局数对应之宫，阳遁顺布(1→9)、阴遁逆布(9→1)
function layoutDiPan(dunType, ju) {
  const dir = dunType === "阳遁" ? 1 : -1;
  const stemToPalace = {};
  const palaceToStem = {};
  for (let i = 0; i < 9; i++) {
    const p = wrapPalace(ju + dir * i);
    const stem = SIX_YI_SAN_QI[i];
    stemToPalace[stem] = p;
    palaceToStem[p] = stem;
  }
  return { stemToPalace, palaceToStem };
}

// 精确算出当前时辰的干支、所在旬首、旬内第几格（stemIdx与之相同）
function getHourInfo(date) {
  const ref = Date.UTC(1900, 0, 31, 12);
  const cur = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const dayOffset = Math.round((cur - ref) / 86400000);
  const hourBranchIdx = mod(Math.floor((date.getHours() + 1) / 2), 12);
  const idx = mod(dayOffset * 12 + hourBranchIdx, 60);
  const stemIdx = mod(idx, 10);
  const branchIdx = mod(idx, 12);
  const xunShouIdx = idx - stemIdx; // 旬首在60循环中的索引，旬首天干必为甲
  const xunShouBranchIdx = mod(xunShouIdx, 12);
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    text: STEMS[stemIdx] + BRANCHES[branchIdx],
    xunShouBranch: BRANCHES[xunShouBranchIdx],
    stepsInXun: stemIdx, // 距旬首经过的格数，0-9
  };
}

function computeQimenFull(date) {
  const juInfo = computeQimenJu(date);
  const dir = juInfo.dunType === "阳遁" ? 1 : -1;
  const { stemToPalace } = layoutDiPan(juInfo.dunType, juInfo.ju);
  const hourInfo = getHourInfo(date);

  // 旬首对应六仪 -> 该仪在地盘的宫位，即值符星/值使门的基准宫
  const xunYi = XUN_SHOU_TO_YI[hourInfo.xunShouBranch];
  const baseGong = stemToPalace[xunYi];
  const zhiFuStar = DIPAN_STARS[baseGong];
  const zhiShiDoor = DIPAN_DOORS[baseGong] || DIPAN_DOORS[2]; // 中五宫寄坤二宫之门

  // 值符随时干飞宫：时干若为甲，用甲所隐的六仪(=旬首对应之仪)的宫位；否则直接查该时干在地盘的宫位
  const zhiFuGong = hourInfo.stem === "甲" ? baseGong : stemToPalace[hourInfo.stem];

  // 值使随时辰走门：从旬首所在宫起，按阳顺阴逆走 stepsInXun 格
  let zhiShiGong = baseGong;
  for (let s = 0; s < hourInfo.stepsInXun; s++) zhiShiGong = wrapPalace(zhiShiGong + dir);
  const zhiShiDisplayGong = zhiShiGong === 5 ? 2 : zhiShiGong; // 中五寄二

  return {
    ...juInfo,
    dir,
    diPan: stemToPalace,
    hourInfo,
    xunYi,
    baseGong,
    zhiFuStar,
    zhiFuGong,
    zhiShiDoor,
    zhiShiGong: zhiShiDisplayGong,
  };
}

const SIX_PALACES = ["大安", "留连", "速喜", "赤口", "小吉", "空亡"];

function computeXiaoLiuRen(lunarMonth, lunarDay, hour) {
  const hourNum = mod(Math.floor((hour + 1) / 2), 12) + 1;
  let idx = mod(lunarMonth - 1, 6);
  idx = mod(idx + (lunarDay - 1), 6);
  idx = mod(idx + (hourNum - 1), 6);
  return { palace: SIX_PALACES[idx], hourNum };
}

/* ---------------- 八卦 / 六十四卦 数据（供梅花、六爻确定性排卦） ---------------- */

// 三爻二进制（由下而上，bit0=初爻）→ 卦名
const TRIGRAM_BY_BITS = { 0: "坤", 1: "震", 2: "坎", 3: "兑", 4: "艮", 5: "离", 6: "巽", 7: "乾" };
// 先天八卦数 1-8 → 卦名（乾1兑2离3震4巽5坎6艮7坤8）
const TRIGRAM_BY_NUM = { 1: "乾", 2: "兑", 3: "离", 4: "震", 5: "巽", 6: "坎", 7: "艮", 8: "坤" };
// 卦名 → 三爻二进制（由下而上）
const TRIGRAM_BITS = { 乾: 7, 兑: 3, 离: 5, 震: 1, 巽: 6, 坎: 2, 艮: 4, 坤: 0 };
const TRIGRAM_INFO = {
  乾: { symbol: "☰", nature: "天", element: "金" },
  兑: { symbol: "☱", nature: "泽", element: "金" },
  离: { symbol: "☲", nature: "火", element: "火" },
  震: { symbol: "☳", nature: "雷", element: "木" },
  巽: { symbol: "☴", nature: "风", element: "木" },
  坎: { symbol: "☵", nature: "水", element: "水" },
  艮: { symbol: "☶", nature: "山", element: "土" },
  坤: { symbol: "☷", nature: "地", element: "土" },
};

// 六十四卦名：HEX_NAME[上卦][下卦]
const HEX_NAME = {
  乾: { 乾: "乾为天", 坤: "天地否", 坎: "天水讼", 艮: "天山遁", 震: "天雷无妄", 巽: "天风姤", 离: "天火同人", 兑: "天泽履" },
  坤: { 乾: "地天泰", 坤: "坤为地", 坎: "地水师", 艮: "地山谦", 震: "地雷复", 巽: "地风升", 离: "地火明夷", 兑: "地泽临" },
  坎: { 乾: "水天需", 坤: "水地比", 坎: "坎为水", 艮: "水山蹇", 震: "水雷屯", 巽: "水风井", 离: "水火既济", 兑: "水泽节" },
  艮: { 乾: "山天大畜", 坤: "山地剥", 坎: "山水蒙", 艮: "艮为山", 震: "山雷颐", 巽: "山风蛊", 离: "山火贲", 兑: "山泽损" },
  震: { 乾: "雷天大壮", 坤: "雷地豫", 坎: "雷水解", 艮: "雷山小过", 震: "震为雷", 巽: "雷风恒", 离: "雷火丰", 兑: "雷泽归妹" },
  巽: { 乾: "风天小畜", 坤: "风地观", 坎: "风水涣", 艮: "风山渐", 震: "风雷益", 巽: "巽为风", 离: "风火家人", 兑: "风泽中孚" },
  离: { 乾: "火天大有", 坤: "火地晋", 坎: "火水未济", 艮: "火山旅", 震: "火雷噬嗑", 巽: "火风鼎", 离: "离为火", 兑: "火泽睽" },
  兑: { 乾: "泽天夬", 坤: "泽地萃", 坎: "泽水困", 艮: "泽山咸", 震: "泽雷随", 巽: "泽风大过", 离: "泽火革", 兑: "兑为泽" },
};

// 六爻世爻位置（京房八宫，1=初爻…6=上爻），应爻 = 世±3
const WORLD_LINE = {
  乾为天: 6, 天风姤: 1, 天山遁: 2, 天地否: 3, 风地观: 4, 山地剥: 5, 火地晋: 4, 火天大有: 3,
  坎为水: 6, 水泽节: 1, 水雷屯: 2, 水火既济: 3, 泽火革: 4, 雷火丰: 5, 地火明夷: 4, 地水师: 3,
  艮为山: 6, 山火贲: 1, 山天大畜: 2, 山泽损: 3, 火泽睽: 4, 天泽履: 5, 风泽中孚: 4, 风山渐: 3,
  震为雷: 6, 雷地豫: 1, 雷水解: 2, 雷风恒: 3, 地风升: 4, 水风井: 5, 泽风大过: 4, 泽雷随: 3,
  巽为风: 6, 风天小畜: 1, 风火家人: 2, 风雷益: 3, 天雷无妄: 4, 火雷噬嗑: 5, 山雷颐: 4, 山风蛊: 3,
  离为火: 6, 火山旅: 1, 火风鼎: 2, 火水未济: 3, 山水蒙: 4, 风水涣: 5, 天水讼: 4, 天火同人: 3,
  坤为地: 6, 地雷复: 1, 地泽临: 2, 地天泰: 3, 雷天大壮: 4, 泽天夬: 5, 水天需: 4, 水地比: 3,
  兑为泽: 6, 泽水困: 1, 泽地萃: 2, 泽山咸: 3, 水山蹇: 4, 地山谦: 5, 雷山小过: 4, 雷泽归妹: 3,
};

// 六爻由下而上（长度6，0阴1阳）→ {name, 上卦, 下卦}
function hexFromLines(lines) {
  const lowerBits = lines[0] + lines[1] * 2 + lines[2] * 4;
  const upperBits = lines[3] + lines[4] * 2 + lines[5] * 4;
  const lower = TRIGRAM_BY_BITS[lowerBits];
  const upper = TRIGRAM_BY_BITS[upperBits];
  return { name: HEX_NAME[upper][lower], upper, lower };
}

function trigramLines(name) {
  const b = TRIGRAM_BITS[name];
  return [b & 1, (b >> 1) & 1, (b >> 2) & 1];
}

function shiYing(hexName) {
  const shi = WORLD_LINE[hexName];
  if (!shi) return null;
  const ying = shi <= 3 ? shi + 3 : shi - 3;
  return { shi, ying };
}

/* ---------------- 六爻起卦 ---------------- */

function tossLine() {
  let sum = 0;
  for (let i = 0; i < 3; i++) sum += Math.random() < 0.5 ? 3 : 2;
  const map = { 6: "老阴（变）", 7: "少阳", 8: "少阴", 9: "老阳（变）" };
  return { value: sum, label: map[sum] };
}

function castLiuYao() {
  const lines = [];
  for (let i = 0; i < 6; i++) lines.push(tossLine());
  return lines;
}

// 由摇卦六爻推出本卦、变卦、动爻、世应
function computeLiuYao(rawLines) {
  const orig = rawLines.map((l) => l.value % 2); // 7/9→阳(1)，6/8→阴(0)
  const movingPositions = rawLines
    .map((l, i) => (l.value === 6 || l.value === 9 ? i + 1 : null))
    .filter(Boolean);
  const changed = rawLines.map((l, i) =>
    l.value === 6 || l.value === 9 ? 1 - orig[i] : orig[i]
  );
  const ben = hexFromLines(orig);
  const bian = movingPositions.length ? hexFromLines(changed) : null;
  return { ben, bian, movingPositions, sy: shiYing(ben.name) };
}

/* ---------------- 梅花易数起卦 ---------------- */

function trigramFromNumber(n) {
  const r = mod(n, 8);
  return TRIGRAM_BY_NUM[r === 0 ? 8 : r];
}
function movingLineFromNumber(n) {
  const r = mod(n, 6);
  return r === 0 ? 6 : r;
}

// numbersStr 有两个及以上数字→数字起卦；否则以当前时间（阳历干支变体）起卦
function computeMeihua(numbersStr, now) {
  const nums = (numbersStr || "").split(/[^0-9]+/).filter(Boolean).map(Number);
  let upperName, lowerName, movePos, method;

  if (nums.length >= 2) {
    const a = nums[0];
    const b = nums[1];
    const sum = nums.reduce((s, x) => s + x, 0);
    upperName = trigramFromNumber(a);
    lowerName = trigramFromNumber(b);
    movePos = movingLineFromNumber(sum);
    method = `数字起卦：上卦取 ${a}（${upperName}），下卦取 ${b}（${lowerName}），动爻取诸数之和 ${sum}`;
  } else {
    const bz = computeBazi(now);
    const yNum = bz.yearBranchIdx + 1; // 年支序 1-12
    const mNum = getSolarMonthIndex(now) + 1; // 节气月序 1-12
    const dNum = now.getDate(); // 阳历日
    const hNum = mod(Math.floor((now.getHours() + 1) / 2), 12) + 1; // 时辰序 1-12
    upperName = trigramFromNumber(yNum + mNum + dNum);
    lowerName = trigramFromNumber(yNum + mNum + dNum + hNum);
    movePos = movingLineFromNumber(yNum + mNum + dNum + hNum);
    method = `时间起卦（阳历干支变体）：年支${yNum}＋节气月${mNum}＋日${dNum}＝上卦(${upperName})，再加时辰${hNum}＝下卦(${lowerName})，同数取动爻`;
  }

  // 本卦六爻（由下而上）
  const lines = [...trigramLines(lowerName), ...trigramLines(upperName)];
  const ben = hexFromLines(lines);

  // 变卦：翻动爻
  const changed = [...lines];
  changed[movePos - 1] = 1 - changed[movePos - 1];
  const bian = hexFromLines(changed);

  // 互卦：取2、3、4爻为下卦，3、4、5爻为上卦
  const huLines = [lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]];
  const hu = hexFromLines(huLines);

  // 体用：动爻所在之卦为「用」，另一卦为「体」
  const moveInUpper = movePos >= 4;
  const yongName = moveInUpper ? upperName : lowerName;
  const tiName = moveInUpper ? lowerName : upperName;

  return {
    method,
    upperName,
    lowerName,
    movePos,
    ben,
    bian,
    hu,
    ti: { name: tiName, element: TRIGRAM_INFO[tiName].element },
    yong: { name: yongName, element: TRIGRAM_INFO[yongName].element },
  };
}

/* ---------------- 塔罗抽牌 ---------------- */

function drawTarot(count) {
  const pool = [...MAJOR_ARCANA];
  const drawn = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const card = pool.splice(idx, 1)[0];
    const reversed = Math.random() < 0.5;
    drawn.push({ card, reversed });
  }
  return drawn;
}

/* ---------------- 组装提示词 ---------------- */

function buildPrompt(systemId, question, extra) {
  const header = `你是一位造诣深厚、行文克制的传统术数执业者。用户的提问："${question || "（未特别说明，请给出整体运势解读）"}"\n\n`;
  const footer = `\n\n要求：\n- 用中文作答，语气沉稳、专业、不夸张，不使用"绝对""一定"等断言词。\n- 先给出简要的起局/排盘要点，再给出解读，最后给出一条实际可执行的建议。\n- 全文控制在 400-600 字。\n- 不涉及赌博、投机下注类的直接指向性判断；如问题涉及此类，请转向理性提示。`;

  switch (systemId) {
    case "liuren":
      return (
        header +
        `已按农历 ${extra.lunarMonth} 月 ${extra.lunarDay} 日、第${extra.hourNum}个时辰（子时为1）掐指起课，落于「${extra.palace}」宫。请直接依据「${extra.palace}」宫的传统断法解读，不要重新起课或改变宫位。` +
        footer
      );
    case "bazi":
      return (
        header +
        `已排定四柱八字：年柱${extra.pillars.year}　月柱${extra.pillars.month}　日柱${extra.pillars.day}　时柱${extra.pillars.hour}。请直接基于这四柱指出日主五行、格局倾向，并结合提问给出解读，不要重新排盘或更改干支。` +
        footer
      );
    case "qimen":
      return (
        header +
        `已精确排出地盘与值符值使，以下数据均为算法算出，请直接使用，不要重新排盘：\n` +
        `局：${extra.dunType}${extra.ju}局（节气：${extra.period}，${extra.yuanName}）\n` +
        `地盘布局（宫位数字对应${Object.entries(PALACE_NAMES).map(([k, v]) => `${k}=${v}`).join("、")}）：` +
        `${Object.entries(extra.diPan).map(([stem, gong]) => `${stem}在${gong}宫(${PALACE_NAMES[gong]})`).join("、")}\n` +
        `当前时辰：${extra.hourInfo.text}（旬首：${extra.xunYi}所在${extra.baseGong}宫）\n` +
        `值符星：${extra.zhiFuStar}，飞临${extra.zhiFuGong}宫(${PALACE_NAMES[extra.zhiFuGong]})\n` +
        `值使门：${extra.zhiShiDoor}，行至${extra.zhiShiGong}宫(${PALACE_NAMES[extra.zhiShiGong]})\n` +
        `请你据此补齐其余七星、七门的位置：从值符星/值使门所在宫开始，按${extra.dunType === "阳遁" ? "顺时针(1→9)" : "逆时针(9→1)"}方向，沿九星固定序（天蓬天芮天冲天辅天禽天心天柱天任天英）和八门固定序（休死伤杜景死惊开中对应门序）依次排开，中五宫寄坤二宫。再结合提问给出解读。\n\n` +
        `断法与术语请以 ${QIMEN_CLASSICS.join("、")} 所载传统体系为准，可参考张志春《开门之悟》的现代阐释思路，配合 ${FOUNDATION_CLASSICS.join("、")} 的干支五行基础理论，避免使用与上述典籍体系相冲突的现代简化说法。` +
        footer
      );
    case "meihua":
      return (
        header +
        `已按梅花易数体例精确起卦，以下数据均为算法算出，请直接使用，不要重新起卦：\n` +
        `起卦方式：${extra.method}\n` +
        `本卦：${extra.ben.name}（上${extra.upperName}下${extra.lowerName}），第 ${extra.movePos} 爻为动爻\n` +
        `互卦：${extra.hu.name}\n` +
        `变卦：${extra.bian.name}\n` +
        `体用：体卦为${extra.ti.name}(${extra.ti.element})，用卦为${extra.yong.name}(${extra.yong.element})\n` +
        `请据此说明体用生克比和关系，参酌互卦所示中间过程、变卦所示结果趋向，再结合提问给出解读。以体卦为求测之主，用卦为所问之事。` +
        footer
      );
    case "liuyao":
      return (
        header +
        `已按摇钱成卦法排定卦象，以下数据均为算法算出，请直接使用，不要重新排卦：\n` +
        `六爻（自初爻至上爻）：\n${extra.raw
          .map((l, i) => `第${i + 1}爻：${l.label}`)
          .join("\n")}\n` +
        `本卦：${extra.ben.name}（上${extra.ben.upper}下${extra.ben.lower}）\n` +
        (extra.movingPositions.length
          ? `动爻：第 ${extra.movingPositions.join("、")} 爻；变卦：${extra.bian.name}（上${extra.bian.upper}下${extra.bian.lower}）\n`
          : `本卦六爻皆静，无动爻、无变卦，以本卦卦辞断之\n`) +
        (extra.sy ? `世爻在第 ${extra.sy.shi} 爻，应爻在第 ${extra.sy.ying} 爻\n` : "") +
        `请据此说明卦名卦义、世应关系与动爻取用，结合提问解读吉凶趋向。` +
        footer
      );
    case "tarot":
      return (
        header +
        `抽牌结果（${extra.spreadLabel}）：\n${extra.cards
          .map(
            (c, i) =>
              `${extra.positions[i] ? extra.positions[i] + "：" : ""}${c.card}（${c.reversed ? "逆位" : "正位"}）——关键词参考：${
                c.reversed ? TAROT_MEANINGS[c.card].rev : TAROT_MEANINGS[c.card].up
              }`
          )
          .join("\n")}\n请先逐张结合其牌位含义说明牌意，再综合三牌（或单牌）给出整体解读。牌义关键词仅供参照，请依提问情境灵活阐发。` +
        footer
      );
    default:
      return header + footer;
  }
}

/* ---------------- 展示层：设计系统（编年历风格） ---------------- */

const LATIN = {
  liuren: "LIU-REN",
  bazi: "BA-ZI",
  qimen: "QI-MEN",
  meihua: "MEI-HUA",
  liuyao: "LIU-YAO",
  tarot: "TAROT",
};

const _now = new Date();
const YEAR_GZ = STEMS[mod(_now.getFullYear() - 4, 10)] + BRANCHES[mod(_now.getFullYear() - 4, 12)];

const DESIGN_CSS = `
:root{
  --canvas:${T.canvas};--card:${T.card};--card2:${T.card2};--card3:${T.card3};
  --coffee:${T.coffee};--coffee-deep:${T.coffeeDeep};
  --ink:${T.ink};--ink2:${T.ink2};--ink3:${T.ink3};--ink-sub:${T.inkSub};
  --mono-label:${T.monoLabel};
  --gold:${T.gold};--gold-txt:${T.goldTxt};--gold-lt:${T.goldLt};--gold-lt2:${T.goldLt2};--gold-bg:${T.goldBg};
  --jade:${T.jade};--jade-bg:${T.jadeBg};--jade-bd:${T.jadeBd};
  --verm:${T.verm};--verm-bg:${T.vermBg};
  --line:${T.line};--line2:${T.line2};--cream:${T.cream};--cream-dim:${T.creamDim};
  --serif:'Noto Serif SC',serif;--sans:'Noto Sans SC',sans-serif;--mono:'Space Mono',monospace;
}
.page{background:var(--canvas);min-height:100vh;color:var(--ink3);font-family:var(--sans);font-size:13.5px;line-height:1.8;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px 40px}
.serif{font-family:var(--serif)} .mono{font-family:var(--mono)}
.runbar{display:flex;justify-content:space-between;align-items:center;gap:12px;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mono-label)}
.runbar.top{border-bottom:1px solid var(--line2);padding:12px 0}
.runbar.bot{border-top:1px solid var(--line2);padding:14px 0;margin-top:40px}
.runbar .r{text-align:right}
.kicker{display:flex;align-items:center;gap:14px;font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-txt)}
.kicker .bar{width:34px;height:2px;background:var(--gold);flex:0 0 auto}
.kicker.on-dark{color:var(--gold-lt)} .kicker.on-dark .bar{background:var(--gold-lt)}
.hero{background:var(--coffee);color:var(--cream);border-radius:10px;margin-top:20px;padding:46px 46px 40px;position:relative;overflow:hidden;box-shadow:0 20px 60px -34px rgba(21,17,11,.7)}
.hero-grid{display:grid;grid-template-columns:1fr 300px;gap:40px;align-items:center}
.hero h1{font-family:var(--serif);font-weight:900;color:#FBF3E2;font-size:clamp(44px,6.6vw,72px);line-height:1.05;letter-spacing:.14em;margin:18px 0 12px}
.hero-sub{font-family:var(--sans);font-weight:300;font-size:15px;color:var(--cream-dim);max-width:460px;line-height:1.85;margin:0}
.htags{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.htag{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#E6D9BF;border:1px solid rgba(216,184,120,.4);border-radius:3px;padding:3px 9px}
.hero-meta{margin-top:26px;padding-top:18px;border-top:1px solid rgba(216,184,120,.22);display:flex;gap:30px;flex-wrap:wrap}
.hmeta .k{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-lt2)}
.hmeta .v{font-family:var(--mono);font-size:13px;color:var(--cream);margin-top:3px}
.hero-wheel{display:flex;justify-content:center}
.section{padding:40px 0 0}
.sec-head{margin:0 0 22px}
.sec-head h2{font-family:var(--serif);font-weight:700;color:var(--ink);font-size:26px;line-height:1.25;margin:13px 0 6px;letter-spacing:.02em}
.sec-head .lead{font-size:13.5px;color:var(--ink-sub);max-width:660px;margin:0}
.sys-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line2);border:1px solid var(--line2);border-radius:8px;overflow:hidden}
.sys{background:var(--card);padding:22px 20px;position:relative;cursor:pointer;transition:background .18s;min-height:180px;display:flex;flex-direction:column;text-align:left;border:0;font:inherit;color:inherit;width:100%}
.sys:hover{background:var(--card3)}
.sys .no{font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:.12em;color:var(--mono-label)}
.sys .sym{position:absolute;top:16px;right:20px;font-family:var(--serif);font-weight:900;font-size:34px;color:var(--gold-lt);opacity:.55;line-height:1}
.sys .nm{font-family:var(--serif);font-weight:700;font-size:19px;color:var(--ink);margin:14px 0 3px}
.sys .st{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-txt)}
.sys .ds{font-size:12px;color:var(--ink-sub);margin-top:10px;line-height:1.7;flex:1}
.sys .pick{margin-top:12px;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mono-label)}
.sys.sel{background:var(--coffee)}
.sys.sel .no{color:var(--gold-lt2)} .sys.sel .sym{color:var(--gold-lt);opacity:.85} .sys.sel .nm{color:#FBF3E2} .sys.sel .st{color:var(--gold-lt)} .sys.sel .ds{color:var(--cream-dim)}
.chip-sel{display:inline-block;align-self:flex-start;background:var(--jade);color:#fff;font-family:var(--mono);font-size:10px;border-radius:3px;padding:2px 8px;letter-spacing:.06em;margin-top:12px}
.intro{font-size:13px;line-height:1.85;color:var(--ink-sub);border-left:3px solid var(--gold);background:var(--gold-bg);padding:12px 16px;border-radius:0 6px 6px 0;margin:0 0 22px}
.form-card{background:var(--card);border:1px solid var(--line2);border-radius:10px;box-shadow:0 6px 30px rgba(58,42,26,.14);padding:32px 34px}
.form-head{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:20px}
.form-head .ft{font-family:var(--serif);font-weight:700;font-size:18px;color:var(--ink)}
.form-head .fm{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mono-label);text-align:right;padding-top:4px}
.flabel{font-family:var(--mono);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-txt);display:block;margin-bottom:7px}
.fgrid{display:grid;grid-template-columns:1.5fr 1fr;gap:22px;align-items:start}
.qbox{width:100%;background:var(--card2);border:1px solid var(--line2);border-radius:7px;padding:11px 12px;font-family:var(--sans);font-size:13.5px;color:var(--ink2);outline:none;resize:vertical;min-height:104px;box-sizing:border-box}
.qbox:focus,.fin:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,146,74,.12)}
.fin{width:100%;background:var(--card2);border:1px solid var(--line2);border-radius:7px;padding:10px 12px;font-family:var(--sans);font-size:13.5px;color:var(--ink2);outline:none;box-sizing:border-box}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.callout{border-radius:7px;padding:13px 16px;font-size:12.5px;line-height:1.75}
.callout .lab{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;display:block;margin-bottom:5px}
.callout.jade{background:var(--jade-bg);border-left:3px solid var(--jade)} .callout.jade .lab{color:var(--jade)} .callout.jade .bd{color:#2c5a44}
.callout.gold{background:var(--gold-bg);border-left:3px solid var(--gold)} .callout.gold .lab{color:var(--gold-txt)} .callout.gold .bd{color:#5f4c24}
.callout.verm{background:var(--verm-bg);border-left:3px solid var(--verm)} .callout.verm .lab{color:var(--verm)} .callout.verm .bd{color:#7a3830}
.spread{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.spread button{font-family:var(--mono);font-size:11px;letter-spacing:.04em;border-radius:7px;padding:12px 10px;background:var(--card2);border:1px solid var(--line2);color:var(--ink-sub);cursor:pointer;transition:.15s}
.spread button.on{background:var(--coffee);color:var(--cream);border-color:var(--coffee)}
.btn{width:100%;background:var(--gold);color:var(--card);border:0;border-radius:7px;padding:13px;font-family:var(--serif);font-weight:700;font-size:15px;letter-spacing:.3em;box-shadow:0 6px 22px -14px rgba(58,42,26,.7);cursor:pointer;transition:filter .15s,opacity .15s}
.btn:hover{filter:brightness(.96)} .btn:disabled{opacity:.6;cursor:default}
.btn.ghost{background:transparent;color:var(--gold-txt);border:1px solid var(--gold);box-shadow:none;letter-spacing:.2em;font-size:13px;width:auto;padding:11px 22px}
.btn-row{display:flex;gap:12px;align-items:stretch;margin-top:18px}
.errline{font-family:var(--mono);font-size:11px;color:var(--verm);margin:14px 0 0}
.loading{display:flex;align-items:center;gap:16px;margin-top:22px;padding:20px 26px;background:var(--card);border:1px dashed var(--gold);border-radius:10px}
.loading .lg{font-family:var(--serif);font-weight:700;font-size:20px;color:var(--gold-txt);letter-spacing:.14em;animation:pulse 1.4s ease-in-out infinite}
.loading .lm{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mono-label)}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
.castbar{background:var(--coffee);color:var(--cream);border-radius:10px;padding:24px 28px;margin-top:22px;box-shadow:0 16px 44px -32px rgba(21,17,11,.85)}
.cb-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;border-bottom:1px solid rgba(243,236,224,.14);padding-bottom:12px;margin-bottom:6px}
.cb-code{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-lt2)}
.datarow{display:grid;grid-template-columns:104px 1fr;gap:14px;padding:9px 0;border-bottom:1px solid rgba(243,236,224,.08)}
.datarow:last-child{border-bottom:0}
.datarow .dk{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-lt2);padding-top:3px}
.datarow .dv{font-family:var(--mono);font-size:13px;color:var(--cream);letter-spacing:.02em;font-variant-numeric:tabular-nums}
.datarow .dv .ser{font-family:var(--serif);font-weight:700;font-size:15px;color:#FBF3E2}
.minihex{display:flex;flex-direction:column;gap:5px}
.mh-row{display:flex;align-items:center;gap:9px}
.mh-lab{font-family:var(--mono);font-size:9px;color:var(--gold-lt2);width:14px;text-align:center}
.mh-bar{display:flex;gap:7px;width:64px}
.mh-seg{height:7px;border-radius:1px;background:var(--gold-lt2)}
.mh-chg{font-family:var(--mono);font-size:10px;color:var(--verm)}
.mh-chg.y{color:var(--jade)}
.result{position:relative;background:var(--card);border:1px solid var(--line2);border-radius:10px;box-shadow:0 6px 30px rgba(58,42,26,.14);padding:40px 42px;overflow:hidden}
.result::before{content:'';position:absolute;inset:14px;border:1px solid var(--line);border-radius:6px;pointer-events:none}
.r-head{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:20px}
.r-head h3{font-family:var(--serif);font-weight:700;font-size:24px;color:var(--ink);margin:0}
.r-head .rmeta{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mono-label);margin-top:6px}
.rbody{position:relative;z-index:1;font-family:var(--serif);font-weight:500;font-size:16px;line-height:2.05;color:var(--ink2);white-space:pre-wrap}
.rfoot{position:relative;z-index:1;margin-top:20px;padding-top:14px;border-top:1px solid var(--line);font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--mono-label)}
.seal{flex:0 0 auto;width:58px;height:58px;border-radius:6px;background:var(--verm);color:#F7EDE4;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--serif);font-weight:700;font-size:19px;line-height:1.02;transform:rotate(-3deg);box-shadow:0 4px 14px -8px rgba(58,42,26,.7);letter-spacing:.04em;animation:sealIn .5s ease-out}
@keyframes sealIn{0%{opacity:0;transform:scale(1.8) rotate(-3deg)}60%{opacity:1;transform:scale(.94) rotate(-3deg)}100%{opacity:1;transform:scale(1) rotate(-3deg)}}
.acc{margin-top:12px;background:var(--card);border:1px solid var(--line2);border-radius:10px;overflow:hidden}
.acc summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:16px 22px;font-family:var(--serif);font-weight:700;font-size:15px;color:var(--ink)}
.acc summary::-webkit-details-marker{display:none}
.acc .hint{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mono-label)}
.acc-body{padding:2px 22px 24px;border-top:1px solid var(--line)}
.acc-body h4{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-txt);margin:20px 0 9px}
.acc-body p{font-size:12.5px;line-height:1.85;color:var(--ink3);margin:0 0 10px}
.acc-body ul{margin:0;padding-left:18px}
.acc-body li{font-size:12.5px;line-height:1.8;color:var(--ink3);margin-bottom:4px}
.sixlist{display:grid;grid-template-columns:1fr 1fr;gap:3px 24px;list-style:none;padding:0!important;margin:0}
.sixlist li{margin:0}.sixlist .n{font-family:var(--serif);font-weight:700;color:var(--ink)}.sixlist .s{color:var(--mono-label)}
.foot-note{text-align:center;font-size:11px;color:var(--ink-sub);opacity:.75;max-width:470px;margin:16px auto 24px;line-height:1.7}
@media(max-width:820px){
  .hero{padding:36px 28px 32px}
  .hero-grid{grid-template-columns:1fr;gap:26px}
  .hero-wheel{order:-1}
  .sys-grid{grid-template-columns:1fr 1fr}
  .fgrid{grid-template-columns:1fr;gap:18px}
}
@media(max-width:520px){
  .wrap{padding:0 16px 30px}
  .sys-grid{grid-template-columns:1fr}
  .frow,.spread{grid-template-columns:1fr}
  .datarow{grid-template-columns:80px 1fr;gap:10px}
  .result,.form-card{padding:26px 22px}
}
`;

function Kicker({ code, label, onDark }) {
  return (
    <div className={"kicker" + (onDark ? " on-dark" : "")}>
      <span className="bar" />
      {code ? code + " · " : ""}{label}
    </div>
  );
}

function RunBar({ pos }) {
  return (
    <div className={"runbar " + pos}>
      <span>富甲天下 · AI 多体系术数问答</span>
      <span className="r">{pos === "top" ? `WB-2026 · 六体 · ${YEAR_GZ}年` : "算法起局 · AI 解读 · 仅供参考"}</span>
    </div>
  );
}

function Callout({ tone, label, children }) {
  return (
    <div className={"callout " + tone}>
      {label && <span className="lab">{label}</span>}
      <span className="bd">{children}</span>
    </div>
  );
}

// SVG 八卦轮：太极 + 先天八卦符号（浓咖啡底、金色细线）
function BaguaWheel() {
  const trigrams = ["☰", "☴", "☵", "☶", "☷", "☳", "☲", "☱"]; // 先天圆图，自顶部顺时针
  const cx = 140, cy = 140, r = 118;
  return (
    <svg width="252" height="252" viewBox="0 0 280 280" role="img" aria-label="八卦轮">
      <circle cx={cx} cy={cy} r="132" fill="none" stroke={T.goldLt} strokeOpacity="0.28" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="100" fill="none" stroke={T.goldLt} strokeOpacity="0.16" strokeWidth="1" />
      {trigrams.map((g, i) => {
        const a = (i / 8) * 2 * Math.PI - Math.PI / 2;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        return (
          <text key={i} x={x} y={y} fill={T.goldLt} fontSize="19" textAnchor="middle" dominantBaseline="central" opacity="0.85">{g}</text>
        );
      })}
      {/* 太极 */}
      <circle cx={cx} cy={cy} r="34" fill="#EAD9B5" />
      <path d={`M${cx},${cy - 34} A34,34 0 0 1 ${cx},${cy + 34} A17,17 0 0 1 ${cx},${cy} A17,17 0 0 0 ${cx},${cy - 34} Z`} fill="#2a2013" />
      <circle cx={cx} cy={cy - 17} r="5.5" fill="#2a2013" />
      <circle cx={cx} cy={cy + 17} r="5.5" fill="#EAD9B5" />
      <circle cx={cx} cy={cy} r="34" fill="none" stroke={T.goldLt} strokeOpacity="0.5" strokeWidth="1" />
    </svg>
  );
}

// 六爻迷你卦爻图（raw：初爻→上爻，value 6/7/8/9）
function MiniHex({ raw }) {
  const labels = ["初", "二", "三", "四", "五", "上"];
  const rows = raw.map((l, i) => ({ ...l, lab: labels[i] })).reverse(); // 上爻在上
  return (
    <div className="minihex">
      {rows.map((l, i) => {
        const yang = l.value % 2 === 1;
        const changing = l.value === 6 || l.value === 9;
        return (
          <div className="mh-row" key={i}>
            <span className="mh-lab">{l.lab}</span>
            <div className="mh-bar">
              {yang ? (
                <span className="mh-seg" style={{ width: 64 }} />
              ) : (
                <>
                  <span className="mh-seg" style={{ width: 27 }} />
                  <span className="mh-seg" style={{ width: 27 }} />
                </>
              )}
            </div>
            {changing && <span className={"mh-chg" + (l.value === 9 ? " y" : "")}>{l.value === 9 ? "○" : "×"}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- 主组件 ---------------- */

export default function App() {
  const [selected, setSelected] = useState(null);
  const [question, setQuestion] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [numbers, setNumbers] = useState("");
  const [lunarMonth, setLunarMonth] = useState("");
  const [lunarDay, setLunarDay] = useState("");
  const [tarotCount, setTarotCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [castInfo, setCastInfo] = useState(null);
  const resultRef = useRef(null);

  function resetForm(id) {
    setSelected(id);
    setQuestion("");
    setBirthDate("");
    setBirthTime("");
    setNumbers("");
    setLunarMonth("");
    setLunarDay("");
    setTarotCount(3);
    setResult(null);
    setError("");
    setCastInfo(null);
  }

  async function handleSubmit() {
    if (!selected) return;
    if (selected === "bazi" && !birthDate) {
      setError("请填写出生日期");
      return;
    }
    if (selected === "liuren" && (!lunarMonth || !lunarDay)) {
      setError("请填写农历月、日");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    const now = new Date();
    const timeStr = now.toLocaleString("zh-CN", { hour12: false });

    let extra = { time: timeStr };
    let cast = null;

    if (selected === "bazi") {
      const birthDateTime = new Date(`${birthDate}T${birthTime || "12:00"}`);
      const pillars = computeBazi(birthDateTime);
      extra.pillars = pillars;
      cast = { type: "bazi", text: `${pillars.year} ${pillars.month} ${pillars.day} ${pillars.hour}` };
    } else if (selected === "liuren") {
      const { palace, hourNum } = computeXiaoLiuRen(Number(lunarMonth), Number(lunarDay), now.getHours());
      extra.lunarMonth = Number(lunarMonth);
      extra.lunarDay = Number(lunarDay);
      extra.hourNum = hourNum;
      extra.palace = palace;
      cast = { type: "liuren", palace, hourNum };
    } else if (selected === "meihua") {
      const mh = computeMeihua(numbers, now);
      Object.assign(extra, mh);
      cast = { type: "meihua", ...mh };
    } else if (selected === "liuyao") {
      const raw = castLiuYao();
      const ly = computeLiuYao(raw);
      extra.raw = raw;
      Object.assign(extra, ly);
      cast = { type: "liuyao", raw, ...ly };
    } else if (selected === "tarot") {
      const cards = drawTarot(tarotCount);
      const spread = TAROT_SPREADS[tarotCount];
      extra.cards = cards;
      extra.positions = spread.positions;
      extra.spreadLabel = spread.label;
      cast = { type: "tarot", cards, positions: spread.positions };
    } else if (selected === "qimen") {
      const full = computeQimenFull(now);
      Object.assign(extra, full);
      cast = { type: "qimen", ...full };
    } else {
      cast = { type: "time", text: timeStr };
    }

    setCastInfo(cast);

    const prompt = buildPrompt(selected, question, extra);

    try {
      // 前端不再直连 Anthropic，而是调用自己部署的后端 /api/reading，
      // 由后端持有 API key 并转发请求，避免 key 暴露在浏览器里。
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`后端返回非法数据（HTTP ${response.status}）：${rawText.slice(0, 200)}`);
      }
      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      setResult(data.text || "解读生成失败，请重试。");
    } catch (e) {
      console.error("请求失败:", e);
      setError(e.message || "未知错误");
    } finally {
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }

  const currentSystem = SYSTEMS.find((s) => s.id === selected);

  // 算法排盘：按体系生成「数据行」（Space Mono 数据感）
  function castRows() {
    const c = castInfo;
    if (!c) return null;
    const row = (k, v, key) => (
      <div className="datarow" key={key}>
        <div className="dk">{k}</div>
        <div className="dv">{v}</div>
      </div>
    );
    if (c.type === "liuyao") {
      return (
        <>
          {row("摇卦记录", c.raw.map((l) => l.label).join(" · "), "r1")}
          <div className="datarow">
            <div className="dk">卦爻</div>
            <div className="dv"><MiniHex raw={c.raw} /></div>
          </div>
          {row("本卦", <><span className="ser">{c.ben.name}</span>（上{c.ben.upper} 下{c.ben.lower}）</>, "r3")}
          {row("动爻", c.movingPositions.length ? `第 ${c.movingPositions.join("、")} 爻 · 变卦 ${c.bian.name}` : "六爻皆静 · 无变卦", "r4")}
          {c.sy && row("世应", `世在 ${c.sy.shi} 爻 · 应在 ${c.sy.ying} 爻 · 主近宾远`, "r5")}
        </>
      );
    }
    if (c.type === "meihua") {
      return (
        <>
          {row("本卦", <><span className="ser">{c.ben.name}</span>（上{c.upperName} 下{c.lowerName}）</>, "m1")}
          {row("动爻", `第 ${c.movePos} 爻`, "m2")}
          {row("互卦", c.hu.name, "m3")}
          {row("变卦", c.bian.name, "m4")}
          {row("体 / 用", `体 ${c.ti.name}(${c.ti.element}) · 用 ${c.yong.name}(${c.yong.element})`, "m5")}
        </>
      );
    }
    if (c.type === "bazi") {
      const [y, m, d, h] = c.text.split(" ");
      return (
        <>
          {row("年柱", <span className="ser">{y}</span>, "b1")}
          {row("月柱", <span className="ser">{m}</span>, "b2")}
          {row("日柱", <span className="ser">{d}</span>, "b3")}
          {row("时柱", <span className="ser">{h}</span>, "b4")}
        </>
      );
    }
    if (c.type === "liuren") {
      return (
        <>
          {row("落宫", <span className="ser">{c.palace}</span>, "l1")}
          {row("时辰", `第 ${c.hourNum} 个时辰`, "l2")}
        </>
      );
    }
    if (c.type === "qimen") {
      return (
        <>
          {row("定局", `${c.period} · ${c.yuanName} · ${c.dunType}${c.ju}局`, "q1")}
          {row("值符", `${c.zhiFuStar} 临 ${PALACE_NAMES[c.zhiFuGong]}宫`, "q2")}
          {row("值使", `${c.zhiShiDoor} 行至 ${PALACE_NAMES[c.zhiShiGong]}宫`, "q3")}
        </>
      );
    }
    if (c.type === "tarot") {
      return <>{c.cards.map((card, i) => row(c.positions[i] || `第 ${i + 1} 张`, `${card.card}（${card.reversed ? "逆位" : "正位"}）`, "t" + i))}</>;
    }
    return null;
  }

  return (
    <div className="page">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700;900&family=Noto+Sans+SC:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap');`}</style>
      <style>{DESIGN_CSS}</style>

      <div className="wrap">
        <RunBar pos="top" />

        {/* HERO */}
        <header className="hero">
          <div className="hero-grid">
            <div>
              <Kicker onDark code="CODEX" label="六体通书 · 起局 & 解读" />
              <h1>富甲天下</h1>
              <p className="hero-sub">AI · 多体系术数问答。起局、排盘、成卦全由确定性算法在前端精算，AI 只作文字解读，同一局面复算稳定。</p>
              <div className="htags">
                {SYSTEMS.map((s) => <span className="htag" key={s.id}>{s.name}</span>)}
              </div>
              <div className="hero-meta">
                <div className="hmeta"><div className="k">Systems</div><div className="v">06 体系</div></div>
                <div className="hmeta"><div className="k">Engine</div><div className="v">Deterministic</div></div>
                <div className="hmeta"><div className="k">Edition</div><div className="v">WB-2026</div></div>
                <div className="hmeta"><div className="k">Active</div><div className="v">{currentSystem ? `${currentSystem.name} · ${LATIN[selected]}` : "择体 · SELECT"}</div></div>
              </div>
            </div>
            <div className="hero-wheel"><BaguaWheel /></div>
          </div>
        </header>

        {/* CHAPTER 01 · 择体系 */}
        <section className="section">
          <div className="sec-head">
            <Kicker code="CHAPTER 01" label="择体 · 六大体系" />
            <h2>六体系索引 · 择一而问</h2>
            <p className="lead">六套术数各有所长，起局方式、擅答之事皆异。下表为目录式索引，点选其一即可起局问卜。</p>
          </div>
          <div className="sys-grid">
            {SYSTEMS.map((s, i) => {
              const sel = selected === s.id;
              return (
                <button key={s.id} className={"sys" + (sel ? " sel" : "")} onClick={() => resetForm(s.id)}>
                  <div className="no">{String(i + 1).padStart(2, "0")}</div>
                  <div className="sym">{s.glyph}</div>
                  <div className="nm">{s.name}</div>
                  <div className="st">{s.sub}</div>
                  <div className="ds">{SYSTEM_INTRO[s.id]}</div>
                  {sel ? <span className="chip-sel">ACTIVE · 已选</span> : <div className="pick">点选起局 →</div>}
                </button>
              );
            })}
          </div>
        </section>

        {/* CHAPTER 02 · 起局 */}
        {selected && (
          <section className="section">
            <div className="sec-head">
              <Kicker code="CHAPTER 02" label={`起局 · ${LATIN[selected]}`} />
              <h2>{currentSystem.name} · {currentSystem.sub}</h2>
            </div>
            <p className="intro">{SYSTEM_INTRO[selected]}</p>

            <div className="form-card">
              <div className="form-head">
                <div className="ft">{currentSystem.name} · 起局</div>
                <div className="fm">MODE · {LATIN[selected]}<br />WB-2026 · 六体通书</div>
              </div>

              <div className="fgrid">
                <div>
                  <label className="flabel">所问之事 · Question</label>
                  <textarea className="qbox" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="可留空，留空则给出整体运势解读" />
                </div>
                <div>
                  {selected === "bazi" && (
                    <>
                      <label className="flabel">出生日期 · Date</label>
                      <input className="fin" style={{ marginBottom: 14 }} type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                      <label className="flabel">出生时间 · Time（选填）</label>
                      <input className="fin" type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
                    </>
                  )}
                  {selected === "liuren" && (
                    <>
                      <div className="frow" style={{ marginBottom: 12 }}>
                        <div>
                          <label className="flabel">农历月 1-12</label>
                          <input className="fin" type="number" min="1" max="12" value={lunarMonth} onChange={(e) => setLunarMonth(e.target.value)} placeholder="例 5" />
                        </div>
                        <div>
                          <label className="flabel">农历日 1-30</label>
                          <input className="fin" type="number" min="1" max="30" value={lunarDay} onChange={(e) => setLunarDay(e.target.value)} placeholder="例 18" />
                        </div>
                      </div>
                      <Callout tone="jade" label="时辰 · Auto">时辰按提交时的当下时刻自动取用；请自行核对农历月/日（闰月按当月实际农历数填写）。</Callout>
                    </>
                  )}
                  {selected === "meihua" && (
                    <>
                      <label className="flabel">起卦数字 · Numbers（选填）</label>
                      <input className="fin" style={{ marginBottom: 12 }} type="text" value={numbers} onChange={(e) => setNumbers(e.target.value)} placeholder="例 7 12" />
                      <Callout tone="jade" label="起卦法 · How">输入两个以上数字：首数定上卦、次数定下卦、诸数之和定动爻。留空则以当前时间起卦（未接农历库，时间法采阳历干支变体）。</Callout>
                    </>
                  )}
                  {selected === "liuyao" && (
                    <Callout tone="gold" label="六爻说明 · How it works">提交后模拟摇钱起卦（六次三枚铜钱），由算法排出本卦、变卦与世应，逐爻定阴阳老少、标出动爻，无需手动排卦。</Callout>
                  )}
                  {selected === "qimen" && (
                    <Callout tone="gold" label="奇门说明 · How it works">以提交时的当下时刻起局。局数、地盘、值符值使均已精确算法计算；其余七星七门按固定序由 AI 补齐。依据：{QIMEN_CLASSICS.join("、")}</Callout>
                  )}
                  {selected === "tarot" && (
                    <>
                      <label className="flabel">牌阵 · Spread</label>
                      <div className="spread" style={{ marginBottom: 12 }}>
                        {Object.entries(TAROT_SPREADS).map(([n, s]) => (
                          <button key={n} type="button" className={tarotCount === Number(n) ? "on" : ""} onClick={() => setTarotCount(Number(n))}>{s.label}</button>
                        ))}
                      </div>
                      <Callout tone="jade" label="抽牌 · Draw">提交后从二十二张大阿尔卡纳中随机抽取，正逆位随机。</Callout>
                    </>
                  )}
                </div>
              </div>

              {error && <p className="errline">✕ {error}</p>}

              <div className="btn-row">
                <button className="btn" onClick={handleSubmit} disabled={loading}>{loading ? "推 演 中…" : "起 局"}</button>
              </div>
            </div>
          </section>
        )}

        {loading && (
          <div className="loading">
            <div className="lg">研墨　布局　推演…</div>
            <div className="lm">Casting · please wait</div>
          </div>
        )}

        {castInfo && !loading && (
          <div className="castbar">
            <div className="cb-head">
              <Kicker onDark code="CASTING LOG" label="算法排盘" />
              <span className="cb-code">{LATIN[selected]} · 复算稳定</span>
            </div>
            {castRows()}
          </div>
        )}

        {result && !loading && (
          <section className="section" ref={resultRef}>
            <div className="sec-head"><Kicker code="CHAPTER 03" label="解读" /></div>
            <div className="result">
              <div className="r-head">
                <div>
                  <h3>{currentSystem?.name} · 解读</h3>
                  <div className="rmeta">AI Reading · {LATIN[selected]}</div>
                </div>
                <div className="seal"><span>天</span><span>机</span></div>
              </div>
              <div className="rbody">{result}</div>
              <div className="rfoot">术数推演仅供参考自省 · 起局由算法精算 · 文字由 AI 生成</div>
            </div>
          </section>
        )}

        {/* APPENDIX · 关于本站 */}
        <section className="section">
          <div className="sec-head"><Kicker code="APPENDIX" label="关于本站 · 使用说明" /></div>
          <details className="acc">
            <summary><span>关于本站 · 使用说明</span><span className="hint">点击展开</span></summary>
            <div className="acc-body">
              <h4>机制 · How it works</h4>
              <p>「富甲天下」汇集小六壬、八字、奇门遁甲、梅花易数、六爻、塔罗六种问答体系。起局、排盘、成卦全部交由确定性算法在本地精确计算（四柱、奇门定局与值符值使、六爻卦象与世应、梅花卦数与体用等），再由 AI 依传统典籍体系只作文字解读，因此同一局面复算结果稳定，不会每次乱变。</p>
              <h4>六体系一览 · Six systems</h4>
              <ul className="sixlist">
                {SYSTEMS.map((s) => <li key={s.id}><span className="n">{s.name}</span> <span className="s">— {s.sub}</span></li>)}
              </ul>
              <h4>准确性说明 · Accuracy</h4>
              <ul>
                <li>八字年柱、月柱按节气近似日期表判断，节气交接前后 1 天内出生者建议以万年历核对。</li>
                <li>小六壬需自行填入准确的农历月、日；闰月按当月实际农历数填写。</li>
                <li>梅花易数「时间起卦」因未接入农历库，采阳历干支变体；如需严格古法，请改用数字起卦。</li>
                <li>奇门遁甲的局数、地盘、值符值使已精确计算，其余七星七门按固定序由 AI 补齐。</li>
              </ul>
              <div style={{ marginTop: 16 }}>
                <Callout tone="verm" label="免责 · Disclaimer">术数推演仅供参考与自省，不构成对具体决策（含投资、医疗、法律、婚姻等）的建议；请勿以此替代专业意见或用于赌博投机。</Callout>
              </div>
            </div>
          </details>
        </section>

        <RunBar pos="bot" />
        <p className="foot-note">术数推演仅供参考与自省，不构成对具体决策（含投资、医疗、法律等）的建议。</p>
      </div>
    </div>
  );
}
