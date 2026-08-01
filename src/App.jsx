import React, { useState, useRef } from "react";
import * as LunarLib from "lunar-javascript";

// 用农历库把"当前中国时间"换算成农历月、日（避免手填出错）
function getChinaLunarNow() {
  const nowUtc = new Date();
  const chinaMs = nowUtc.getTime() + (nowUtc.getTimezoneOffset() + 480) * 60000;
  const c = new Date(chinaMs);
  try {
    const Solar = LunarLib.Solar || (LunarLib.default && LunarLib.default.Solar);
    const solar = Solar.fromYmdHms(
      c.getFullYear(), c.getMonth() + 1, c.getDate(),
      c.getHours(), c.getMinutes(), c.getSeconds()
    );
    const lunar = solar.getLunar();
    let m = lunar.getMonth();
    if (m < 0) m = -m;
    return { lunarMonth: m, lunarDay: lunar.getDay(), chinaHour: c.getHours() };
  } catch (e) {
    return { lunarMonth: c.getMonth() + 1, lunarDay: c.getDate(), chinaHour: c.getHours() };
  }
}

/* ---------------- 数据配置 ---------------- */

const SYSTEMS = [
  { id: "liuren", name: "小六壬", sub: "掐指速断", glyph: "六" },
  { id: "bazi", name: "八字", sub: "命理推演", glyph: "命" },
  { id: "qimen", name: "奇门遁甲", sub: "时空布局", glyph: "奇" },
  { id: "meihua", name: "梅花易数", sub: "数理起卦", glyph: "梅" },
  { id: "liuyao", name: "六爻", sub: "摇钱成卦", glyph: "爻" },
  { id: "tarot", name: "塔罗", sub: "抽牌问心", glyph: "塔" },
];

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

const TAROT_DECK = [
  { name: "愚者", code: "m00", up: "新的开始、冒险、纯真、自由、无限可能", rev: "鲁莽、盲目、逃避责任、犹豫不前" },
  { name: "魔术师", code: "m01", up: "创造、行动力、资源整合、自信、显化", rev: "欺瞒、才能未展、意志薄弱、操纵" },
  { name: "女祭司", code: "m02", up: "直觉、潜意识、静观、秘密、内在智慧", rev: "压抑、疏离、表里不一、忽视直觉" },
  { name: "皇后", code: "m03", up: "丰饶、母性、感性、滋养、丰盛", rev: "依赖、过度保护、创造受阻、空虚" },
  { name: "皇帝", code: "m04", up: "权威、秩序、责任、掌控、稳固", rev: "专断、僵化、失控、滥权" },
  { name: "教皇", code: "m05", up: "传统、信仰、指引、规范、精神导师", rev: "教条、叛逆、形式主义、僵化信念" },
  { name: "恋人", code: "m06", up: "结合、抉择、爱与和谐、价值观一致", rev: "失衡、诱惑、错误的选择、分歧" },
  { name: "战车", code: "m07", up: "意志、进取、胜利、掌控方向、克服", rev: "失控、冲动、方向不明、内耗" },
  { name: "力量", code: "m08", up: "内在力量、勇气、耐心、以柔克刚、慈悲", rev: "自我怀疑、暴躁、软弱、失去信心" },
  { name: "隐士", code: "m09", up: "内省、独处、寻求真理、指引、沉淀", rev: "孤僻、逃避、固执、与世隔绝" },
  { name: "命运之轮", code: "m10", up: "转机、循环、机遇、顺势而为、时来运转", rev: "逆转、失控、时运不济、抗拒变化" },
  { name: "正义", code: "m11", up: "公正、平衡、因果、担当、真相", rev: "偏颇、失衡、推诿、逃避责任" },
  { name: "倒吊人", code: "m12", up: "牺牲、换位思考、静待、放下、转念", rev: "徒劳、执迷、拖延、无谓牺牲" },
  { name: "死神", code: "m13", up: "结束与重生、转变、放下、蜕变", rev: "抗拒改变、停滞、纠缠、不肯放手" },
  { name: "节制", code: "m14", up: "调和、节制、耐心、中道、融合", rev: "失衡、极端、内耗、缺乏耐心" },
  { name: "恶魔", code: "m15", up: "欲望、束缚、执念、诱惑、物质沉迷", rev: "解脱、觉醒、挣脱枷锁、直面阴影" },
  { name: "高塔", code: "m16", up: "突变、崩解、觉醒、旧格局瓦解、真相冲击", rev: "拖延的崩溃、勉强维持、逃避剧变" },
  { name: "星星", code: "m17", up: "希望、疗愈、灵感、信心、指引", rev: "失望、迷惘、信心不足、理想幻灭" },
  { name: "月亮", code: "m18", up: "潜意识、幻象、不安、直觉、隐藏之事", rev: "迷雾渐散、释放恐惧、真相浮现" },
  { name: "太阳", code: "m19", up: "成功、喜悦、活力、光明、圆满", rev: "短暂受挫、过度乐观、光芒受遮" },
  { name: "审判", code: "m20", up: "觉醒、召唤、清算、重生、顿悟", rev: "自责、犹疑、逃避审视、错失召唤" },
  { name: "世界", code: "m21", up: "圆满、达成、整合、周期完成、圆融", rev: "未竟、拖延、功亏一篑、缺乏收尾" },
  { name: "权杖王牌", code: "w01", up: "行动的火花、灵感、新机会、热情萌动", rev: "延迟、缺乏方向、机会落空" },
  { name: "权杖二", code: "w02", up: "规划、抉择、远见、掌握主动", rev: "犹豫不决、缺乏计划、恐惧未知" },
  { name: "权杖三", code: "w03", up: "扩展、远景、等待回报、贸易", rev: "计划受阻、目光短浅、延误" },
  { name: "权杖四", code: "w04", up: "庆祝、稳定、和谐、归属、里程碑", rev: "不稳、过渡期、庆祝延后" },
  { name: "权杖五", code: "w05", up: "竞争、冲突、分歧、磨合", rev: "避免冲突、内耗、化解争端" },
  { name: "权杖六", code: "w06", up: "胜利、认可、凯旋、领导", rev: "失利、名不副实、骄兵必败" },
  { name: "权杖七", code: "w07", up: "坚守、防御、挑战、占据优势", rev: "招架不住、放弃、退让" },
  { name: "权杖八", code: "w08", up: "迅速、进展、消息传来、行动加速", rev: "延误、匆促、失序、受阻" },
  { name: "权杖九", code: "w09", up: "坚持、警觉、蓄势、最后防线", rev: "精疲力竭、固执、防备过度" },
  { name: "权杖十", code: "w10", up: "重担、责任过载、独力承担、临近完成", rev: "放下重担、卸责、不堪重负" },
  { name: "权杖侍从", code: "w11", up: "热情的使者、消息、探索、行动派", rev: "冲动、坏消息、缺乏方向" },
  { name: "权杖骑士", code: "w12", up: "行动力、冒险、魄力、勇往直前", rev: "鲁莽、急躁、半途而废" },
  { name: "权杖王后", code: "w13", up: "自信、魅力、热情、独立的女性能量", rev: "跋扈、善妒、情绪化" },
  { name: "权杖国王", code: "w14", up: "领导、远见、魄力、事业格局", rev: "专横、急功近利、刚愎" },
  { name: "圣杯王牌", code: "c01", up: "新感情、情感萌发、爱、直觉开启", rev: "情感封闭、失落、空虚" },
  { name: "圣杯二", code: "c02", up: "结合、伙伴、互相吸引、和谐关系", rev: "失和、分离、关系失衡" },
  { name: "圣杯三", code: "c03", up: "友谊、庆祝、团聚、共享喜悦", rev: "过度放纵、聚散、小圈子矛盾" },
  { name: "圣杯四", code: "c04", up: "倦怠、冷淡、错失、内省", rev: "走出低潮、重新接纳、新机会" },
  { name: "圣杯五", code: "c05", up: "失落、遗憾、执着已失、悲伤", rev: "接受、放下、重拾希望" },
  { name: "圣杯六", code: "c06", up: "回忆、纯真、旧情、善意", rev: "沉溺过去、幼稚、走出回忆" },
  { name: "圣杯七", code: "c07", up: "选择、幻想、诱惑、白日梦", rev: "看清现实、务实抉择、幻灭" },
  { name: "圣杯八", code: "c08", up: "离开、追寻更深意义、放下现状", rev: "逃避、漂泊不定、回头" },
  { name: "圣杯九", code: "c09", up: "满足、心愿达成、如愿、幸福", rev: "表面满足、贪求、心愿落空" },
  { name: "圣杯十", code: "c10", up: "圆满、家庭和乐、情感归宿、幸福", rev: "家庭失和、貌合神离、价值失衡" },
  { name: "圣杯侍从", code: "c11", up: "感性的使者、情书、温柔、创意", rev: "情绪化、多愁善感、不成熟" },
  { name: "圣杯骑士", code: "c12", up: "浪漫、追求、理想主义、情感行动", rev: "不切实际、见异思迁、情绪用事" },
  { name: "圣杯王后", code: "c13", up: "共情、体贴、包容、情感成熟", rev: "情绪泛滥、依赖、拿捏失度" },
  { name: "圣杯国王", code: "c14", up: "情感成熟、宽厚、外交、包容", rev: "情感压抑、喜怒无常、冷漠" },
  { name: "宝剑王牌", code: "s01", up: "突破、真相、清晰、决断、思维之力", rev: "混乱、思绪不清、误用力量" },
  { name: "宝剑二", code: "s02", up: "僵局、回避、两难、暂时平衡", rev: "做出抉择、走出僵局、真相揭露" },
  { name: "宝剑三", code: "s03", up: "心碎、悲伤、背叛、痛苦真相", rev: "走出伤痛、宽恕、疗愈开始" },
  { name: "宝剑四", code: "s04", up: "休整、静养、暂停、内在沉淀", rev: "苏醒、恢复、重新投入" },
  { name: "宝剑五", code: "s05", up: "冲突、失利、逞强、两败俱伤", rev: "化解、退让、修复关系" },
  { name: "宝剑六", code: "s06", up: "过渡、离开、驶向平静、疗愈之旅", rev: "滞留、难以脱身、旧伤未愈" },
  { name: "宝剑七", code: "s07", up: "谋略、独行、暗中行事、取巧", rev: "坦白、良心发现、计谋败露" },
  { name: "宝剑八", code: "s08", up: "受限、自缚、困境、无力感", rev: "挣脱束缚、突破限制、释放" },
  { name: "宝剑九", code: "s09", up: "焦虑、恐惧、噩梦、忧思过度", rev: "走出焦虑、释怀、看见希望" },
  { name: "宝剑十", code: "s10", up: "终结、谷底、彻底了结、痛苦到头", rev: "缓慢复原、触底反弹、放下" },
  { name: "宝剑侍从", code: "s11", up: "敏锐的使者、警觉、直言、观察", rev: "刻薄、多疑、口舌是非" },
  { name: "宝剑骑士", code: "s12", up: "果决、直率、冲锋、雷厉风行", rev: "鲁莽、好斗、急于求成" },
  { name: "宝剑王后", code: "s13", up: "理性、独立、明辨、就事论事", rev: "冷漠、苛刻、孤高" },
  { name: "宝剑国王", code: "s14", up: "权威、理智、公正、原则", rev: "专断、冷酷、以理压人" },
  { name: "钱币王牌", code: "p01", up: "新机会、务实起步、财源、丰盛种子", rev: "错失良机、贪财、根基不稳" },
  { name: "钱币二", code: "p02", up: "平衡、灵活应对、多头兼顾、周转", rev: "失衡、手忙脚乱、入不敷出" },
  { name: "钱币三", code: "p03", up: "协作、技艺、精进、团队认可", rev: "各自为政、马虎、缺乏配合" },
  { name: "钱币四", code: "p04", up: "守成、稳固、掌控、安全感", rev: "过度紧握、吝啬、患得患失" },
  { name: "钱币五", code: "p05", up: "匮乏、困顿、失援、身心受困", rev: "走出困境、援手出现、复元" },
  { name: "钱币六", code: "p06", up: "给予与接受、慷慨、资源流动、施与", rev: "施舍不均、债务、附带条件" },
  { name: "钱币七", code: "p07", up: "耕耘、等待、评估、长线投入", rev: "急功近利、投入无果、焦躁" },
  { name: "钱币八", code: "p08", up: "专注、勤勉、精进技艺、积累", rev: "敷衍、停滞、只顾眼前" },
  { name: "钱币九", code: "p09", up: "丰足、独立、自给、优雅从容", rev: "依赖、挥霍、表面光鲜" },
  { name: "钱币十", code: "p10", up: "富足、传承、家业、长久稳固", rev: "家财纠纷、短视、根基动摇" },
  { name: "钱币侍从", code: "p11", up: "务实的使者、好消息、勤学、脚踏实地", rev: "懒散、拖延、纸上谈兵" },
  { name: "钱币骑士", code: "p12", up: "踏实、可靠、坚持、稳步推进", rev: "刻板、保守、进展迟缓" },
  { name: "钱币王后", code: "p13", up: "务实、丰盛、持家、安稳滋养", rev: "过度务实、占有欲、忽视情感" },
  { name: "钱币国王", code: "p14", up: "富足、事业有成、稳健、掌控资源", rev: "贪婪、固执、以财自重" },
];

function tarotImg(code) {
  return `https://raw.githubusercontent.com/metabismuth/tarot-json/master/cards/${code}.jpg`;
}

const TAROT_MEANINGS = TAROT_DECK.reduce((acc, c) => {
  acc[c.name] = { up: c.up, rev: c.rev };
  return acc;
}, {});

const TAROT_SPREADS = {
  single: { label: "直取核心 · 单张", group: "基础", positions: ["核心指引"] },
  overall: { label: "整体运势 · 三张", group: "基础", positions: ["现状", "阻碍/助力", "走向"] },
  year: { label: "年运概览 · 四张", group: "基础", positions: ["当前基调", "机遇所在", "需留意的挑战", "整体建议"] },
  love: { label: "感情 · 三张", group: "情感关系", positions: ["你的状态", "对方的状态", "两人走向"] },
  reunion: { label: "复合 · 四张", group: "情感关系", positions: ["你的心意", "对方的心意", "阻碍", "复合可能"] },
  relationship: { label: "关系深度 · 五张", group: "情感关系", positions: ["你在关系中的状态", "对方在关系中的状态", "关系的根基", "当下的挑战", "关系的走向"] },
  wealth: { label: "财运 · 三张", group: "事业财运", positions: ["当前财运", "机会所在", "需注意"] },
  career: { label: "事业 · 三张", group: "事业财运", positions: ["当前处境", "关键因素", "发展趋向"] },
  study: { label: "学业考试 · 三张", group: "事业财运", positions: ["当前状态", "关键阻碍", "结果趋向"] },
  choice: { label: "二选一 · 四张", group: "决策辅助", positions: ["选项A", "选项B", "你的真实心意", "综合建议"] },
  decision: { label: "决策十字 · 五张", group: "决策辅助", positions: ["当前处境", "面临的挑战", "内在根基/过去影响", "近期发展", "最终结果"] },
  health: { label: "身心调理 · 三张", group: "其他", positions: ["当前身心状态", "需留意之处", "调理方向"] },
};

const T = {
  canvas: "#151210",
  card: "#211D18",
  card2: "#1C1915",
  card3: "#2A251E",
  coffee: "#0E0B08",
  coffeeDeep: "#0A0806",
  ink: "#F3E8D2",
  ink2: "#E4D5B8",
  ink3: "#D8C7A6",
  inkSub: "#A89377",
  monoLabel: "#8A7355",
  gold: "#C9A15A",
  goldTxt: "#D9B978",
  goldLt: "#E4C989",
  goldLt2: "#B8894A",
  goldBg: "#2E2415",
  jade: "#5FB88A",
  jadeBg: "#16241C",
  jadeBd: "#2C4A3A",
  verm: "#D9705F",
  vermBg: "#2A1815",
  line: "#332C22",
  line2: "#3A3226",
  cream: "#241F18",
  creamDim: "#5A4E3C",
};

/* ---------------- 干支算法 ---------------- */

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const JIEQI_BOUNDS = [
  { m: 2, d: 4 }, { m: 3, d: 6 }, { m: 4, d: 5 }, { m: 5, d: 6 },
  { m: 6, d: 6 }, { m: 7, d: 7 }, { m: 8, d: 8 }, { m: 9, d: 8 },
  { m: 10, d: 8 }, { m: 11, d: 7 }, { m: 12, d: 7 }, { m: 1, d: 6 },
];

function mod(n, m) { return ((n % m) + m) % m; }

function parsePositiveInts(str) {
  return ((str || "").match(/-?[0-9]+/g) || [])
    .filter((s) => !s.startsWith("-") && s.length <= 15)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= Number.MAX_SAFE_INTEGER);
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

const { Solar: LSolar, Lunar: LLunar, LunarYear: LLunarYearClass, LunarMonth: LLunarMonthClass } = (function () {
  const base = LunarLib.default || LunarLib;
  return { Solar: base.Solar, Lunar: base.Lunar, LunarYear: base.LunarYear, LunarMonth: base.LunarMonth };
})();

function getLunarLeapMonth(lunarYear) {
  try {
    return LLunarYearClass.fromYear(Number(lunarYear)).getLeapMonth();
  } catch (e) {
    return 0;
  }
}

function daysInSolarMonth(year, month) {
  const y = Number(year), m = Number(month);
  if (!y || !m || m < 1 || m > 12) return 31;
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function daysInLunarMonth(year, month, isLeap) {
  const y = Number(year), m = Number(month);
  if (!y || !m || m < 1 || m > 12) return 30;
  try {
    const lm = LLunarMonthClass.fromYm(y, isLeap ? -m : m);
    return lm ? lm.getDayCount() : 0;
  } catch (e) {
    return 0;
  }
}

function validateBaziInputs(inputs) {
  const year = Number(inputs.year);
  const month = Number(inputs.month);
  const day = Number(inputs.day);

  if (!Number.isInteger(year) || year < 1 || year > 9999) throw new Error("出生年份不对，请重新选择");
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("出生月份不对，请重新选择");
  if (!Number.isInteger(day) || day < 1) throw new Error("出生日期不对，请重新选择");

  const maxDay = inputs.calendar === "lunar"
    ? daysInLunarMonth(year, month, !!inputs.isLeapMonth)
    : daysInSolarMonth(year, month);
  if (!Number.isFinite(maxDay) || maxDay <= 0) throw new Error(`${year}年${inputs.isLeapMonth ? "闰" : ""}${month}月不存在，请重新选择`);
  if (day > maxDay) throw new Error(`${inputs.calendar === "lunar" ? "农历" : ""}${month}月只有${maxDay}天，请重新选择日期`);

  if (!inputs.hourUnknown) {
    const hour = inputs.hour === "" || inputs.hour == null ? 12 : Number(inputs.hour);
    const minute = inputs.minute === "" || inputs.minute == null ? 0 : Number(inputs.minute);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("出生时辰不对，请重新选择");
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error("出生分钟不对，请重新选择");
  }
}

function computeBaziPrecise(inputs) {
  validateBaziInputs(inputs);

  const hour = inputs.hourUnknown ? 12 : (inputs.hour != null && inputs.hour !== "" ? Number(inputs.hour) : 12);
  const minute = inputs.hourUnknown ? 0 : (inputs.minute != null && inputs.minute !== "" ? Number(inputs.minute) : 0);

  let lunar;
  try {
    if (inputs.calendar === "lunar") {
      const m = inputs.isLeapMonth ? -Math.abs(Number(inputs.month)) : Math.abs(Number(inputs.month));
      lunar = LLunar.fromYmdHms(Number(inputs.year), m, Number(inputs.day), hour, minute, 0);
    } else {
      const solar = LSolar.fromYmdHms(Number(inputs.year), Number(inputs.month), Number(inputs.day), hour, minute, 0);
      lunar = solar.getLunar();
    }
  } catch (e) {
    throw new Error("出生日期/时间不合法，请检查后重新填写");
  }

  const eightChar = lunar.getEightChar();
  const solarOut = lunar.getSolar();

  const pillars = {
    year: eightChar.getYear(),
    month: eightChar.getMonth(),
    day: eightChar.getDay(),
    hour: inputs.hourUnknown ? null : eightChar.getTime(),
  };

  const naYin = {
    year: eightChar.getYearNaYin(),
    month: eightChar.getMonthNaYin(),
    day: eightChar.getDayNaYin(),
    hour: inputs.hourUnknown ? null : eightChar.getTimeNaYin(),
  };

  function buildYun(genderCode) {
    const yun = eightChar.getYun(genderCode, 1);
    const list = yun.getDaYun(9).map((d) => ({
      index: d.getIndex(),
      ganzhi: d.getGanZhi(),
      startYear: d.getStartYear(),
      endYear: d.getEndYear(),
      startAge: d.getStartAge(),
      endAge: d.getEndAge(),
    }));
    return {
      forward: yun.isForward(),
      startYear: yun.getStartYear(),
      startMonth: yun.getStartMonth(),
      startDay: yun.getStartDay(),
      startSolar: yun.getStartSolar().toYmd(),
      list,
    };
  }

  let dayun;
  let genderNote = "";
  if (inputs.gender === "male" || inputs.gender === "female") {
    dayun = buildYun(inputs.gender === "male" ? 1 : 0);
  } else {
    dayun = { unknownGender: true, male: buildYun(1), female: buildYun(0) };
    genderNote = "性别未填，大运顺逆排方向无法确定，下面同时列出按男命、按女命两种排法，仅供参考。";
  }

  return {
    pillars,
    naYin,
    lunarText: lunar.toString(),
    solarText: solarOut.toYmd(),
    hourUnknown: !!inputs.hourUnknown,
    gender: inputs.gender,
    dayun,
    genderNote,
  };
}

const SHICHEN_GROUPS = {
  ziwumaoyou: {
    label: "子午卯酉组",
    branches: ["子", "午", "卯", "酉"],
    appearance: "方圆脸型、仰睡为主、发旋居中、小指尖超过无名指最上关节横纹",
    personality: "性子直、心思外露，兄弟姐妹排行通常靠前或人数较多（口诀：子午卯酉兄弟多）",
  },
  yinshensihai: {
    label: "寅申巳亥组",
    branches: ["寅", "申", "巳", "亥"],
    appearance: "长脸型、侧睡为主、发旋偏向一侧、小指尖与无名指最上关节横纹基本齐平",
    personality: "心思敏感、外柔内动，兄弟姐妹排行居中（口诀：寅申巳亥两三位）",
  },
  chenxuchouwei: {
    label: "辰戌丑未组",
    branches: ["辰", "戌", "丑", "未"],
    appearance: "脸型方中带圆、不规则、趴睡为主、双旋或明显偏旋、小指尖不及无名指最上关节横纹",
    personality: "性子沉、独立性强，多为独生或与其他排行不同的孩子（口诀：辰戌丑未独一个）",
  },
};

const SHICHEN_HOUR_MAP = { 子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };
function buildShichenCandidates(calendar, year, month, day, isLeapMonth, branches, gender) {
  return branches.map((branch) => {
    const hour = SHICHEN_HOUR_MAP[branch];
    const result = computeBaziPrecise({ calendar, year, month, day, isLeapMonth, hour, minute: 0, hourUnknown: false, gender });
    return { branch, hour, result };
  });
}

const JIEQI_24 = [
  { name: "小寒", m: 1, d: 6 }, { name: "大寒", m: 1, d: 20 },
  { name: "立春", m: 2, d: 4 }, { name: "雨水", m: 2, d: 19 },
  { name: "惊蛰", m: 3, d: 6 }, { name: "春分", m: 3, d: 21 },
  { name: "清明", m: 4, d: 5 }, { name: "谷雨", m: 4, d: 20 },
  { name: "立夏", m: 5, d: 6 }, { name: "小满", m: 5, d: 21 },
  { name: "芒种", m: 6, d: 6 }, { name: "夏至", m: 6, d: 21 },
  { name: "小暑", m: 7, d: 7 }, { name: "大暑", m: 7, d: 23 },
  { name: "立秋", m: 8, d: 8 }, { name: "处暑", m: 8, d: 23 },
  { name: "白露", m: 9, d: 8 }, { name: "秋分", m: 9, d: 23 },
  { name: "寒露", m: 10, d: 8 }, { name: "霜降", m: 10, d: 23 },
  { name: "立冬", m: 11, d: 7 }, { name: "小雪", m: 11, d: 22 },
  { name: "大雪", m: 12, d: 7 }, { name: "冬至", m: 12, d: 22 },
];

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

const QIMEN_CLASSICS = ["《奇门遁甲统宗大全》", "《遁甲演义》（明·程道生）", "《御定奇门宝鉴》", "《开门之悟》（张志春）"];
const LIUREN_CLASSICS = ["《小六壬基础与技法》", "《易经开悟》（煜燊）", "《小六壬入门通解》", "《五行大义》（隋·萧吉）"];
const BAZI_CLASSICS = ["《三命通会》", "《渊海子平》", "《穷通宝鉴》", "《子平真诠》", "《滴天髓》"];
const MEIHUA_CLASSICS = ["《梅花易数》", "《梅花心易疏证》", "《周易尚氏学》", "《皇极经世书解》"];
const LIUYAO_CLASSICS = ["《古筮真诠》", "《增删卜易》", "《卜筮正宗》", "《黄金策》"];
const TAROT_CLASSICS = ["《塔罗葵花宝典》", "《其实你已经很塔罗了》", "《78度的智慧》"];

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

function getYuanIndex(date) {
  for (let back = 0; back < 10; back++) {
    const d = new Date(date);
    d.setDate(d.getDate() - back);
    const { stemIdx, branchIdx } = getDayGanZhi(d);
    if (stemIdx === 0 || stemIdx === 5) {
      const r = mod(branchIdx, 3);
      if (r === 0) return 0;
      if (r === 2) return 1;
      return 2;
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

const PALACE_NAMES = { 1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中", 6: "乾", 7: "兑", 8: "艮", 9: "离" };
const DIPAN_STARS = { 1: "天蓬", 2: "天芮", 3: "天冲", 4: "天辅", 5: "天禽", 6: "天心", 7: "天柱", 8: "天任", 9: "天英" };
const DIPAN_DOORS = { 1: "休门", 2: "死门", 3: "伤门", 4: "杜门", 6: "开门", 7: "惊门", 8: "生门", 9: "景门" };
const SIX_YI_SAN_QI = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
const XUN_SHOU_TO_YI = { 子: "戊", 戌: "己", 申: "庚", 午: "辛", 辰: "壬", 寅: "癸" };

function wrapPalace(p) { return mod(p - 1, 9) + 1; }

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

function getHourInfo(date) {
  const ref = Date.UTC(1900, 0, 31, 12);
  const cur = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const dayOffset = Math.round((cur - ref) / 86400000);
  const hourBranchIdx = mod(Math.floor((date.getHours() + 1) / 2), 12);
  const idx = mod(dayOffset * 12 + hourBranchIdx, 60);
  const stemIdx = mod(idx, 10);
  const branchIdx = mod(idx, 12);
  const xunShouIdx = idx - stemIdx;
  const xunShouBranchIdx = mod(xunShouIdx, 12);
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    text: STEMS[stemIdx] + BRANCHES[branchIdx],
    xunShouBranch: BRANCHES[xunShouBranchIdx],
    stepsInXun: stemIdx,
  };
}

function computeQimenFull(date) {
  const juInfo = computeQimenJu(date);
  const dir = juInfo.dunType === "阳遁" ? 1 : -1;
  const { stemToPalace } = layoutDiPan(juInfo.dunType, juInfo.ju);
  const hourInfo = getHourInfo(date);

  const xunYi = XUN_SHOU_TO_YI[hourInfo.xunShouBranch];
  const baseGong = stemToPalace[xunYi];
  const zhiFuStar = DIPAN_STARS[baseGong];
  const zhiShiDoor = DIPAN_DOORS[baseGong] || DIPAN_DOORS[2];

  const zhiFuGong = hourInfo.stem === "甲" ? baseGong : stemToPalace[hourInfo.stem];

  let zhiShiGong = baseGong;
  for (let s = 0; s < hourInfo.stepsInXun; s++) zhiShiGong = wrapPalace(zhiShiGong + dir);
  const jiGong = juInfo.dunType === "阳遁" ? 8 : 2;
  const zhiShiDisplayGong = zhiShiGong === 5 ? jiGong : zhiShiGong;

  const shiGanGong = hourInfo.stem === "甲" ? baseGong : stemToPalace[hourInfo.stem];
  const fullPan = buildQimenNineGong({
    stemToPalace, dir, baseGong,
    shiGanGong,
    zhiShiRawGong: zhiShiDisplayGong,
  });

  return {
    ...juInfo,
    dir,
    diPan: stemToPalace,
    hourInfo,
    xunYi,
    baseGong,
    zhiFuStar,
    zhiFuGong: shiGanGong === 5 ? 2 : shiGanGong,
    zhiShiDoor,
    zhiShiGong: zhiShiDisplayGong,
    fullPan,
  };
}

const QM_STAR_HOME = { 1: "天蓬", 2: "天芮", 3: "天冲", 4: "天辅", 5: "天禽", 6: "天心", 7: "天柱", 8: "天任", 9: "天英" };
const QM_DOOR_HOME = { 1: "休门", 2: "死门", 3: "伤门", 4: "杜门", 6: "开门", 7: "惊门", 8: "生门", 9: "景门" };
const QM_GONG_WX = { 1: "水", 2: "土", 3: "木", 4: "木", 5: "土", 6: "金", 7: "金", 8: "土", 9: "火" };
const QM_STAR_ORBIT = [1, 2, 4, 8, 7, 6, 9, 3];
const QM_DOOR_ORBIT = [1, 6, 7, 2, 9, 4, 3, 8];
const QM_RING = [1, 8, 3, 4, 9, 2, 7, 6];
const QM_GODS = ["值符", "腾蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"];

function buildQimenNineGong({ stemToPalace, dir, baseGong, shiGanGong, zhiShiRawGong }) {
  const palaceToStem = {};
  Object.entries(stemToPalace).forEach(([stem, g]) => { palaceToStem[g] = stem; });
  const norm = (g) => (g === 5 ? 2 : g);

  const star = {}, tian = {};
  const starShift = mod(QM_STAR_ORBIT.indexOf(norm(shiGanGong)) - QM_STAR_ORBIT.indexOf(norm(baseGong)), 8);
  for (const home of QM_STAR_ORBIT) {
    const dst = QM_STAR_ORBIT[mod(QM_STAR_ORBIT.indexOf(home) + starShift, 8)];
    star[dst] = QM_STAR_HOME[home];
    let tg = palaceToStem[home];
    if (home === 2 && !tg) tg = palaceToStem[5];
    tian[dst] = tg || "";
  }
  const door = {};
  const doorShift = mod(QM_DOOR_ORBIT.indexOf(norm(zhiShiRawGong)) - QM_DOOR_ORBIT.indexOf(norm(baseGong)), 8);
  for (const home of QM_DOOR_ORBIT) {
    const dst = QM_DOOR_ORBIT[mod(QM_DOOR_ORBIT.indexOf(home) + doorShift, 8)];
    door[dst] = QM_DOOR_HOME[home];
  }
  const god = {};
  const iZ = QM_RING.indexOf(norm(shiGanGong));
  for (let k = 0; k < 8; k++) god[QM_RING[mod(iZ + k, 8)]] = QM_GODS[k];

  const zhiFuDisp = norm(shiGanGong);
  const zhiShiDisp = norm(zhiShiRawGong);
  const gongs = {};
  for (let g = 1; g <= 9; g++) {
    if (g === 5) {
      gongs[5] = { gong: 5, name: "中", wx: "土", diStem: palaceToStem[5] || "", tianStem: "", star: "天禽", door: "", god: "", isZhiFu: false, isZhiShi: false };
      continue;
    }
    gongs[g] = {
      gong: g,
      name: PALACE_NAMES[g],
      wx: QM_GONG_WX[g],
      diStem: palaceToStem[g] || "",
      tianStem: tian[g] || "",
      star: star[g] || "",
      door: door[g] || "",
      god: god[g] || "",
      isZhiFu: g === zhiFuDisp,
      isZhiShi: g === zhiShiDisp,
    };
  }
  return gongs;
}

const SIX_PALACES = ["大安", "留连", "速喜", "赤口", "小吉", "空亡"];

const SIX_PALACE_INFO = {
  大安: { wuxing: "木", liuqin: "父母", liushen: "青龙", star: "福星（木曜）", fangwei: "东方", renwu: "尊长、领导、老成之人", shenti: "肝胆、四肢", yingqi: "事已成形，宜静不宜动，主稳、主迟、主安" },
  留连: { wuxing: "木", liuqin: "兄弟", liushen: "勾陈", star: "计都（缠绕星）", fangwei: "东南", renwu: "同辈、朋友，牵缠之人", shenti: "肝胆、筋络", yingqi: "事未有定论，反复拖延、纠缠不清，宜缓图不宜急进" },
  速喜: { wuxing: "火", liuqin: "子孙", liushen: "朱雀", star: "喜神（火曜）", fangwei: "南方", renwu: "晚辈、小孩、报信之人", shenti: "心、目", yingqi: "喜讯速至，吉利迅速，问事宜速断速行" },
  赤口: { wuxing: "金", liuqin: "官鬼", liushen: "白虎", star: "官符（金曜）", fangwei: "西方", renwu: "是非人、外人、执法者", shenti: "肺、口舌", yingqi: "口舌是非，易有争讼破财，宜忍让、防小人" },
  小吉: { wuxing: "水", liuqin: "妻财", liushen: "六合", star: "天贵（水曜）", fangwei: "北方", renwu: "女性、朋友、贵人", shenti: "肾、耳", yingqi: "和合有情，小有财喜，多有贵人相助" },
  空亡: { wuxing: "土", liuqin: "（诸事落空，不主六亲）", liushen: "玄武", star: "空亡星（土曜）", fangwei: "中央", renwu: "僧道、孤寡之人", shenti: "脾胃", yingqi: "落空虚耗，迟滞不吉，谋事难成，宜静候勿躁进" },
};

function computeXiaoLiuRen(lunarMonth, lunarDay, hour) {
  if (!Number.isFinite(lunarMonth) || !Number.isFinite(lunarDay) || !Number.isFinite(hour)) {
    throw new Error("起课数据不对，请重新填写");
  }
  const hourNum = mod(Math.floor((hour + 1) / 2), 12) + 1;
  const monthIdx = mod(lunarMonth - 1, 6);
  const dayIdx = mod(monthIdx + (lunarDay - 1), 6);
  const selfIdx = mod(dayIdx + (hourNum - 1), 6);
  const selfBranchIdx = mod(hourNum - 1, 12);
  const palace = SIX_PALACES[selfIdx];
  return { palace, hourNum, info: SIX_PALACE_INFO[palace], selfIdx, dayIdx, selfBranchIdx };
}

const LR_GOD_BY_BRANCH = { 寅: "青龙", 卯: "青龙", 巳: "朱雀", 午: "朱雀", 丑: "勾陈", 辰: "勾陈", 未: "腾蛇", 戌: "腾蛇", 申: "白虎", 酉: "白虎", 亥: "玄武", 子: "玄武" };
const LR_FIVE_STARS = ["木星", "火星", "土星", "金星", "水星", "天空"];
const LR_PALACE_WUXING = { 大安: "木", 留连: "土", 速喜: "火", 赤口: "金", 小吉: "水", 空亡: "土" };
const LR_BRANCH_WX = { 子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水" };

function computeLiurenFullPan(dayIdx, selfIdx, selfBranchIdx) {
  const sheng = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const ke = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
  const palaces = SIX_PALACES.map((name, i) => {
    const off = mod(i - selfIdx, 6);
    const branch = BRANCHES[mod(selfBranchIdx + 2 * off, 12)];
    const branchWx = LR_BRANCH_WX[branch];
    const starOff = mod(i - dayIdx, 6);
    return {
      name, palaceWx: LR_PALACE_WUXING[name],
      branch, branchWx,
      god: LR_GOD_BY_BRANCH[branch],
      star: LR_FIVE_STARS[starOff],
      isSelf: i === selfIdx, isDay: i === dayIdx,
    };
  });
  const selfWx = palaces[selfIdx].branchWx;
  for (const p of palaces) {
    if (p.isSelf) p.qin = "自身";
    else if (p.branchWx === selfWx) p.qin = "兄弟";
    else if (sheng[p.branchWx] === selfWx) p.qin = "父母";
    else if (sheng[selfWx] === p.branchWx) p.qin = "子孙";
    else if (ke[selfWx] === p.branchWx) p.qin = "妻财";
    else p.qin = "官鬼";
  }
  return palaces;
}

/* ---------------- 八卦 / 六十四卦 ---------------- */

const TRIGRAM_BY_BITS = { 0: "坤", 1: "震", 2: "坎", 3: "兑", 4: "艮", 5: "离", 6: "巽", 7: "乾" };
const TRIGRAM_BY_NUM = { 1: "乾", 2: "兑", 3: "离", 4: "震", 5: "巽", 6: "坎", 7: "艮", 8: "坤" };
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

function computeLiuYao(rawLines) {
  const orig = rawLines.map((l) => l.value % 2);
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

function trigramFromNumber(n) {
  const r = mod(n, 8);
  return TRIGRAM_BY_NUM[r === 0 ? 8 : r];
}
function movingLineFromNumber(n) {
  const r = mod(n, 6);
  return r === 0 ? 6 : r;
}

function computeMeihua(numbersStr, now) {
  const nums = parsePositiveInts(numbersStr);
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
    const yNum = bz.yearBranchIdx + 1;
    const mNum = getSolarMonthIndex(now) + 1;
    const dNum = now.getDate();
    const hNum = mod(Math.floor((now.getHours() + 1) / 2), 12) + 1;
    upperName = trigramFromNumber(yNum + mNum + dNum);
    lowerName = trigramFromNumber(yNum + mNum + dNum + hNum);
    movePos = movingLineFromNumber(yNum + mNum + dNum + hNum);
    method = `时间起卦（阳历干支变体）：年支${yNum}＋节气月${mNum}＋日${dNum}＝上卦(${upperName})，再加时辰${hNum}＝下卦(${lowerName})，同数取动爻`;
  }

  const lines = [...trigramLines(lowerName), ...trigramLines(upperName)];
  const ben = hexFromLines(lines);

  const changed = [...lines];
  changed[movePos - 1] = 1 - changed[movePos - 1];
  const bian = hexFromLines(changed);

  const huLines = [lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]];
  const hu = hexFromLines(huLines);

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

function drawTarot(count) {
  const pool = [...TAROT_DECK];
  const drawn = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const card = pool.splice(idx, 1)[0];
    drawn.push({ card: card.name, code: card.code, reversed: Math.random() < 0.5 });
  }
  return drawn;
}

function drawTarotByNumbers(nums, count) {
  const drawn = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let n = nums[i] != null ? nums[i] : nums.reduce((a, b) => a + b, i + 1);
    if (!Number.isFinite(n)) n = i + 1;
    let idx = mod(n - 1, TAROT_DECK.length);
    let guard = 0;
    while (used.has(idx) && guard < TAROT_DECK.length) { idx = mod(idx + 1, TAROT_DECK.length); guard++; }
    used.add(idx);
    const card = TAROT_DECK[idx];
    if (!card) continue;
    const reversed = n % 2 === 0;
    drawn.push({ card: card.name, code: card.code, reversed });
  }
  return drawn;
}

/* ---------------- 对话提示词 ---------------- */

const CHAT_STYLE = `你是一位懂传统术数、又特别会跟普通人聊天的解读师。不要给自己起名字、也不要自称任何称号，就自然地跟对方对话即可。你的说话风格：
- 用大白话、口语化中文，像微信上跟朋友聊天一样，别端着、别掉书袋。
- 每次回答简短一些（一般 3~6 句话），这是连续对话，不用一次把话说尽，用户会追问。
- 出现专业术语（某个宫、某个卦、某颗星、某个门）时，顺带用半句话解释它是什么、代表什么，别只甩术语。
- 语气温和、给人鼓励，不用"绝对""一定""必然"这种把话说死的词。
- 严禁使用星号（*）符号来做加粗、强调或列表符号！排版时请直接使用普通的中文标点与换行，切勿出现任何星号字符！
- 少用"吉凶祸福""气运流转"这类空泛古文腔，多讲生活里的具体场景。
- 如果用户的问题信息不够（比如没说清问的是谁、什么事），可以先反问一句确认，再断。
- 全程围绕下面这一个已经起好的局面来聊，不要重新起局或改变盘面数据。
- 语气要自然亲切、有温度，别僵硬、别像念稿。拒绝任何请求时都客气柔和，别硬邦邦地怼回去。
- 如果遇到涉及赌博下注、买彩票、猜球赛比分这类问题，不要生硬拒绝或说教——可以顺着卦象聊聊这件事的成败态势、顺逆倾向、谁占优，但不要给出具体的下注号码、确切比分、买哪一注这种明确指向，也温和提醒一句这类事有风险、要理性、后果自负。
- 如果用户发来图片（聊天截图、生活照、手相面相等），结合图片内容和当前卦象一起分析当下情况；对图片里的信息就事论事地讲，涉及相术时说明仅供参考、不下绝对结论。`;

const LEARN_STYLE = `你是一位耐心、亲切的中国传统术数老师，正在一对一教学员入门。教学范围包括：八字（四柱、十神、五行、大运流年）、小六壬（六宫、六神、六亲）、奇门遁甲、梅花易数、六爻、塔罗等。教学要求：
- 用大白话讲，像老师带新手，循序渐进，别一上来堆术语；出现术语必须马上用生活化的例子解释清楚。
- 每次讲一个小知识点就好，讲完可以问一句"这块懂了吗／要不要举个例子"，等学员回应再往下，像真的上课一样有来有回。
- 严禁使用星号（*）符号来做加粗、强调或列表符号！排版时请直接使用普通的中文标点与换行，切勿出现任何星号字符！
- 学员问什么就顺着教什么；如果学员没方向，可以主动给个入门路线（比如学八字先认十天干十二地支→五行生克→排四柱→看十神），让他选从哪学起。
- 鼓励为主，学员答错了温和纠正、给正确解释，别打击。
- 可以留小练习、举实际例子帮助理解。
- 只讲知识、教方法，不要给某个具体的人算命或下吉凶断语——这是教学，不是问卜。
- 语气自然口语，别端着，回答别太长，一次一个重点，方便学员消化。`;

function buildCastContext(systemId, extra) {
  switch (systemId) {
    case "liuren": {
      const dayLabel = extra.isReportedDay ? `随口报数 ${extra.lunarDay}（代入「日」）` : `农历 ${extra.lunarDay} 日`;
      const panText = (extra.pan || [])
        .map((p) => `${p.name}宫[宫${p.palaceWx}·天盘${p.star}]装${p.branch}(${p.branchWx})六神${p.god}为${p.qin}${p.isSelf ? "（自身/时）" : p.isDay ? "（日）" : ""}`)
        .join("；");
      return (
        `【本局背景·小六壬（完整六宫盘）】已按农历 ${extra.lunarMonth} 月、${dayLabel}、第${extra.hourNum}个时辰掐指起课，自身落于「${extra.palace}」宫。全程依据此盘来聊，不要改变盘面、不要重新起课。\n` +
        `六宫全盘：${panText}。\n` +
        `断法要求：以自身宫「${extra.palace}」为体，结合各宫的六神、天盘星、装地支五行、六亲，按「问什么事就重点看对应六亲所落之宫」来断——问感情看妻财/官鬼、问长辈文书看父母、问财看妻财、问子女晚辈看子孙、问同辈竞争看兄弟，再参看该宫六神与宫位五行的生克关系。用大白话讲清楚每个对应指什么，不要只甩一个孤零零的宫名。断法参酌 ${LIUREN_CLASSICS.slice(0, 4).join("、")} 等传统技法。`
      );
    }
    case "bazi": {
      const r = extra.baziResult;
      const p = r.pillars;
      const hourLine = r.hourUnknown ? "时柱：未知（出生时间不确定，此柱与起运时间只作参考）" : `时柱：${p.hour}`;
      let dayunLines;
      if (r.dayun.unknownGender) {
        const fmt = (yun) => yun.list.slice(0, 6).map((d) => d.index === 0 ? `（起运前，约至${d.endYear}年/${d.endAge}岁）` : `${d.ganzhi}(${d.startYear}-${d.endYear}年，${d.startAge}-${d.endAge}岁)`).join("、");
        dayunLines = `${r.genderNote}\n按男命顺逆推：${fmt(r.dayun.male)}\n按女命顺逆推：${fmt(r.dayun.female)}`;
      } else {
        const fmt = r.dayun.list.slice(0, 8).map((d) => d.index === 0 ? `（起运前，约至${d.endYear}年/${d.endAge}岁）` : `${d.ganzhi}(${d.startYear}-${d.endYear}年，${d.startAge}-${d.endAge}岁)`).join("、");
        dayunLines = `大运${r.dayun.forward ? "顺排" : "逆排"}，约${r.dayun.startYear}岁起运：${fmt}`;
      }
      const placeLine = (extra.birthPlace || extra.currentPlace)
        ? `\n出生地：${extra.birthPlace || "未填"}；现居地：${extra.currentPlace || "未填"}（仅作背景参考，未做真太阳时校正）。`
        : "";
      let nowLine = "";
      try {
        const nUtc = Date.now() + (new Date().getTimezoneOffset() + 480) * 60000;
        const cn = new Date(nUtc);
        const cyGZ = STEMS[mod(cn.getFullYear() - 4, 10)] + BRANCHES[mod(cn.getFullYear() - 4, 12)];
        const cur = computeBazi(cn);
        const by = r.solarText ? parseInt(String(r.solarText).slice(0, 4), 10) : null;
        const age = by ? (cn.getFullYear() - by + 1) : null;
        nowLine = `\\n【当前时间参照，直接用、不要反问用户】今天${cn.getFullYear()}年${cn.getMonth() + 1}月${cn.getDate()}日，流年${cyGZ}，当前流月干支约${cur.month}${age ? `，此人现约${age}虚岁` : ""}。聊到今年/最近/现在就用这些结合大运流年来推。`;
      } catch (e) {}
      return (
        `【本局背景·八字】已排定四柱：年柱${p.year}　月柱${p.month}　日柱${p.day}　${hourLine}。纳音：年${r.naYin.year}、月${r.naYin.month}、日${r.naYin.day}${r.naYin.hour ? `、时${r.naYin.hour}` : ""}。\n` +
        `${dayunLines}\n` +
        `全程基于这些数据（日主五行、格局、十神、大运流年）来聊，不要改动干支、不要重新排盘。${placeLine}${nowLine}\n` +
        `断法参酌 ${BAZI_CLASSICS.slice(0, 5).join("、")} 等传统命理体系。\n\n` +
        `【八字解读流程——你的第一条回复必须严格按下面几步走，用清晰的小标题分段，内容要详实、有料，不要简略】\n` +
        `第一步「核验往事」：根据此八字的大运流年、十神、神煞，推算此人过去真实可能发生过的事，列出恰好 10 条，按人生阶段分组（童年0-12岁、少年13-18岁、青年19-30岁、成年31岁至今，各阶段分配若干条，合计10条）。每条都要写得具体、有画面感、可核对。切勿使用星号做加粗，使用纯文字！\n` +
        `第一步结束后，必须停下来明确对求测者说：「以上这 10 条，你对照一下自己的经历，准不准？如果有明显不对的地方，请一定及时告诉我（哪条不符、实际是什么情况），我会据此校准，再往下给你完整的八字报告。」——然后就停在这里等用户回应，先不要急着往下给报告。\n` +
        `第二步「过去脉络」：结合用户的反馈，用几句话总结此人过去整体运势走向、点出关键转折大运。\n` +
        `第三步「详细八字报告」：这是重点，要写得充实专业。\n` +
        `第四步「开运调理」：根据喜用神，给出实用的开运建议。\n` +
        `第五步「问所求」：最后主动问求测者下一步想看哪方面。`
      );
    }
    case "qimen":
      return (
        `【本局背景·奇门遁甲】以下为算法精确起出的盘，全程据此聊，不要重新起局：\n` +
        `局：${extra.dunType}${extra.ju}局（节气：${extra.period}，${extra.yuanName}）\n` +
        `地盘：${Object.entries(extra.diPan).map(([stem, gong]) => `${stem}在${gong}宫(${PALACE_NAMES[gong]})`).join("、")}\n` +
        `当前时辰：${extra.hourInfo.text}（旬首：${extra.xunYi}在${extra.baseGong}宫）\n` +
        `值符星：${extra.zhiFuStar}飞临${extra.zhiFuGong}宫(${PALACE_NAMES[extra.zhiFuGong]})；值使门：${extra.zhiShiDoor}行至${extra.zhiShiGong}宫(${PALACE_NAMES[extra.zhiShiGong]})\n` +
        `完整九宫盘：${[1,2,3,4,5,6,7,8,9].map((g)=>{const c=extra.fullPan&&extra.fullPan[g];if(!c)return "";if(g===5)return `中5宫[地盘${c.diStem}·天禽]`;return `${g}宫${c.name}[${c.tianStem}/${c.diStem}·${c.star}·${c.door}·${c.god}]`;}).filter(Boolean).join("；")}。`
      );
    case "meihua":
      return (
        `【本局背景·梅花易数】以下为算法精确起出的卦，全程据此聊，不要重新起卦：\n` +
        `起卦方式：${extra.method}；本卦：${extra.ben.name}（上${extra.upperName}下${extra.lowerName}），第 ${extra.movePos} 爻动；互卦：${extra.hu.name}；变卦：${extra.bian.name}\n` +
        `体用：体卦${extra.ti.name}(${extra.ti.element})，用卦${extra.yong.name}(${extra.yong.element})。`
      );
    case "liuyao":
      return (
        `【本局背景·六爻】以下为算法摇钱成卦的结果，全程据此聊，不要重新排卦：\n` +
        `六爻（初至上）：${extra.raw.map((l, i) => `第${i + 1}爻${l.label}`).join("、")}\n` +
        `本卦：${extra.ben.name}（上${extra.ben.upper}下${extra.ben.lower}）\n` +
        (extra.movingPositions.length
          ? `动爻：第 ${extra.movingPositions.join("、")} 爻；变卦：${extra.bian.name}（上${extra.bian.upper}下${extra.bian.lower}）\n`
          : `六爻皆静，无动爻变卦，以本卦断\n`) +
        (extra.sy ? `世爻在第 ${extra.sy.shi} 爻，应爻在第 ${extra.sy.ying} 爻\n` : "")
      );
    case "tarot":
      return (
        `【本局背景·塔罗】抽牌结果（${extra.spreadLabel}）：\n${extra.cards
          .map(
            (c, i) =>
              `${extra.positions[i] ? extra.positions[i] + "：" : ""}${c.card}（${c.reversed ? "逆位" : "正位"}）——关键词：${
                c.reversed ? TAROT_MEANINGS[c.card].rev : TAROT_MEANINGS[c.card].up
              }`
          )
          .join("\n")}`
      );
    default:
      return "";
  }
}

/* ---------------- 样式 ---------------- */

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
  --base-size:16px;
  --bubble-size:17px;
}
.page{background:var(--canvas);min-height:100vh;color:var(--ink3);font-family:var(--sans);font-size:var(--base-size);line-height:1.85;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px 40px}
.serif{font-family:var(--serif)} .mono{font-family:var(--mono)}
.runbar{display:flex;justify-content:space-between;align-items:center;gap:12px;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mono-label)}
.runbar.top{border-bottom:1px solid var(--line2);padding:12px 0}
.runbar.bot{border-top:1px solid var(--line2);padding:14px 0;margin-top:40px}
.runbar .r{text-align:right}
.kicker{display:flex;align-items:center;gap:14px;font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-txt)}
.kicker .bar{width:34px;height:2px;background:var(--gold);flex:0 0 auto}
.kicker.on-dark{color:var(--gold-lt)} .kicker.on-dark .bar{background:var(--gold-lt)}
.hero{background:var(--coffee);color:var(--cream);border-radius:10px;margin-top:64px;padding:46px 46px 40px;position:relative;overflow:hidden;box-shadow:0 20px 60px -34px rgba(21,17,11,.7)}
.hero-grid{display:grid;grid-template-columns:1fr 300px;gap:40px;align-items:center}
.hero h1{font-family:var(--serif);font-weight:900;color:#FBF3E2;font-size:clamp(44px,6.6vw,72px);line-height:1.05;letter-spacing:.14em;margin:18px 0 12px}
.hero-sub{font-family:var(--sans);font-weight:300;font-size:var(--base-size);color:var(--cream-dim);max-width:460px;line-height:1.85;margin:0}
.htags{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.htag{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#E6D9BF;border:1px solid rgba(216,184,120,.4);border-radius:3px;padding:3px 9px}
.hero-meta{margin-top:26px;padding-top:18px;border-top:1px solid rgba(216,184,120,.22);display:flex;gap:30px;flex-wrap:wrap}
.hmeta .k{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-lt2)}
.hmeta .v{font-family:var(--mono);font-size:14px;color:var(--cream);margin-top:3px}
.hero-wheel{display:flex;justify-content:center}
.section{padding:40px 0 0}
.sec-head{margin:0 0 22px}
.sec-head h2{font-family:var(--serif);font-weight:700;color:var(--ink);font-size:28px;line-height:1.25;margin:13px 0 6px;letter-spacing:.02em}
.sec-head .lead{font-size:var(--base-size);color:var(--ink-sub);max-width:660px;margin:0}
.sys-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line2);border:1px solid var(--line2);border-radius:8px;overflow:hidden}
.sys{background:var(--card);padding:22px 20px;position:relative;cursor:pointer;transition:background .18s;min-height:120px;display:flex;flex-direction:column;text-align:left;border:0;font:inherit;color:inherit;width:100%}
.sys:hover{background:var(--card3)}
.sys .no{font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.12em;color:var(--mono-label)}
.sys .sym{position:absolute;top:16px;right:20px;font-family:var(--serif);font-weight:900;font-size:36px;color:var(--gold-lt);opacity:.55;line-height:1}
.sys .nm{font-family:var(--serif);font-weight:700;font-size:21px;color:var(--ink);margin:14px 0 3px}
.sys .st{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-txt)}
.sys .ds{font-size:calc(var(--base-size) - 1px);color:var(--ink-sub);margin-top:10px;line-height:1.7;flex:1}
.sys .pick{margin-top:12px;font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mono-label)}
.sys.sel{background:var(--coffee)}
.backbar{padding:24px 0 0 60px}
.backbtn{background:var(--card);border:1px solid var(--line2);border-radius:8px;padding:10px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.08em;color:var(--ink-sub);cursor:pointer;transition:background .18s}
.backbtn:hover{background:var(--card3);color:var(--ink)}
.backbtn:disabled{opacity:.45;cursor:not-allowed}
.chat{display:flex;flex-direction:column;gap:14px;margin:6px 0 16px;min-height:120px}
.chat-hint{background:var(--card);border:1px dashed var(--line2);border-radius:10px;padding:16px 18px;color:var(--ink-sub);font-size:var(--base-size);line-height:1.7}
.bazi-start-btn{background:var(--gold);color:#1A1510;border:0;border-radius:10px;padding:12px 22px;font-size:var(--base-size);font-weight:600;cursor:pointer;transition:opacity .18s}
.bubble{max-width:88%;display:flex;flex-direction:column}
.bubble.me{align-self:flex-end;align-items:flex-end}
.bubble.bot{align-self:flex-start;align-items:flex-start}
.bubble-body{padding:14px 18px;border-radius:16px;font-size:var(--bubble-size);line-height:1.9;white-space:pre-wrap;word-break:break-word}
.bubble.me .bubble-body{background:var(--gold-bg);color:var(--ink);border:1px solid var(--gold-lt2);border-bottom-right-radius:5px}
.bubble.bot .bubble-body{background:var(--card3);color:var(--ink3);border:1px solid var(--line2);border-bottom-left-radius:5px}
.bubble-body.typing{color:#C9B896;font-style:normal}
.chat-input{position:sticky;bottom:12px;z-index:5;display:flex;gap:10px;align-items:flex-end;background:var(--card);border:1px solid var(--line2);border-radius:14px;padding:10px 10px 10px 16px;box-shadow:0 6px 24px rgba(58,42,26,.18)}
.chat-box{flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:var(--bubble-size);line-height:1.6;color:var(--ink);resize:none;max-height:140px}
.send-btn{flex:0 0 auto;background:var(--gold);color:#1A1510;border:0;border-radius:10px;padding:11px 20px;font-size:var(--base-size);font-weight:600;cursor:pointer;transition:opacity .18s}
.send-btn:disabled{opacity:.4;cursor:default}
.img-btn{flex:0 0 auto;background:none;border:0;font-size:22px;cursor:pointer;padding:4px 6px;align-self:center}
.bubble-img{max-width:180px;max-height:220px;border-radius:12px;margin-bottom:6px;display:block;object-fit:cover}
.img-preview{display:flex;align-items:center;gap:10px;margin-bottom:8px;background:var(--card);border:1px solid var(--line2);border-radius:12px;padding:8px 10px}
.img-preview img{width:52px;height:52px;object-fit:cover;border-radius:8px}
.img-preview button{background:none;border:1px solid var(--line2);border-radius:8px;color:var(--verm);font-size:12px;padding:5px 10px;cursor:pointer}
.form-card{background:var(--card);border:1px solid var(--line2);border-radius:10px;box-shadow:0 6px 30px rgba(58,42,26,.14);padding:32px 34px}
.flabel{font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-txt);display:block;margin-bottom:7px}
.fgrid{display:grid;grid-template-columns:1.5fr 1fr;gap:22px;align-items:start}
.fin,.selbox{width:100%;background:var(--card2);border:1px solid var(--line2);border-radius:7px;padding:10px 12px;font-family:var(--sans);font-size:var(--base-size);color:var(--ink2);outline:none;box-sizing:border-box}
.spread button{font-family:var(--mono);font-size:12px;letter-spacing:.04em;border-radius:7px;padding:12px 10px;background:var(--card2);border:1px solid var(--line2);color:var(--ink-sub);cursor:pointer}
.spread button.on{background:var(--coffee);color:var(--cream);border-color:var(--coffee)}
.btn{width:100%;background:var(--gold);color:var(--card);border:0;border-radius:7px;padding:13px;font-family:var(--serif);font-weight:700;font-size:16px;letter-spacing:.3em;cursor:pointer}
.btn.ghost{background:transparent;color:var(--gold-txt);border:1px solid var(--gold);box-shadow:none;letter-spacing:.2em;font-size:14px;width:auto;padding:11px 22px}
.errline{font-family:var(--mono);font-size:12px;color:var(--verm);margin:14px 0 0}

/* 固定在右上角的字号调节控件 */
.font-toggle-bar{
  position:fixed;
  top:18px;
  right:18px;
  z-index:60;
  display:flex;
  align-items:center;
  gap:4px;
  background:rgba(23,19,16,0.92);
  border:1px solid var(--gold-lt2);
  border-radius:22px;
  padding:3px 8px;
  box-shadow:0 6px 20px rgba(0,0,0,0.6);
  backdrop-filter:blur(8px);
}
.font-toggle-label{
  font-family:var(--mono);
  font-size:11px;
  color:var(--gold-txt);
  margin-right:2px;
  padding-left:4px;
  user-select:none;
}
.font-btn{
  background:transparent;
  border:0;
  color:var(--ink-sub);
  font-size:12px;
  padding:4px 8px;
  cursor:pointer;
  border-radius:14px;
  font-family:var(--sans);
  transition:all 0.15s;
}
.font-btn.on{
  background:var(--gold-bg);
  color:var(--gold-lt);
  font-weight:bold;
  border:1px solid var(--gold-lt2);
}

/* 固定在左上角的历史记录按钮 */
.hist-toggle{
  position:fixed;
  top:18px;
  left:18px;
  z-index:60;
  width:46px;
  height:46px;
  border-radius:50%;
  background:radial-gradient(circle at 30% 30%,#2A2318,#171310);
  border:1px solid var(--gold-lt2);
  cursor:pointer;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:3.5px;
  box-shadow:0 6px 20px -6px rgba(0,0,0,.6);
  transition:transform .15s,border-color .2s
}
.hist-toggle:hover{transform:scale(1.06);border-color:var(--gold-lt)}
.hist-toggle span{display:block;height:1.5px;background:var(--gold-lt);border-radius:2px;transition:width .2s}
.hist-toggle span:nth-child(1){width:16px}
.hist-toggle span:nth-child(2){width:11px}
.hist-toggle span:nth-child(3){width:16px}

.drawer-mask{position:fixed;inset:0;z-index:70;background:rgba(8,6,4,.6)}
.drawer{position:fixed;top:0;left:0;bottom:0;z-index:71;width:82%;max-width:340px;background:#171310;border-right:1px solid var(--gold-lt2);display:flex;flex-direction:column;box-shadow:8px 0 40px rgba(0,0,0,.5)}
.drawer-head{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 6px;font-family:var(--serif);font-size:18px;color:var(--gold-lt)}
.drawer-x{background:none;border:0;color:var(--ink-sub);font-size:16px;cursor:pointer;padding:4px 6px}
.drawer-sub{padding:0 18px 12px;font-family:var(--mono);font-size:11px;color:var(--ink-sub);border-bottom:1px solid var(--line2)}
.drawer-empty{padding:30px 20px;color:var(--ink-sub);font-size:14px;line-height:1.7}
.drawer-list{flex:1;overflow-y:auto;padding:10px 12px}
.drawer-item{display:flex;align-items:stretch;gap:6px;margin-bottom:8px}
.drawer-item-main{flex:1;min-width:0;text-align:left;background:rgba(42,37,30,.6);border:1px solid var(--line2);border-radius:9px;padding:10px 12px;cursor:pointer}
.drawer-item-sys{font-family:var(--mono);font-size:11px;color:var(--gold-txt);margin-bottom:3px}
.drawer-item-sum{font-size:14px;color:var(--ink2);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.drawer-item-time{font-size:11px;color:var(--ink-sub);margin-top:4px}
.drawer-item-del{flex:0 0 auto;width:30px;background:none;border:1px solid var(--line2);border-radius:9px;color:var(--ink-sub);font-size:12px;cursor:pointer}
.drawer-clear{margin:8px 14px 18px;padding:10px;background:none;border:1px solid var(--line2);border-radius:9px;color:var(--ink-sub);font-size:13px;cursor:pointer}

.intro-screen{position:fixed;inset:0;z-index:100;background:radial-gradient(ellipse at center,#1A1510 0%,#0A0806 100%);display:flex;align-items:center;justify-content:center;cursor:pointer}
.intro-inner{display:flex;flex-direction:column;align-items:center;text-align:center;user-select:none}
.intro-title{font-family:var(--serif);font-weight:900;font-size:42px;letter-spacing:.32em;color:#E4C989;margin-bottom:10px}
.intro-sub{font-family:var(--mono);font-size:13px;letter-spacing:.28em;color:#A89377;margin-bottom:38px}
.intro-hint{font-size:14px;letter-spacing:.2em;color:#C9A15A}

.learn-row{width:100%;display:flex;align-items:center;gap:18px;text-align:left;background:linear-gradient(120deg,#241C10 0%,#1A1611 60%,#15120E 100%);border:1px solid var(--gold-lt2);border-radius:14px;padding:20px 24px;cursor:pointer}
.learn-row-glyph{flex:0 0 auto;width:54px;height:54px;border-radius:12px;border:1px solid var(--gold-lt2);display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:28px;color:var(--gold-lt);background:rgba(201,161,90,.08)}
.learn-row-body{flex:1;min-width:0}
.learn-row-title{font-family:var(--serif);font-weight:700;font-size:20px;color:var(--gold-lt);margin-bottom:5px}
.learn-row-sub{font-size:var(--base-size);color:var(--ink-sub);line-height:1.6}
.learn-row-go{flex:0 0 auto;font-family:var(--mono);font-size:12px;color:var(--gold)}

@media(max-width:520px){
  .wrap{padding:0 14px 30px}
  .sys-grid{grid-template-columns:1fr}
  .font-toggle-label{display:none}
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

function BaguaWheel() {
  const trigrams = ["☰", "☴", "☵", "☶", "☷", "☳", "☲", "☱"];
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
      <circle cx={cx} cy={cy} r="34" fill="#EAD9B5" />
      <path d={`M${cx},${cy - 34} A34,34 0 0 1 ${cx},${cy + 34} A17,17 0 0 1 ${cx},${cy} A17,17 0 0 0 ${cx},${cy - 34} Z`} fill="#2a2013" />
      <circle cx={cx} cy={cy - 17} r="5.5" fill="#2a2013" />
      <circle cx={cx} cy={cy + 17} r="5.5" fill="#EAD9B5" />
      <circle cx={cx} cy={cy} r="34" fill="none" stroke={T.goldLt} strokeOpacity="0.5" strokeWidth="1" />
    </svg>
  );
}

function MiniHex({ raw }) {
  const labels = ["初", "二", "三", "四", "五", "上"];
  const rows = raw.map((l, i) => ({ ...l, lab: labels[i] })).reverse();
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

/* ---------------- 历史记录 ---------------- */

const HISTORY_KEY = "fzt_history_v1";
const HISTORY_LIMIT = 500;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    const cleaned = list.filter((e) => e && Array.isArray(e.messages) && e.messages.length > 0);
    if (cleaned.length !== list.length) saveHistory(cleaned);
    return cleaned;
  } catch (e) {
    return [];
  }
}

function saveHistory(list) {
  const originalLength = list.length;
  let arr = list.slice(0, HISTORY_LIMIT);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
      return { ok: true, shrunk: arr.length < originalLength };
    } catch (e) {
      if (arr.length <= 1) return { ok: false, shrunk: true };
      arr = arr.slice(0, Math.max(1, Math.floor(arr.length * 0.8)));
    }
  }
  return { ok: false, shrunk: true };
}

function fmtHistoryTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function castSummaryFor(systemId, cast) {
  if (!cast) return "";
  switch (systemId) {
    case "bazi": {
      const p = cast.baziResult.pillars;
      return `${p.year} ${p.month} ${p.day} ${p.hour || "时辰未知"}`;
    }
    case "liuren":
      return `落「${cast.palace}」宫`;
    case "meihua":
      return `本卦 ${cast.ben.name}`;
    case "liuyao":
      return `本卦 ${cast.ben.name}${cast.bian ? `，变卦 ${cast.bian.name}` : ""}`;
    case "qimen":
      return `${cast.dunType}${cast.ju}局`;
    case "tarot":
      return cast.spreadLabel || "";
    default:
      return "";
  }
}

// 辅助清洗函数：强行抹掉文本中所有的 * 字符，避免显示为加粗或星号
function removeAsterisks(text) {
  if (typeof text !== "string") return text;
  return text.replace(/\*/g, "");
}

/* ---------------- 主组件 ---------------- */

function AppInner() {
  const [entered, setEntered] = useState(false);
  const [learnMode, setLearnMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [numbers, setNumbers] = useState("");
  const [tarotSpread, setTarotSpread] = useState("overall");
  const [tarotDrawMode, setTarotDrawMode] = useState("random");
  const [tarotNumbers, setTarotNumbers] = useState("");
  const [liurenMode, setLiurenMode] = useState("time");
  const [liurenNumbers, setLiurenNumbers] = useState("");

  // 字体调节：std(14/15), md(16/17), lg(18/19), xl(20/21)
  const [fontSizeKey, setFontSizeKey] = useState("md");

  // 八字资料
  const [baziCalendar, setBaziCalendar] = useState("solar");
  const [baziYear, setBaziYear] = useState("");
  const [baziMonth, setBaziMonth] = useState("");
  const [baziDay, setBaziDay] = useState("");
  const [baziLeapMonth, setBaziLeapMonth] = useState(false);
  const [baziHour, setBaziHour] = useState("");
  const [baziMinute, setBaziMinute] = useState("0");
  const [baziHourUnknown, setBaziHourUnknown] = useState(false);
  const [baziGender, setBaziGender] = useState("");
  const [baziBirthPlace, setBaziBirthPlace] = useState("");
  const [baziCurrentPlace, setBaziCurrentPlace] = useState("");

  const [phase, setPhase] = useState("home");
  const [castContext, setCastContext] = useState("");
  const [castInfo, setCastInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  const [historyList, setHistoryList] = useState(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const currentHistoryRef = useRef(null);

  function upsertHistory(entry) {
    let saveResult = null;
    setHistoryList((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      const next = idx >= 0 ? [...prev.slice(0, idx), entry, ...prev.slice(idx + 1)] : [entry, ...prev];
      if (entry.messages.length > 0) saveResult = saveHistory(next);
      return next;
    });
  }

  function deleteHistoryEntry(id) {
    setHistoryList((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveHistory(next);
      return next;
    });
  }

  function resumeHistory(h) {
    if (loading) return;
    abandonEmptyHistoryEntry();
    if (h.isLearn) {
      setLearnMode(true);
      setSelected(null);
      setCastInfo(null);
      setCastContext("");
    } else {
      setLearnMode(false);
      setSelected(h.systemId);
      setCastInfo(h.castInfo || null);
      setCastContext(h.castContext || "");
    }
    setMessages(Array.isArray(h.messages) ? h.messages : []);
    setError("");
    setInput("");
    setPendingImage(null);
    currentHistoryRef.current = { ...h };
    setPhase("chat");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function abandonEmptyHistoryEntry() {
    const cur = currentHistoryRef.current;
    if (cur && cur.messages.length === 0) {
      deleteHistoryEntry(cur.id);
    }
    currentHistoryRef.current = null;
  }

  const NEEDS_SETUP = { bazi: true, liuren: true, tarot: true, meihua: true };

  function enterLearnMode() {
    if (loading) return;
    abandonEmptyHistoryEntry();
    setLearnMode(true);
    setSelected(null);
    setCastContext("");
    setCastInfo(null);
    const greeting = { role: "assistant", content: "来啦～我可以教你八字、小六壬、奇门、梅花、六爻、塔罗这些。你想先学哪一个？如果还没头绪，我建议从八字入门，要从这儿开始吗？" };
    setMessages([greeting]);
    setInput("");
    setError("");
    setPhase("chat");
    const hid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const historyEntry = {
      id: hid,
      systemId: "learn",
      systemName: "术数课堂",
      isLearn: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      castSummary: "跟AI老师学术数",
      castInfo: null,
      castContext: "",
      messages: [],
    };
    currentHistoryRef.current = historyEntry;
  }

  function exitLearnMode() {
    abandonEmptyHistoryEntry();
    setLearnMode(false);
    setMessages([]);
    setPhase("home");
  }

  function resetForm(id) {
    if (loading) return;
    abandonEmptyHistoryEntry();
    setLearnMode(false);
    setSelected(id);
    setNumbers("");
    setTarotSpread("overall");
    setTarotDrawMode("random");
    setTarotNumbers("");
    setLiurenMode("time");
    setLiurenNumbers("");
    setBaziCalendar("solar");
    setBaziYear("");
    setBaziMonth("");
    setBaziDay("");
    setBaziLeapMonth(false);
    setBaziHour("");
    setBaziMinute("0");
    setBaziHourUnknown(false);
    setBaziGender("");
    setBaziBirthPlace("");
    setBaziCurrentPlace("");
    setCastContext("");
    setCastInfo(null);
    setMessages([]);
    setInput("");
    setError("");
    setLoading(false);
    if (id == null) {
      setPhase("home");
    } else if (NEEDS_SETUP[id]) {
      setPhase("setup");
    } else if (id === "qimen" || id === "liuyao") {
      setPhase("chat");
    } else {
      startCast(id, {});
    }
  }

  function startCast(id, opts) {
    try {
      return doStartCast(id, opts);
    } catch (e) {
      setError(e.message || "起局失败，请检查填写的信息");
      return null;
    }
  }

  function doStartCast(id, opts) {
    setError("");
    const now = new Date();
    let extra = {};
    let cast = null;

    if (id === "bazi") {
      const baziResult = computeBaziPrecise({
        calendar: opts.baziCalendar,
        year: opts.baziYear,
        month: opts.baziMonth,
        day: opts.baziDay,
        isLeapMonth: opts.baziLeapMonth,
        hour: opts.baziHour,
        minute: opts.baziMinute,
        hourUnknown: opts.baziHourUnknown,
        gender: opts.baziGender || "unknown",
      });
      extra.baziResult = baziResult;
      extra.birthPlace = opts.baziBirthPlace;
      extra.currentPlace = opts.baziCurrentPlace;
      const p = baziResult.pillars;
      cast = { type: "bazi", baziResult, text: `${p.year} ${p.month} ${p.day} ${p.hour || "未知"}` };
    } else if (id === "liuren") {
      const lu = getChinaLunarNow();
      const lm = lu.lunarMonth;
      let ld, isReportedDay;
      if (opts.liurenMode === "numbers") {
        const ns = parsePositiveInts(opts.liurenNumbers);
        if (!ns.length) throw new Error("报数起课要报一个数字，不是文字哈");
        ld = ns[0];
        isReportedDay = true;
      } else {
        ld = lu.lunarDay;
        isReportedDay = false;
      }
      const hourForCast = lu.chinaHour;
      const liurenRes = computeXiaoLiuRen(Number(lm), Number(ld), hourForCast);
      const { palace, hourNum, info, dayIdx, selfIdx, selfBranchIdx } = liurenRes;
      const pan = computeLiurenFullPan(dayIdx, selfIdx, selfBranchIdx);
      extra.lunarMonth = Number(lm);
      extra.lunarDay = Number(ld);
      extra.hourNum = hourNum;
      extra.palace = palace;
      extra.info = info;
      extra.pan = pan;
      extra.isReportedDay = isReportedDay;
      extra.mode = isReportedDay ? "报数起课" : "时间起课";
      cast = { type: "liuren", palace, hourNum, info, pan, mode: extra.mode, lunarMonth: lm, lunarDay: ld, isReportedDay };
    } else if (id === "meihua") {
      const mh = computeMeihua(opts.numbers || numbers, now);
      Object.assign(extra, mh);
      cast = { type: "meihua", ...mh };
    } else if (id === "liuyao") {
      const raw = castLiuYao();
      const ly = computeLiuYao(raw);
      extra.raw = raw;
      Object.assign(extra, ly);
      cast = { type: "liuyao", raw, ...ly };
    } else if (id === "tarot") {
      const spreadKey = opts.tarotSpread || tarotSpread;
      const spread = TAROT_SPREADS[spreadKey];
      const count = spread.positions.length;
      let cards;
      if (opts.tarotDrawMode === "numbers") {
        const ns = parsePositiveInts(opts.tarotNumbers);
        if (ns.length < count) throw new Error(`这个牌阵要${count}张牌，还需再报${count - ns.length}个数字哈`);
        cards = drawTarotByNumbers(ns, count);
      } else {
        cards = drawTarot(count);
      }
      extra.cards = cards;
      extra.positions = spread.positions;
      extra.spreadLabel = spread.label;
      cast = { type: "tarot", cards, positions: spread.positions, spreadLabel: spread.label };
    } else if (id === "qimen") {
      const full = computeQimenFull(now);
      Object.assign(extra, full);
      cast = { type: "qimen", ...full };
    }

    const ctx = buildCastContext(id, extra);
    setCastContext(ctx);
    setCastInfo(cast);
    if (!opts.keepMessages) {
      setMessages([]);
      setPhase("chat");
    }

    const hid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const historyEntry = {
      id: hid,
      systemId: id,
      systemName: (SYSTEMS.find((s) => s.id === id) || {}).name || id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      castSummary: castSummaryFor(id, cast),
      castInfo: cast,
      castContext: ctx,
      messages: [],
    };
    currentHistoryRef.current = historyEntry;
    upsertHistory(historyEntry);

    return ctx;
  }

  function handleSetupSubmit() {
    if (selected === "bazi" && (!baziYear || !baziMonth || !baziDay)) {
      setError("先把出生年、月、日填完整哈");
      return;
    }
    if (selected === "bazi" && baziGender !== "male" && baziGender !== "female") {
      setError("请先选择性别（男/女）");
      return;
    }
    startCast(selected, {
      baziCalendar, baziYear, baziMonth, baziDay, baziLeapMonth,
      baziHour, baziMinute, baziHourUnknown, baziGender, baziBirthPlace, baziCurrentPlace,
      liurenMode, liurenNumbers,
      numbers,
      tarotSpread, tarotDrawMode, tarotNumbers,
    });
  }

  function stripOldImages(content) {
    if (!Array.isArray(content)) return removeAsterisks(content);
    const hadImage = content.some((b) => b.type === "image");
    const text = content.filter((b) => b.type === "text").map((b) => removeAsterisks(b.text)).join(" ");
    if (!hadImage) return text;
    return text ? `${text}　[之前发过一张图片]` : "[之前发过一张图片]";
  }

  async function sendMessage(overrideText) {
    const text = removeAsterisks((typeof overrideText === "string" ? overrideText : input).trim());
    if ((!text && !pendingImage) || loading) return;
    setError("");
    setInput("");
    const img = pendingImage;
    setPendingImage(null);

    let effectiveContext = castContext;
    if (!learnMode && (selected === "qimen" || selected === "liuyao") && !castContext) {
      effectiveContext = startCast(selected, { keepMessages: true });
      if (!effectiveContext) {
        setInput(text);
        setPendingImage(img);
        return;
      }
    }

    const apiUserContent = img
      ? [
          ...(text ? [{ type: "text", text }] : [{ type: "text", text: "请结合这张图片和当前卦象，帮我看看。" }]),
          { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } },
        ]
      : text;
    const displayContent = img ? (text ? text + "　[图片]" : "[图片]") : text;

    const apiMessages = [
      ...messages.map((m) => ({ role: m.role, content: stripOldImages(m.contentApi || m.content) })),
      { role: "user", content: apiUserContent },
    ];
    const nextMessages = [...messages, { role: "user", content: displayContent, contentApi: apiUserContent, img: img ? img.dataUrl : null }];
    setMessages(nextMessages);
    setLoading(true);
    persistMessages(nextMessages);

    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: learnMode ? LEARN_STYLE : (CHAT_STYLE + "\n\n" + effectiveContext),
          messages: apiMessages,
        }),
      });
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`后端返回异常（HTTP ${response.status}）：${rawText.slice(0, 160)}`);
      }
      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // 洗掉所有返回文本里的 * 符号
      const cleanReply = removeAsterisks(data.text || "（这一卦一时看不真切，换个说法再问问？）");
      const finalMessages = [...nextMessages, { role: "assistant", content: cleanReply }];
      setMessages(finalMessages);
      persistMessages(finalMessages);
    } catch (e) {
      setError(e.message || "网络出了点问题，再试一次");
    } finally {
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80);
    }
  }

  function handlePickImage(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type)) { setError("请选择图片文件"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const imgEl = new Image();
      imgEl.onload = () => {
        let { width, height } = imgEl;
        if (width > 1280 || height > 1280) {
          const scale = 1280 / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgEl, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        const comma = dataUrl.indexOf(",");
        const data = dataUrl.slice(comma + 1);
        setPendingImage({ dataUrl, mediaType: "image/jpeg", data });
      };
      imgEl.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function persistMessages(msgs) {
    if (!currentHistoryRef.current) return;
    const lastImgIdx = msgs.reduce((acc, m, i) => (m.img ? i : acc), -1);
    const forStorage = msgs.map((m, i) => (m.img && i !== lastImgIdx ? { ...m, img: null } : m));
    currentHistoryRef.current = { ...currentHistoryRef.current, messages: forStorage, updatedAt: Date.now() };
    upsertHistory(currentHistoryRef.current);
  }

  const currentSystem = SYSTEMS.find((s) => s.id === selected);

  // 根据字号状态映射根字体与对话字体
  const fontSizes = {
    std: { base: "14px", bubble: "15px" },
    md: { base: "16px", bubble: "17px" },
    lg: { base: "18px", bubble: "19px" },
    xl: { base: "20px", bubble: "21px" },
  };
  const curSize = fontSizes[fontSizeKey] || fontSizes.md;

  return (
    <div className="page" style={{ "--base-size": curSize.base, "--bubble-size": curSize.bubble }}>
      <style>{DESIGN_CSS}</style>

      {/* 固定右上角字号调节面板 */}
      <div className="font-toggle-bar">
        <span className="font-toggle-label">字号:</span>
        <button className={"font-btn" + (fontSizeKey === "std" ? " on" : "")} onClick={() => setFontSizeKey("std")}>小</button>
        <button className={"font-btn" + (fontSizeKey === "md" ? " on" : "")} onClick={() => setFontSizeKey("md")}>中</button>
        <button className={"font-btn" + (fontSizeKey === "lg" ? " on" : "")} onClick={() => setFontSizeKey("lg")}>大</button>
        <button className={"font-btn" + (fontSizeKey === "xl" ? " on" : "")} onClick={() => setFontSizeKey("xl")}>特大</button>
      </div>

      {!entered && (
        <div className="intro-screen" onClick={() => setEntered(true)}>
          <div className="intro-inner">
            <div className="intro-title">富甲天下</div>
            <div className="intro-sub">AI · 多体系术数问答</div>
            <div className="intro-hint">轻触页面 · 入局</div>
          </div>
        </div>
      )}

      <div className="wrap">
        {/* 固定左上角历史抽屉开关 */}
        {entered && (
          <button className="hist-toggle" onClick={() => setShowHistory(true)} aria-label="历史记录">
            <span></span><span></span><span></span>
          </button>
        )}

        {showHistory && (
          <>
            <div className="drawer-mask" onClick={() => setShowHistory(false)} />
            <aside className="drawer">
              <div className="drawer-head">
                <span>历史记录</span>
                <button className="drawer-x" onClick={() => setShowHistory(false)}>✕</button>
              </div>
              <div className="drawer-sub">仅存本机 · 最多 {HISTORY_LIMIT} 条</div>
              {historyList.length === 0 ? (
                <div className="drawer-empty">还没有记录。起局问卜后，会自动存在这里。</div>
              ) : (
                <div className="drawer-list">
                  {historyList.map((h) => (
                    <div className={"drawer-item" + (currentHistoryRef.current && currentHistoryRef.current.id === h.id ? " cur" : "")} key={h.id}>
                      <button className="drawer-item-main" onClick={() => { resumeHistory(h); setShowHistory(false); }}>
                        <div className="drawer-item-sys">{h.systemName}</div>
                        <div className="drawer-item-sum">{h.castSummary}</div>
                        <div className="drawer-item-time">{fmtHistoryTime(h.updatedAt)} · {h.messages.length} 条</div>
                      </button>
                      <button className="drawer-item-del" onClick={() => deleteHistoryEntry(h.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </>
        )}
        <RunBar pos="top" />

        {!selected && !learnMode && (
          <>
            <header className="hero">
              <div className="hero-grid">
                <div>
                  <Kicker onDark code="CODEX" label="六体通书 · 起局 & 解读" />
                  <h1>富甲天下</h1>
                  <p className="hero-sub">AI · 多体系术数问答。确定性算法精算，AI作文字解读。</p>
                </div>
                <div className="hero-wheel"><BaguaWheel /></div>
              </div>
            </header>

            <section className="section">
              <div className="sec-head">
                <Kicker code="CHAPTER 01" label="择体 · 六大体系" />
                <h2>六体系索引 · 择一而问</h2>
              </div>
              <div className="sys-grid">
                {SYSTEMS.map((s, i) => (
                  <button key={s.id} className="sys" onClick={() => resetForm(s.id)}>
                    <div className="no">{String(i + 1).padStart(2, "0")}</div>
                    <div className="sym">{s.glyph}</div>
                    <div className="nm">{s.name}</div>
                    <div className="st">{s.sub}</div>
                    <div className="pick">点选起局 →</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="section">
              <button className="learn-row" onClick={enterLearnMode}>
                <div className="learn-row-glyph">學</div>
                <div className="learn-row-body">
                  <div className="learn-row-title">术数课堂</div>
                  <div className="learn-row-sub">跟 AI 老师一对一学八字、小六壬、奇门等，从零入门</div>
                </div>
                <div className="learn-row-go">进入课堂 →</div>
              </button>
            </section>
          </>
        )}

        {(selected || learnMode) && (
          <div className="backbar">
            <button className="backbtn" disabled={loading} onClick={() => (learnMode ? exitLearnMode() : resetForm(null))}>← 返回{learnMode ? " · 退出学习" : " · 重新择体"}</button>
          </div>
        )}

        {selected && phase === "setup" && (
          <section className="section">
            <div className="sec-head">
              <Kicker code="STEP 01" label={`填资料 · ${LATIN[selected]}`} />
              <h2>{currentSystem.name} · 先填信息</h2>
            </div>
            <div className="form-card">
              <div className="fgrid">
                <div>
                  {selected === "bazi" && (
                    <>
                      <label className="flabel">历法</label>
                      <div className="spread" style={{ marginBottom: 14 }}>
                        <button type="button" className={baziCalendar === "solar" ? "on" : ""} onClick={() => setBaziCalendar("solar")}>公历</button>
                        <button type="button" className={baziCalendar === "lunar" ? "on" : ""} onClick={() => setBaziCalendar("lunar")}>农历</button>
                      </div>
                      <label className="flabel">出生年 · 月 · 日</label>
                      <div className="ymdrow" style={{ marginBottom: 14 }}>
                        <input className="fin" type="number" placeholder="年(1995)" value={baziYear} onChange={(e) => setBaziYear(e.target.value)} />
                        <input className="fin" type="number" placeholder="月(8)" value={baziMonth} onChange={(e) => setBaziMonth(e.target.value)} />
                        <input className="fin" type="number" placeholder="日(15)" value={baziDay} onChange={(e) => setBaziDay(e.target.value)} />
                      </div>
                      <label className="flabel">性别</label>
                      <div className="spread" style={{ marginBottom: 14 }}>
                        <button type="button" className={baziGender === "male" ? "on" : ""} onClick={() => setBaziGender("male")}>男</button>
                        <button type="button" className={baziGender === "female" ? "on" : ""} onClick={() => setBaziGender("female")}>女</button>
                      </div>
                    </>
                  )}
                  {selected === "liuren" && (
                    <Callout tone="jade" label="时间起课">自动按当下时间排课，点击下方直接开始。</Callout>
                  )}
                  {selected === "tarot" && (
                    <Callout tone="jade" label="塔罗问卜">已为你自动选好牌阵，点击下方直接开始。</Callout>
                  )}
                  {selected === "meihua" && (
                    <Callout tone="jade" label="梅花易数">点击下方直接按当下时间起卦。</Callout>
                  )}
                </div>
              </div>
              {error && <p className="errline">✕ {error}</p>}
              <div className="btn-row">
                <button className="btn" onClick={handleSetupSubmit}>好了，开始问 →</button>
              </div>
            </div>
          </section>
        )}

        {(selected || learnMode) && phase === "chat" && (
          <section className="section">
            <div className="sec-head">
              <Kicker code={learnMode ? "STUDY" : "CHAPTER 02"} label={learnMode ? "学习 · LEARN" : `问卜 · ${LATIN[selected]}`} />
              <h2>{learnMode ? "术数课堂 · 随便问" : `${currentSystem.name} · 有什么想问的`}</h2>
            </div>

            <div className="chat">
              {messages.map((m, i) => (
                <div key={i} className={"bubble " + (m.role === "user" ? "me" : "bot")}>
                  {m.img && <img className="bubble-img" src={m.img} alt="用户图片" />}
                  {m.content && <div className="bubble-body">{removeAsterisks(m.content)}</div>}
                </div>
              ))}
              {loading && (
                <div className="bubble bot">
                  <div className="bubble-body typing">正在理清局势，大约需要1分钟…</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {error && <p className="errline">✕ {error}</p>}

            {pendingImage && (
              <div className="img-preview">
                <img src={pendingImage.dataUrl} alt="待发送" />
                <button onClick={() => setPendingImage(null)}>✕ 移除</button>
              </div>
            )}
            <div className="chat-input">
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePickImage} />
              <button className="img-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()} title="发图片">📷</button>
              <textarea
                className="chat-box"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="描述你的问题…（可发图片，回车发送）"
                rows={2}
              />
              <button className="send-btn" onClick={() => sendMessage()} disabled={loading || (!input.trim() && !pendingImage)}>发送</button>
            </div>
          </section>
        )}

        <RunBar pos="bot" />
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, msg: "" };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, msg: (error && error.message) || "未知错误" };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#151210", color: "#F3E8D2" }}>
          <div>
            <h2>页面出了点小状况</h2>
            <pre style={{ color: "#D9705F" }}>{this.state.msg}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}


