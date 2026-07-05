import React, { useState, useRef } from "react";
import * as LunarLib from "lunar-javascript";

// 用农历库把"当前中国时间"换算成农历月、日（避免手填出错）
// 兼容不同打包环境的导出方式；万一库异常，退化为一个不至于崩溃的估算
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
    // 农历库不可用时的兜底（粗略，仅保证不崩溃；正常情况走上面精确分支）
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

// 完整 78 张塔罗牌（韦特体系）：name 中文名，code 图片代号，up/rev 正逆关键词
// 图片来自公有领域韦特牌（metabismuth/tarot-json，RWS 美国公有领域），CDN 引用
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

// 牌图 CDN 地址（GitHub raw）。加载失败时前端会退化为"名称卡"占位，不会显示裂图。
function tarotImg(code) {
  return `https://raw.githubusercontent.com/metabismuth/tarot-json/master/cards/${code}.jpg`;
}

// 兼容旧引用：名称→关键词
const TAROT_MEANINGS = TAROT_DECK.reduce((acc, c) => {
  acc[c.name] = { up: c.up, rev: c.rev };
  return acc;
}, {});

// 牌阵：常用主题，positions 决定抽几张、每张牌位含义
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

// ---------------- 八字精确排盘 + 大运（基于 lunar-javascript，节气精确到分钟，供「八字」体系专用） ----------------
const { Solar: LSolar, Lunar: LLunar, LunarYear: LLunarYearClass } = (function () {
  const base = LunarLib.default || LunarLib;
  return { Solar: base.Solar, Lunar: base.Lunar, LunarYear: base.LunarYear };
})();

// 查询某农历年是否有闰月，返回闰月月份数字（0 表示当年无闰月）
function getLunarLeapMonth(lunarYear) {
  try {
    return LLunarYearClass.fromYear(Number(lunarYear)).getLeapMonth();
  } catch (e) {
    return 0;
  }
}

// inputs: { calendar:'solar'|'lunar', year, month, day, isLeapMonth, hour, minute, hourUnknown, gender:'male'|'female'|'unknown' }
function computeBaziPrecise(inputs) {
  const hour = inputs.hourUnknown ? 12 : (inputs.hour != null && inputs.hour !== "" ? Number(inputs.hour) : 12);
  const minute = inputs.hourUnknown ? 0 : (inputs.minute != null && inputs.minute !== "" ? Number(inputs.minute) : 0);

  let lunar;
  if (inputs.calendar === "lunar") {
    const m = inputs.isLeapMonth ? -Math.abs(Number(inputs.month)) : Math.abs(Number(inputs.month));
    lunar = LLunar.fromYmdHms(Number(inputs.year), m, Number(inputs.day), hour, minute, 0);
  } else {
    const solar = LSolar.fromYmdHms(Number(inputs.year), Number(inputs.month), Number(inputs.day), hour, minute, 0);
    lunar = solar.getLunar();
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

// 时辰倒推定盘：三大地支组（子午卯酉 / 寅申巳亥 / 辰戌丑未），供外貌/睡姿/性格初筛
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

// 同一天不同地支时辰下的完整八字预览（时辰倒推候选比对用）
const SHICHEN_HOUR_MAP = { 子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };
function buildShichenCandidates(calendar, year, month, day, isLeapMonth, branches, gender) {
  return branches.map((branch) => {
    const hour = SHICHEN_HOUR_MAP[branch];
    const result = computeBaziPrecise({ calendar, year, month, day, isLeapMonth, hour, minute: 0, hourUnknown: false, gender });
    return { branch, hour, result };
  });
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

// 各体系解读所依据的典籍参考（用于「关于本站」展示 + 拼入AI提示，让措辞贴合传统体系而非现代简化说法）
const LIUREN_CLASSICS = [
  "《小六壬基础与技法》", "《易经开悟》（煜燊）", "《小六壬入门通解》（佚名）", "《五行大义》（隋·萧吉）",
  "《高级小六壬》（合集）", "《祖传民间小六壬预测全集》（江春义）", "《小六壬归元典藏》（慕言秋水）",
  "《诸葛亮神通风水小六壬》", "《增补万全玉匣记》（李真人/赵嘉宁译）", "《迷信历》（清·沈亮功）", "《百战奇略》（明·刘基）",
];
const BAZI_CLASSICS = [
  "《三命通会》（明·万民英）", "《渊海子平》（宋·徐子平）", "《穷通宝鉴》", "《子平真诠》（清·沈孝瞻）",
  "《滴天髓》（宋·京图）", "《李虚中命书》", "《星平会海》（明代合集）",
  "洪丕谟《中国古代算命术》", "潘昭佑《八字揭秘》", "徐伟刚《子平术精析》",
];
const MEIHUA_CLASSICS = [
  "《梅花易数》白话译注版（刘光本/荣益译注，1993）", "《宋惠彬易经系列—梅花易数/外应学》", "《梅花易数入门通解》（王炳中）",
  "《梅花心易疏证》（杨波）", "《梅花易数实战详解》（黄鉴）", "《周易尚氏学》（尚秉和）", "《皇极经世书解》（邵雍原著）",
  "明抄本《梅花易数》（韩国馆藏复刻）", "《邵康节先生心易梅花数》（子部珍本汇刊）", "民国《增删梅花易数》（袁树珊）",
];
const LIUYAO_CLASSICS = [
  "《古筮真诠》（朱辰彬）", "《六爻入门与实战》（王虎应）", "《宋惠彬易经系列—六爻》", "《周易预测学》（邵伟华）",
  "《六爻详真》（曲炜）", "《增删卜易》（清·野鹤老人）", "《卜筮正宗》（清·王洪绪）", "《黄金策》（明·刘伯温）",
  "《火珠林》（宋·麻衣道者）", "《易隐》（清·曹九锡，黎光校注隐易千金断版）", "《易冒》（清·程良宝）",
  "《卜筮心易妙法》（夏新仁）", "《六爻信息类象》（赵奎杰）", "《六爻速断讲义》（赵校晖）", "《筮学通考》（黎光）",
  "《五行大义》（萧吉）", "《六爻预测走向高层次之路》（冯映彰）", "《六爻卦例说真》", "《周易与现代经济预测学》（廖墨香）",
];
const TAROT_CLASSICS = [
  "《塔罗葵花宝典》（向日葵）", "《其实你已经很塔罗了》（保罗·福斯特）", "《你可以再塔罗一点》",
  "《78度的智慧》（瑞秋·波拉克）", "《塔罗逆位精解》（玛丽·K·格瑞尔）", "《塔罗全书》（瑞秋）",
  "《透特塔罗释义》（克劳利）", "《马赛塔罗》",
];

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

// 六宫对应之六亲、六神、星曜等（民间通行版本，不同流派/典籍在六神分配上略有出入，仅供参考）
const SIX_PALACE_INFO = {
  大安: { wuxing: "木", liuqin: "父母", liushen: "青龙", star: "福星（木曜）", fangwei: "东方", renwu: "尊长、领导、老成之人", shenti: "肝胆、四肢", yingqi: "事已成形，宜静不宜动，主稳、主迟、主安" },
  留连: { wuxing: "木", liuqin: "兄弟", liushen: "勾陈", star: "计都（缠绕星）", fangwei: "东南", renwu: "同辈、朋友，牵缠之人", shenti: "肝胆、筋络", yingqi: "事未有定论，反复拖延、纠缠不清，宜缓图不宜急进" },
  速喜: { wuxing: "火", liuqin: "子孙", liushen: "朱雀", star: "喜神（火曜）", fangwei: "南方", renwu: "晚辈、小孩、报信之人", shenti: "心、目", yingqi: "喜讯速至，吉利迅速，问事宜速断速行" },
  赤口: { wuxing: "金", liuqin: "官鬼", liushen: "白虎", star: "官符（金曜）", fangwei: "西方", renwu: "是非人、外人、执法者", shenti: "肺、口舌", yingqi: "口舌是非，易有争讼破财，宜忍让、防小人" },
  小吉: { wuxing: "水", liuqin: "妻财", liushen: "六合", star: "天贵（水曜）", fangwei: "北方", renwu: "女性、朋友、贵人", shenti: "肾、耳", yingqi: "和合有情，小有财喜，多有贵人相助" },
  空亡: { wuxing: "土", liuqin: "（诸事落空，不主六亲）", liushen: "玄武", star: "空亡星（土曜）", fangwei: "中央", renwu: "僧道、孤寡之人", shenti: "脾胃", yingqi: "落空虚耗，迟滞不吉，谋事难成，宜静候勿躁进" },
};

function computeXiaoLiuRen(lunarMonth, lunarDay, hour) {
  const hourNum = mod(Math.floor((hour + 1) / 2), 12) + 1;
  let idx = mod(lunarMonth - 1, 6);
  idx = mod(idx + (lunarDay - 1), 6);
  idx = mod(idx + (hourNum - 1), 6);
  const palace = SIX_PALACES[idx];
  return { palace, hourNum, info: SIX_PALACE_INFO[palace] };
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

// 随机抽牌：从78张里抽 count 张不重复，正逆随机
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

// 报数字起牌：用用户输入的数字确定抽哪些牌（牌序 mod 78）与正逆（奇偶）
// nums 例如 [7, 21, 40]；不足时用相邻数字补
function drawTarotByNumbers(nums, count) {
  const drawn = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let n = nums[i] != null ? nums[i] : nums.reduce((a, b) => a + b, i + 1);
    let idx = mod(n - 1, TAROT_DECK.length);
    // 避免重复
    let guard = 0;
    while (used.has(idx) && guard < TAROT_DECK.length) { idx = mod(idx + 1, TAROT_DECK.length); guard++; }
    used.add(idx);
    const card = TAROT_DECK[idx];
    const reversed = n % 2 === 0; // 偶数逆位
    drawn.push({ card: card.name, code: card.code, reversed });
  }
  return drawn;
}

/* ---------------- 对话式：起局背景 + 聊天风格 ---------------- */

// 聊天版的"人设 + 风格"系统提示（作为 system 传给模型，全程生效）
const CHAT_STYLE = `你是一位懂传统术数、又特别会跟普通人聊天的解读师。不要给自己起名字、也不要自称任何称号，就自然地跟对方对话即可。你的说话风格：
- 用大白话、口语化中文，像微信上跟朋友聊天一样，别端着、别掉书袋。
- 每次回答简短一些（一般 3~6 句话），这是连续对话，不用一次把话说尽，用户会追问。
- 出现专业术语（某个宫、某个卦、某颗星、某个门）时，顺带用半句话解释它是什么、代表什么，别只甩术语。
- 语气温和、给人鼓励，不用"绝对""一定""必然"这种把话说死的词。
- 少用"吉凶祸福""气运流转"这类空泛古文腔，多讲生活里的具体场景。
- 如果用户的问题信息不够（比如没说清问的是谁、什么事），可以先反问一句确认，再断。
- 全程围绕下面这一个已经起好的局面来聊，不要重新起局或改变盘面数据。
- 语气要自然亲切、有温度，别僵硬、别像念稿。拒绝任何请求时都客气柔和，别硬邦邦地怼回去。
- 如果遇到涉及赌博下注、买彩票、猜球赛比分这类问题，不要生硬拒绝或说教——可以顺着卦象聊聊这件事的成败态势、顺逆倾向、谁占优，但不要给出具体的下注号码、确切比分、买哪一注这种明确指向，也温和提醒一句这类事有风险、要理性、后果自负。
- 如果用户发来图片（聊天截图、生活照、手相面相等），结合图片内容和当前卦象一起分析当下情况；对图片里的信息就事论事地讲，涉及相术时说明仅供参考、不下绝对结论。`;

// 生成某个体系"这一局的盘面背景"，作为 system 提示的一部分，让模型全程记住这个盘
function buildCastContext(systemId, extra) {
  switch (systemId) {
    case "liuren": {
      const info = extra.info || {};
      const dayLabel = extra.isReportedDay ? `随口报数 ${extra.lunarDay}（代入「日」）` : `农历 ${extra.lunarDay} 日`;
      return (
        `【本局背景·小六壬】已按农历 ${extra.lunarMonth} 月、${dayLabel}、第${extra.hourNum}个时辰（子时为1）掐指起课，落于「${extra.palace}」宫。全程依据「${extra.palace}」宫来聊，不要改变宫位、不要重新起课。\n` +
        `「${extra.palace}」宫对应：五行${info.wuxing}，六亲主${info.liuqin}，六神${info.liushen}，星曜${info.star}，方位${info.fangwei}，多应${info.renwu}，身体应${info.shenti}。传统断意：${info.yingqi}。\n` +
        `请把六亲、六神、星曜这些对应结合进解读里（用大白话讲清楚它们分别指什么、对这件事意味着什么），不要只甩一个孤零零的宫名就完事。断法参酌 ${LIUREN_CLASSICS.slice(0, 4).join("、")} 等传统技法。`
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
        `断法参酌 ${BAZI_CLASSICS.slice(0, 5).join("、")} 等传统命理体系。`
      );
    }
    case "qimen":
      return (
        `【本局背景·奇门遁甲】以下为算法精确起出的盘，全程据此聊，不要重新起局：\n` +
        `局：${extra.dunType}${extra.ju}局（节气：${extra.period}，${extra.yuanName}）\n` +
        `地盘（宫位数字：${Object.entries(PALACE_NAMES).map(([k, v]) => `${k}=${v}`).join("、")}）：` +
        `${Object.entries(extra.diPan).map(([stem, gong]) => `${stem}在${gong}宫(${PALACE_NAMES[gong]})`).join("、")}\n` +
        `当前时辰：${extra.hourInfo.text}（旬首：${extra.xunYi}在${extra.baseGong}宫）\n` +
        `值符星：${extra.zhiFuStar}飞临${extra.zhiFuGong}宫(${PALACE_NAMES[extra.zhiFuGong]})；值使门：${extra.zhiShiDoor}行至${extra.zhiShiGong}宫(${PALACE_NAMES[extra.zhiShiGong]})\n` +
        `其余七星七门按九星固定序（天蓬天芮天冲天辅天禽天心天柱天任天英）、八门固定序推排，中五宫寄坤二宫。断法参酌 ${QIMEN_CLASSICS.join("、")} 的传统体系。\n\n` +
        `【奇门遁甲专用断法要求——务必遵守】\n` +
        `- 奇门遁甲以盘断事，不是聊天讲道理。这一局怎么答，答案必须从值符值使、九星八门、宫位生克、三奇六仪里面找，不是从「人生道理」「情绪安慰」里面找。\n` +
        `- 每一句实质性的话都要挂靠到具体的盘面元素上（某星临某宫、某门旺衰、值符值使的位置关系等），不能脱离盘面讲空泛的大道理或纯安慰话。\n` +
        `- 安慰、鼓励类的话最多一两句意思一下就行，不要占篇幅、不要成为回答的重心；重心永远是把这局盘讲清楚、讲透。\n` +
        `- 多轮追问时也要一直扣着这一局的盘面元素回答，不要聊着聊着就脱离盘面变成通用的心灵鸡汤或人生建议。`
      );
    case "meihua":
      return (
        `【本局背景·梅花易数】以下为算法精确起出的卦，全程据此聊，不要重新起卦：\n` +
        `起卦方式：${extra.method}；本卦：${extra.ben.name}（上${extra.upperName}下${extra.lowerName}），第 ${extra.movePos} 爻动；互卦：${extra.hu.name}；变卦：${extra.bian.name}\n` +
        `体用：体卦${extra.ti.name}(${extra.ti.element})，用卦${extra.yong.name}(${extra.yong.element})。以体为求测之主、用为所问之事，看体用生克比和，参酌互卦（过程）、变卦（结果）。\n` +
        `断法参酌 ${MEIHUA_CLASSICS.slice(0, 5).join("、")} 等传统体例。`
      );
    case "liuyao":
      return (
        `【本局背景·六爻】以下为算法摇钱成卦的结果，全程据此聊，不要重新排卦：\n` +
        `六爻（初至上）：${extra.raw.map((l, i) => `第${i + 1}爻${l.label}`).join("、")}\n` +
        `本卦：${extra.ben.name}（上${extra.ben.upper}下${extra.ben.lower}）\n` +
        (extra.movingPositions.length
          ? `动爻：第 ${extra.movingPositions.join("、")} 爻；变卦：${extra.bian.name}（上${extra.bian.upper}下${extra.bian.lower}）\n`
          : `六爻皆静，无动爻变卦，以本卦断\n`) +
        (extra.sy ? `世爻在第 ${extra.sy.shi} 爻，应爻在第 ${extra.sy.ying} 爻\n` : "") +
        `按卦名卦义、世应关系与动爻取用来断。断法参酌 ${LIUYAO_CLASSICS.slice(0, 5).join("、")} 等传统技法。`
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
          .join("\n")}\n结合牌位与牌义来聊，关键词仅供参照，依情境灵活阐发。断法参酌 ${TAROT_CLASSICS.slice(0, 5).join("、")} 等塔罗体系。`
      );
    default:
      return "";
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
.sys-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line2);border:1px solid var(--line2);border-radius:8px;overflow:hidden}
.sys{background:var(--card);padding:22px 20px;position:relative;cursor:pointer;transition:background .18s;min-height:120px;display:flex;flex-direction:column;text-align:left;border:0;font:inherit;color:inherit;width:100%}
.sys:hover{background:var(--card3)}
.sys .no{font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:.12em;color:var(--mono-label)}
.sys .sym{position:absolute;top:16px;right:20px;font-family:var(--serif);font-weight:900;font-size:34px;color:var(--gold-lt);opacity:.55;line-height:1}
.sys .nm{font-family:var(--serif);font-weight:700;font-size:19px;color:var(--ink);margin:14px 0 3px}
.sys .st{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-txt)}
.sys .ds{font-size:12px;color:var(--ink-sub);margin-top:10px;line-height:1.7;flex:1}
.sys .pick{margin-top:12px;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mono-label)}
.sys.sel{background:var(--coffee)}
.backbar{padding:24px 0 0}
.backbtn{background:var(--card);border:1px solid var(--line2);border-radius:8px;padding:10px 18px;font-family:var(--mono);font-size:12px;letter-spacing:.08em;color:var(--ink-sub);cursor:pointer;transition:background .18s}
.backbtn:hover{background:var(--card3);color:var(--ink)}
.chat{display:flex;flex-direction:column;gap:14px;margin:6px 0 16px;min-height:120px}
.chat-hint{background:var(--card);border:1px dashed var(--line2);border-radius:10px;padding:16px 18px;color:var(--ink-sub);font-size:14px;line-height:1.7}
.bubble{max-width:86%;display:flex;flex-direction:column}
.bubble.me{align-self:flex-end;align-items:flex-end}
.bubble.bot{align-self:flex-start;align-items:flex-start}
.bubble .bot-name{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--gold-txt);margin:0 0 5px 4px}
.bubble-body{padding:13px 17px;border-radius:16px;font-size:15px;line-height:1.85;white-space:pre-wrap;word-break:break-word}
.bubble.me .bubble-body{background:#fff;color:var(--ink);border:1px solid var(--line2);border-bottom-right-radius:5px}
.bubble.bot .bubble-body{background:var(--ink);color:#F5EFE3;border-bottom-left-radius:5px}
.bubble-body.typing{color:#C9B896;font-style:normal}
.chat-input{position:sticky;bottom:12px;z-index:5;display:flex;gap:10px;align-items:flex-end;background:var(--card);border:1px solid var(--line2);border-radius:14px;padding:10px 10px 10px 16px;box-shadow:0 6px 24px rgba(58,42,26,.18)}
.chat-box{flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:15px;line-height:1.6;color:var(--ink);resize:none;max-height:140px}
.send-btn{flex:0 0 auto;background:var(--ink);color:#fff;border:0;border-radius:10px;padding:11px 20px;font-size:14px;cursor:pointer;transition:opacity .18s}
.send-btn:disabled{opacity:.4;cursor:default}
.img-btn{flex:0 0 auto;background:none;border:0;font-size:22px;cursor:pointer;padding:4px 6px;align-self:center}
.bubble-img{max-width:180px;max-height:220px;border-radius:12px;margin-bottom:6px;display:block;object-fit:cover}
.img-preview{display:flex;align-items:center;gap:10px;margin-bottom:8px;background:var(--card);border:1px solid var(--line2);border-radius:12px;padding:8px 10px}
.img-preview img{width:52px;height:52px;object-fit:cover;border-radius:8px}
.img-preview button{background:none;border:1px solid var(--line2);border-radius:8px;color:var(--verm);font-size:12px;padding:5px 10px;cursor:pointer}
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
.selbox{width:100%;background:var(--card2);border:1px solid var(--line2);border-radius:7px;padding:10px 12px;font-family:var(--sans);font-size:13.5px;color:var(--ink2);outline:none;box-sizing:border-box;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%238A6D38'><path d='M5.5 7.5l4.5 4.5 4.5-4.5z'/></svg>");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
.selbox:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,146,74,.12)}
.spread-positions{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 12px}
.pos-chip{font-family:var(--mono);font-size:10px;letter-spacing:.05em;color:var(--gold-txt);background:var(--gold-bg);border-radius:3px;padding:3px 8px}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.callout{border-radius:7px;padding:13px 16px;font-size:12.5px;line-height:1.75}
.callout .lab{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;display:block;margin-bottom:5px}
.callout.jade{background:var(--jade-bg);border-left:3px solid var(--jade)} .callout.jade .lab{color:var(--jade)} .callout.jade .bd{color:#2c5a44}
.callout.gold{background:var(--gold-bg);border-left:3px solid var(--gold)} .callout.gold .lab{color:var(--gold-txt)} .callout.gold .bd{color:#5f4c24}
.callout.verm{background:var(--verm-bg);border-left:3px solid var(--verm)} .callout.verm .lab{color:var(--verm)} .callout.verm .bd{color:#7a3830}
.spread{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.spread.c3{grid-template-columns:1fr 1fr 1fr}
.spread button{font-family:var(--mono);font-size:11px;letter-spacing:.04em;border-radius:7px;padding:12px 10px;background:var(--card2);border:1px solid var(--line2);color:var(--ink-sub);cursor:pointer;transition:.15s}
.spread button.on{background:var(--coffee);color:var(--cream);border-color:var(--coffee)}
.ymdrow{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:10px}
.checkline{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-sub);cursor:pointer;user-select:none}
.checkline input{width:15px;height:15px;accent-color:var(--gold);cursor:pointer}
.shichen{margin-top:10px;padding:16px;background:var(--card2);border:1px dashed var(--line2);border-radius:8px}
.shichen-groups{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.shichen-card{text-align:left;background:var(--card);border:1px solid var(--line2);border-radius:7px;padding:12px 14px;cursor:pointer;transition:.15s}
.shichen-card:hover{background:var(--card3);border-color:var(--gold)}
.shichen-cands{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.shichen-cand{text-align:left;background:var(--card);border:1px solid var(--line2);border-radius:7px;padding:12px 14px;cursor:pointer;transition:.15s}
.shichen-cand:hover{background:var(--card3);border-color:var(--gold)}
.sc-title{font-family:var(--serif);font-weight:700;font-size:14px;color:var(--ink);margin-bottom:6px}
.sc-line{font-size:12px;color:var(--ink-sub);line-height:1.7}
.sc-pick{font-family:var(--mono);font-size:10px;letter-spacing:.08em;color:var(--gold-txt);margin-top:6px}
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
.history-list{display:flex;flex-direction:column;gap:10px}
.history-item summary .hint{font-family:var(--mono);font-size:10px;letter-spacing:.08em;color:var(--mono-label);font-weight:400;text-transform:none}
.hist-msg{margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.hist-msg:last-child{border-bottom:0;margin-bottom:0;padding-bottom:0}
.hist-role{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-txt);margin-bottom:4px}
.hist-role.bot{color:var(--jade)}
.hist-content{font-size:13px;line-height:1.75;color:var(--ink3);white-space:pre-wrap}
.foot-note{text-align:center;font-size:11px;color:var(--ink-sub);opacity:.75;max-width:470px;margin:16px auto 24px;line-height:1.7}
@media(max-width:820px){
  .hero{padding:36px 28px 32px}
  .hero-grid{grid-template-columns:1fr;gap:26px}
  .hero-wheel{order:-1}
  .sys-grid{grid-template-columns:1fr 1fr}
  .fgrid{grid-template-columns:1fr;gap:18px}
}
@media(max-width:520px){
  .wrap{padding:0 14px 30px}
  .sys-grid{grid-template-columns:1fr}
  .frow{grid-template-columns:1fr}
  .datarow{grid-template-columns:76px 1fr;gap:10px}
  .result,.form-card{padding:22px 18px}
  .hero{padding:28px 20px 26px}
  .castbar{padding:18px 18px}
  .runbar{flex-wrap:wrap;gap:6px}
  .hmeta{min-width:0}
  h1{font-size:40px !important;word-break:break-word}
  .spread{flex-wrap:wrap}
  .spread button{flex:1 1 auto}
  .ymdrow{grid-template-columns:1fr 1fr;grid-template-areas:"y y" "m d"}
  .ymdrow input:first-child{grid-area:y}
}
.page,.wrap,.hero,.section,.castbar,.form-card,.result,.chat,.chat-input,.bubble{max-width:100%;overflow-wrap:break-word}
.datarow .dv{overflow-wrap:break-word;min-width:0}
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

// 时辰倒推定盘向导：外貌/睡姿/性格初筛缩小到一个地支组，再从4个候选时辰里对比大运/流年选定一个
function ShichenWizard({ calendar, year, month, day, isLeapMonth, gender, groupKey, onPickGroup, onConfirmHour, onBackToGroup }) {
  if (!groupKey) {
    return (
      <div className="shichen">
        <Callout tone="gold" label="第一步 · 外貌与性格初筛">先看看自己更符合下面哪一组的描述（大致判断即可，不必精确）：</Callout>
        <div className="shichen-groups">
          {Object.entries(SHICHEN_GROUPS).map(([key, g]) => (
            <button key={key} type="button" className="shichen-card" onClick={() => onPickGroup(key)}>
              <div className="sc-title">{g.label}</div>
              <div className="sc-line"><b>外貌/睡姿：</b>{g.appearance}</div>
              <div className="sc-line"><b>性格/排行：</b>{g.personality}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const group = SHICHEN_GROUPS[groupKey];
  let candidates = [];
  try {
    candidates = buildShichenCandidates(calendar, year, month, day, isLeapMonth, group.branches, gender || "unknown");
  } catch (e) {
    return <Callout tone="verm" label="出错了">候选推算失败，检查一下出生年月日是否填写正确。</Callout>;
  }

  return (
    <div className="shichen">
      <Callout tone="gold" label="第二步 · 核心验证">
        已初筛到「{group.label}」，共 {candidates.length} 个候选时辰。请回想人生中的重大节点（升学、结婚、生育、破财、重大伤病等发生的年份），对照下面各候选时辰推出的大运/流年，看哪个更吻合，再选定一个——这一步无法保证精确，仅供参考。
      </Callout>
      <div className="shichen-cands">
        {candidates.map((c) => {
          const r = c.result;
          const dayun = r.dayun.unknownGender ? r.dayun.male : r.dayun;
          const dayunPreview = dayun.list.slice(1, 4).map((d) => `${d.ganzhi}(${d.startAge}-${d.endAge}岁)`).join("、");
          return (
            <button key={c.branch} type="button" className="shichen-cand" onClick={() => onConfirmHour(c.branch, c.hour)}>
              <div className="sc-title">{c.branch}时（约 {String(c.hour).padStart(2, "0")}:00-{String((c.hour + 2) % 24).padStart(2, "0")}:00）</div>
              <div className="sc-line">时柱：<span className="ser">{r.pillars.hour}</span></div>
              <div className="sc-line">大运预览：{dayunPreview}</div>
              <div className="sc-pick">选这个时辰 →</div>
            </button>
          );
        })}
      </div>
      <button type="button" className="btn ghost" style={{ marginTop: 12 }} onClick={onBackToGroup}>← 重新选一组</button>
    </div>
  );
}

/* ---------------- 历史记录（本地存储，不经过任何服务器） ---------------- */

const HISTORY_KEY = "fzt_history_v1";
const HISTORY_LIMIT = 500;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}
function saveHistory(list) {
  let arr = list.slice(0, HISTORY_LIMIT);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
      return;
    } catch (e) {
      if (arr.length <= 1) return;
      arr = arr.slice(0, Math.max(1, Math.floor(arr.length * 0.8)));
    }
  }
}
function fmtHistoryTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
// 按体系生成历史列表里的一行简介
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

/* ---------------- 主组件 ---------------- */

function AppInner() {
  const [selected, setSelected] = useState(null);
  const [numbers, setNumbers] = useState("");
  const [tarotSpread, setTarotSpread] = useState("overall"); // 牌阵key
  const [tarotDrawMode, setTarotDrawMode] = useState("random"); // random | numbers
  const [tarotNumbers, setTarotNumbers] = useState(""); // 报数字起牌
  const [liurenMode, setLiurenMode] = useState("time"); // time时间起课 | numbers报数起课
  const [liurenNumbers, setLiurenNumbers] = useState(""); // 报数起课：只需一个数字（代入「日」，月/时辰仍按当下真实农历）

  // 八字资料
  const [baziCalendar, setBaziCalendar] = useState("solar"); // solar新历 | lunar农历
  const [baziYear, setBaziYear] = useState("");
  const [baziMonth, setBaziMonth] = useState("");
  const [baziDay, setBaziDay] = useState("");
  const [baziLeapMonth, setBaziLeapMonth] = useState(false);
  const [baziHour, setBaziHour] = useState("");
  const [baziMinute, setBaziMinute] = useState("");
  const [baziHourUnknown, setBaziHourUnknown] = useState(false);
  const [baziGender, setBaziGender] = useState(""); // male | female | ""(未知)
  const [baziBirthPlace, setBaziBirthPlace] = useState("");
  const [baziCurrentPlace, setBaziCurrentPlace] = useState("");
  // 时辰倒推定盘（出生时间不确定时的辅助向导）
  const [shichenOpen, setShichenOpen] = useState(false);
  const [shichenGroupKey, setShichenGroupKey] = useState(""); // 初筛选中的地支组
  const [shichenFinalHour, setShichenFinalHour] = useState(""); // 最终选定的候选时辰（地支）

  // 对话式状态
  const [phase, setPhase] = useState("home"); // home | setup | chat  （setup 仅八字/小六壬需要）
  const [castContext, setCastContext] = useState(""); // 本局盘面背景（作为system一部分）
  const [castInfo, setCastInfo] = useState(null); // 用于顶部展示算法排盘
  const [messages, setMessages] = useState([]); // [{role:'user'|'assistant', content}]
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState(null); // {dataUrl, mediaType, data}
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  // 历史记录（本地存储）
  const [historyList, setHistoryList] = useState(loadHistory);
  const currentHistoryRef = useRef(null); // 当前这一局对应的历史记录条目（不含最新messages，发消息时再补上）

  function upsertHistory(entry) {
    setHistoryList((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      const next = idx >= 0 ? [...prev.slice(0, idx), entry, ...prev.slice(idx + 1)] : [entry, ...prev];
      saveHistory(next);
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
  function clearAllHistory() {
    setHistoryList([]);
    saveHistory([]);
  }

  // 需要先填资料/选项的体系
  const NEEDS_SETUP = { bazi: true, liuren: true, tarot: true, meihua: true };

  function resetForm(id) {
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
    setBaziMinute("");
    setBaziHourUnknown(false);
    setBaziGender("");
    setBaziBirthPlace("");
    setBaziCurrentPlace("");
    setShichenOpen(false);
    setShichenGroupKey("");
    setShichenFinalHour("");
    setCastContext("");
    setCastInfo(null);
    setMessages([]);
    setInput("");
    setError("");
    setLoading(false);
    if (id == null) {
      setPhase("home");
    } else if (NEEDS_SETUP[id]) {
      setPhase("setup"); // 先填资料/选项
    } else if (id === "qimen" || id === "liuyao") {
      // 奇门/六爻：不立即起局，先进对话，等用户发第一句话（问出具体的事）再起盘/摇卦
      setPhase("chat");
    } else {
      startCast(id, {});
    }
  }

  // 起局：算出盘面，生成背景，进入对话阶段
  function startCast(id, opts) {
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
      // 月与时辰始终按当下中国时间真实换算（避免用户自填农历对不上）；
      // 「报数起课」时只需报一个数字，作为「日」的替代（民间掐指速断常见做法：随口报一数配合当下时辰）
      const lu = getChinaLunarNow();
      const lm = lu.lunarMonth;
      let ld, isReportedDay;
      if (opts.liurenMode === "numbers") {
        const ns = (opts.liurenNumbers || "").split(/[^0-9]+/).filter(Boolean).map(Number);
        ld = ns[0] || 1;
        isReportedDay = true;
      } else {
        ld = lu.lunarDay;
        isReportedDay = false;
      }
      const hourForCast = lu.chinaHour;
      const { palace, hourNum, info } = computeXiaoLiuRen(Number(lm), Number(ld), hourForCast);
      extra.lunarMonth = Number(lm);
      extra.lunarDay = Number(ld);
      extra.hourNum = hourNum;
      extra.palace = palace;
      extra.info = info;
      extra.isReportedDay = isReportedDay;
      extra.mode = isReportedDay ? "报数起课（随口报一数代入「日」，月与时辰仍按当下农历真实换算）" : "时间起课（按当下中国时间自动取农历月、日、时辰）";
      cast = { type: "liuren", palace, hourNum, info, mode: extra.mode, lunarMonth: lm, lunarDay: ld, isReportedDay };
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
        const ns = (opts.tarotNumbers || "").split(/[^0-9]+/).filter(Boolean).map(Number);
        cards = drawTarotByNumbers(ns.length ? ns : [7, 21, 40, 3], count);
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

    // 记入本地历史（新起一局＝新建一条历史记录）
    const hid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const historyEntry = {
      id: hid,
      systemId: id,
      systemName: (SYSTEMS.find((s) => s.id === id) || {}).name || id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      castSummary: castSummaryFor(id, cast),
      castInfo: cast,
      messages: [],
    };
    currentHistoryRef.current = historyEntry;
    upsertHistory(historyEntry);

    return ctx;
  }

  // 提交 setup（八字/小六壬）资料
  function handleSetupSubmit() {
    if (selected === "bazi" && (!baziYear || !baziMonth || !baziDay)) {
      setError("先把出生年、月、日填完整哈");
      return;
    }
    if (selected === "bazi" && !baziHourUnknown && baziHour === "") {
      setError("填一下出生时间，不清楚的话勾选「不确定具体时间」即可");
      return;
    }
    if (selected === "liuren" && liurenMode === "numbers" && !liurenNumbers.trim()) {
      setError("报数起课先随口报一个数字哈");
      return;
    }
    if (selected === "tarot" && tarotDrawMode === "numbers" && !tarotNumbers.trim()) {
      setError("报数起牌要先填数字哈");
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

  // 发送一条对话消息
  async function sendMessage() {
    const text = input.trim();
    if ((!text && !pendingImage) || loading) return;
    setError("");
    setInput("");
    const img = pendingImage;
    setPendingImage(null);

    // 奇门遁甲/六爻：如果还没起盘（进页面没自动起），现在才按用户问出的这一刻起盘/摇卦
    let effectiveContext = castContext;
    if ((selected === "qimen" || selected === "liuyao") && !castContext) {
      effectiveContext = startCast(selected, { keepMessages: true });
    }

    // 发给API的消息：带图则用数组格式（Anthropic图片格式）
    const apiUserContent = img
      ? [
          ...(text ? [{ type: "text", text }] : [{ type: "text", text: "请结合这张图片和当前卦象，帮我看看。" }]),
          { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } },
        ]
      : text;
    // 存历史/显示用：图片存为可展示的标记
    const displayContent = img ? (text ? text + "　[图片]" : "[图片]") : text;

    const apiMessages = [...messages.map((m) => ({ role: m.role, content: m.contentApi || m.content })), { role: "user", content: apiUserContent }];
    const nextMessages = [...messages, { role: "user", content: displayContent, contentApi: apiUserContent, img: img ? img.dataUrl : null }];
    setMessages(nextMessages);
    setLoading(true);
    persistMessages(nextMessages);

    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: CHAT_STYLE + "\n\n" + effectiveContext,
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
      const finalMessages = [...nextMessages, { role: "assistant", content: data.text || "（这一卦一时看不真切，换个说法再问问？）" }];
      setMessages(finalMessages);
      persistMessages(finalMessages);
    } catch (e) {
      setError(e.message || "网络出了点问题，再试一次");
    } finally {
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80);
    }
  }

  // 选择图片 → 压缩为base64
  function handlePickImage(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type)) { setError("请选择图片文件"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const comma = String(dataUrl).indexOf(",");
      const data = String(dataUrl).slice(comma + 1);
      setPendingImage({ dataUrl, mediaType: file.type, data });
    };
    reader.onerror = () => setError("图片读取失败，换一张试试");
    reader.readAsDataURL(file);
  }

  // 把最新的对话消息写回本地历史记录
  function persistMessages(msgs) {
    if (!currentHistoryRef.current) return;
    currentHistoryRef.current = { ...currentHistoryRef.current, messages: msgs, updatedAt: Date.now() };
    upsertHistory(currentHistoryRef.current);
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
      const r = c.baziResult;
      const p = r.pillars;
      const fmtDayun = (yun) => yun.list.slice(0, 6).map((d) =>
        d.index === 0 ? `起运前` : `${d.ganzhi}(${d.startAge}-${d.endAge}岁)`
      ).join(" · ");
      return (
        <>
          {row("年柱", <span className="ser">{p.year}</span>, "b1")}
          {row("月柱", <span className="ser">{p.month}</span>, "b2")}
          {row("日柱", <span className="ser">{p.day}</span>, "b3")}
          {row("时柱", p.hour ? <span className="ser">{p.hour}</span> : "未知（时间不确定）", "b4")}
          {row("农历", r.lunarText, "b5")}
          {r.dayun.unknownGender ? (
            <>
              {row("大运（按男命）", fmtDayun(r.dayun.male), "b6m")}
              {row("大运（按女命）", fmtDayun(r.dayun.female), "b6f")}
            </>
          ) : (
            row(`大运（${r.dayun.forward ? "顺排" : "逆排"}）`, fmtDayun(r.dayun), "b6")
          )}
        </>
      );
    }
    if (c.type === "liuren") {
      const info = c.info || {};
      return (
        <>
          {row("落宫", <span className="ser">{c.palace}</span>, "l1")}
          {row("时辰", `第 ${c.hourNum} 个时辰`, "l2")}
          {c.mode && row("起课", c.mode, "l3")}
          {c.lunarMonth && row(c.isReportedDay ? "月 / 报数" : "农历", `${c.lunarMonth} 月 ${c.lunarDay} ${c.isReportedDay ? "（报数）" : "日"}`, "l4")}
          {info.liuqin && row("六亲 · 六神", `${info.liuqin} · ${info.liushen}`, "l5")}
          {info.star && row("星曜 · 方位", `${info.star} · ${info.fangwei}`, "l6")}
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
      return (
        <>
          {c.spreadLabel && row("牌阵", c.spreadLabel, "ts")}
          {c.cards.map((card, i) =>
            row(
              c.positions[i] || `第 ${i + 1} 张`,
              <span><span className="ser">{card.card}</span>（{card.reversed ? "逆位" : "正位"}）</span>,
              "t" + i
            )
          )}
        </>
      );
    }
    return null;
  }

  return (
    <div className="page">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700;900&family=Noto+Sans+SC:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap');`}</style>
      <style>{DESIGN_CSS}</style>

      <div className="wrap">
        <RunBar pos="top" />

        {/* 首页：未选体系时显示 HERO + 列表 */}
        {!selected && (
        <>
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
                <div className="hmeta"><div className="k">Active</div><div className="v">择体 · SELECT</div></div>
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
              return (
                <button key={s.id} className="sys" onClick={() => resetForm(s.id)}>
                  <div className="no">{String(i + 1).padStart(2, "0")}</div>
                  <div className="sym">{s.glyph}</div>
                  <div className="nm">{s.name}</div>
                  <div className="st">{s.sub}</div>
                  <div className="pick">点选起局 →</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* CHAPTER 02 · 历史记录（本地留存，仅当有记录时显示） */}
        {historyList.length > 0 && (
          <section className="section">
            <div className="sec-head">
              <Kicker code="ARCHIVE" label="历史记录 · 本地留存" />
              <h2>历史记录</h2>
              <p className="lead">仅保存在这台设备的浏览器里，不会上传到任何服务器；最多保留 {HISTORY_LIMIT} 条，点开可看完整问答。</p>
            </div>
            <div className="btn-row" style={{ marginBottom: 16, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => { if (window.confirm("确定要清空全部历史记录吗？此操作不可恢复。")) clearAllHistory(); }}
              >
                清空全部历史
              </button>
            </div>
            <div className="history-list">
              {historyList.map((h) => (
                <details className="acc history-item" key={h.id}>
                  <summary>
                    <span>{h.systemName} · {h.castSummary}</span>
                    <span className="hint">{fmtHistoryTime(h.updatedAt)}</span>
                  </summary>
                  <div className="acc-body">
                    {h.messages.length === 0 ? (
                      <p>（这一局还没有开始提问）</p>
                    ) : (
                      h.messages.map((m, i) => (
                        <div className="hist-msg" key={i}>
                          <div className={"hist-role" + (m.role === "assistant" ? " bot" : "")}>{m.role === "assistant" ? "AI 解读" : "你问"}</div>
                          <div className="hist-content">{m.content}</div>
                        </div>
                      ))
                    )}
                    <div className="btn-row" style={{ marginTop: 14 }}>
                      <button type="button" className="btn ghost" onClick={() => deleteHistoryEntry(h.id)}>删除这条记录</button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
        </>
        )}

        {/* 详情页：选中体系后显示返回按钮 */}
        {/* 详情页顶部返回栏 */}
        {selected && (
          <div className="backbar">
            <button className="backbtn" onClick={() => resetForm(null)}>← 返回 · 重新择体</button>
            {phase === "chat" && NEEDS_SETUP[selected] && (
              <button className="backbtn" style={{ marginLeft: 10 }} onClick={() => { setPhase("setup"); setMessages([]); setCastContext(""); setCastInfo(null); currentHistoryRef.current = null; setError(""); setInput(""); }}>✎ 修改资料</button>
            )}
            {phase === "chat" && (
              <button className="backbtn" style={{ marginLeft: 10 }} onClick={() => resetForm(selected)}>↻ 重新起局</button>
            )}
          </div>
        )}

        {/* SETUP · 八字/小六壬 先填资料 */}
        {selected && phase === "setup" && (
          <section className="section">
            <div className="sec-head">
              <Kicker code="STEP 01" label={`填资料 · ${LATIN[selected]}`} />
              <h2>{currentSystem.name} · 先填一点信息</h2>
            </div>
            <div className="form-card">
              <div className="fgrid">
                <div>
                  {selected === "bazi" && (() => {
                    const leapMonthOfYear = baziCalendar === "lunar" && baziYear ? getLunarLeapMonth(baziYear) : 0;
                    const showLeapCheck = leapMonthOfYear > 0 && Number(baziMonth) === leapMonthOfYear;
                    return (
                      <>
                        <label className="flabel">历法</label>
                        <div className="spread" style={{ marginBottom: 14 }}>
                          <button type="button" className={baziCalendar === "solar" ? "on" : ""} onClick={() => setBaziCalendar("solar")}>新历（公历）</button>
                          <button type="button" className={baziCalendar === "lunar" ? "on" : ""} onClick={() => setBaziCalendar("lunar")}>农历</button>
                        </div>

                        <label className="flabel">出生年 · 月 · 日</label>
                        <div className="ymdrow" style={{ marginBottom: 8 }}>
                          <input className="fin" type="number" placeholder="年 如 1990" value={baziYear} onChange={(e) => setBaziYear(e.target.value)} />
                          <input className="fin" type="number" placeholder="月" min="1" max="12" value={baziMonth} onChange={(e) => setBaziMonth(e.target.value)} />
                          <input className="fin" type="number" placeholder="日" min="1" max="31" value={baziDay} onChange={(e) => setBaziDay(e.target.value)} />
                        </div>
                        {showLeapCheck && (
                          <label className="checkline" style={{ marginBottom: 14 }}>
                            <input type="checkbox" checked={baziLeapMonth} onChange={(e) => setBaziLeapMonth(e.target.checked)} />
                            这是闰{leapMonthOfYear}月（{baziYear}年农历有闰{leapMonthOfYear}月）
                          </label>
                        )}

                        <label className="flabel">出生时间</label>
                        <div className="frow" style={{ marginBottom: 10 }}>
                          <input className="fin" type="number" placeholder="时 0-23" min="0" max="23" disabled={baziHourUnknown} value={baziHour} onChange={(e) => setBaziHour(e.target.value)} />
                          <input className="fin" type="number" placeholder="分（选填）" min="0" max="59" disabled={baziHourUnknown} value={baziMinute} onChange={(e) => setBaziMinute(e.target.value)} />
                        </div>
                        <label className="checkline" style={{ marginBottom: 10 }}>
                          <input type="checkbox" checked={baziHourUnknown} onChange={(e) => { setBaziHourUnknown(e.target.checked); if (!e.target.checked) setShichenOpen(false); }} />
                          不确定具体出生时间
                        </label>
                        {baziHourUnknown && (
                          <>
                            <Callout tone="verm" label="提醒">时辰不确定，时柱与起运的具体年龄都只能算个大概、有偏差；下面「时辰倒推」能帮你缩小范围，但结果也不一定准，仅供参考。</Callout>
                            <div className="btn-row" style={{ marginTop: 10, marginBottom: 14 }}>
                              <button type="button" className="btn ghost" onClick={() => setShichenOpen((v) => !v)}>
                                {shichenOpen ? "收起时辰倒推" : "帮我推算大概时辰 →"}
                              </button>
                            </div>
                            {shichenOpen && (!baziYear || !baziMonth || !baziDay ? (
                              <Callout tone="gold" label="先填年月日">时辰倒推需要先填好出生年、月、日，才能推算候选时辰的四柱与大运。</Callout>
                            ) : (
                              <ShichenWizard
                                calendar={baziCalendar} year={baziYear} month={baziMonth} day={baziDay} isLeapMonth={baziLeapMonth}
                                gender={baziGender} groupKey={shichenGroupKey}
                                onPickGroup={(key) => setShichenGroupKey(key)}
                                onBackToGroup={() => setShichenGroupKey("")}
                                onConfirmHour={(branch, hour) => {
                                  setShichenFinalHour(branch);
                                  setBaziHour(String(hour));
                                  setBaziMinute("0");
                                  setBaziHourUnknown(false);
                                  setShichenOpen(false);
                                }}
                              />
                            ))}
                          </>
                        )}

                        <label className="flabel">性别</label>
                        <div className="spread c3" style={{ marginBottom: 14 }}>
                          <button type="button" className={baziGender === "male" ? "on" : ""} onClick={() => setBaziGender("male")}>男</button>
                          <button type="button" className={baziGender === "female" ? "on" : ""} onClick={() => setBaziGender("female")}>女</button>
                          <button type="button" className={baziGender === "" ? "on" : ""} onClick={() => setBaziGender("")}>未知</button>
                        </div>
                        {baziGender === "" && <Callout tone="jade" label="性别未填">大运顺排、逆排取决于性别，未填时会同时列出男命、女命两种排法供参考。</Callout>}

                        <label className="flabel" style={{ marginTop: 14 }}>出生地（选填）</label>
                        <input className="fin" style={{ marginBottom: 12 }} type="text" value={baziBirthPlace} onChange={(e) => setBaziBirthPlace(e.target.value)} placeholder="如：广东广州" />
                        <label className="flabel">现居地（选填）</label>
                        <input className="fin" type="text" value={baziCurrentPlace} onChange={(e) => setBaziCurrentPlace(e.target.value)} placeholder="如：上海" />
                      </>
                    );
                  })()}
                  {selected === "liuren" && (
                    <>
                      <label className="flabel">起课方式</label>
                      <div className="spread" style={{ marginBottom: 14 }}>
                        <button type="button" className={liurenMode === "time" ? "on" : ""} onClick={() => setLiurenMode("time")}>时间起课（自动取农历）</button>
                        <button type="button" className={liurenMode === "numbers" ? "on" : ""} onClick={() => setLiurenMode("numbers")}>报数起课</button>
                      </div>
                      {liurenMode === "time" ? (
                        <Callout tone="jade" label="时间起课">按中国时间自动换算成农历月、日，配合当前时辰掐指定局，你什么都不用填，直接开始问即可。</Callout>
                      ) : (
                        <>
                          <label className="flabel">随口报一个数字</label>
                          <input className="fin" type="text" value={liurenNumbers} onChange={(e) => setLiurenNumbers(e.target.value)} placeholder="例 18" />
                          <Callout tone="jade" label="报数起课">心中默想所问之事，随口报一个数即可——月、时辰仍按当下农历真实换算，只有这个数会代入起课，不必再费心算农历。</Callout>
                        </>
                      )}
                    </>
                  )}
                  {selected === "meihua" && (
                    <>
                      <label className="flabel">起卦数字（选填，两个以上数字）</label>
                      <input className="fin" style={{ marginBottom: 12 }} type="text" value={numbers} onChange={(e) => setNumbers(e.target.value)} placeholder="例 7 12" />
                      <Callout tone="jade" label="起卦法">首数定上卦、次数定下卦、诸数之和定动爻。留空则按当前时间起卦。</Callout>
                    </>
                  )}
                  {selected === "tarot" && (
                    <>
                      <label className="flabel">选个牌阵</label>
                      <select className="selbox" style={{ marginBottom: 8 }} value={tarotSpread} onChange={(e) => setTarotSpread(e.target.value)}>
                        {Object.entries(
                          Object.entries(TAROT_SPREADS).reduce((acc, [key, s]) => {
                            (acc[s.group] = acc[s.group] || []).push([key, s]);
                            return acc;
                          }, {})
                        ).map(([group, items]) => (
                          <optgroup key={group} label={group}>
                            {items.map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      <div className="spread-positions">
                        {TAROT_SPREADS[tarotSpread].positions.map((p, i) => <span className="pos-chip" key={i}>{i + 1}. {p}</span>)}
                      </div>
                      <label className="flabel">抽牌方式</label>
                      <div className="spread" style={{ marginBottom: 12 }}>
                        <button type="button" className={tarotDrawMode === "random" ? "on" : ""} onClick={() => setTarotDrawMode("random")}>随机抽牌</button>
                        <button type="button" className={tarotDrawMode === "numbers" ? "on" : ""} onClick={() => setTarotDrawMode("numbers")}>报数字起牌</button>
                      </div>
                      {tarotDrawMode === "numbers" && (
                        <>
                          <label className="flabel">报几个数字（1-78，空格隔开，几张牌报几个数）</label>
                          <input className="fin" type="text" value={tarotNumbers} onChange={(e) => setTarotNumbers(e.target.value)} placeholder="例 7 21 40" />
                        </>
                      )}
                      <Callout tone="jade" label="抽牌">随机抽牌由程序随机；报数字起牌请在 1-78 之间各报一个数（对应78张牌），由数字决定抽到哪几张、正逆位。</Callout>
                    </>
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

        {/* CHAT · 对话界面 */}
        {selected && phase === "chat" && (
          <section className="section">
            <div className="sec-head">
              <Kicker code="CHAPTER 02" label={`问卜 · ${LATIN[selected]}`} />
              <h2>{currentSystem.name} · 有什么想问的</h2>
            </div>

            {/* 算法排盘（本局盘面，一直展示在对话上方） */}
            {castInfo && (
              <div className="castbar" style={{ marginBottom: 18 }}>
                <div className="cb-head">
                  <Kicker onDark code="CASTING LOG" label="本局排盘" />
                  <span className="cb-code">{LATIN[selected]} · 复算稳定</span>
                </div>
                {castRows()}
              </div>
            )}

            {/* 对话气泡区 */}
            <div className="chat">
              {messages.length === 0 && !loading && (
                <div className="chat-hint">
                  {selected === "qimen" && "直接把想问的事说出来——你问的这一刻，会按当下的时间起盘，然后据此为你解读。"}
                  {selected === "liuyao" && "六爻讲究「不问不卜」，先把想问的具体事情说出来——一提交就会摇钱起卦，据卦而断。"}
                  {selected !== "qimen" && selected !== "liuyao" && "局已经起好了，直接在下面问吧——比如「我最近工作怎么样」「这段感情能成吗」，也可以接着追问。"}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={"bubble " + (m.role === "user" ? "me" : "bot")}>
                  {m.img && <img className="bubble-img" src={m.img} alt="用户图片" />}
                  {m.content && <div className="bubble-body">{m.content}</div>}
                </div>
              ))}
              {loading && (
                <div className="bubble bot">
                  <div className="bubble-body typing">正在理清局势…</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {error && <p className="errline">✕ {error}</p>}

            {/* 输入框 */}
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
                placeholder="描述你的问题…（可发图片让我帮看，回车发送）"
                rows={2}
              />
              <button className="send-btn" onClick={sendMessage} disabled={loading || (!input.trim() && !pendingImage)}>发送</button>
            </div>
          </section>
        )}


        {/* APPENDIX · 关于本站（仅首页显示） */}
        {!selected && (
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
                <li>八字四柱、大运均由农历库按精确节气时刻推算，支持农历/新历输入与闰月；出生时间不确定时，时柱与起运时间只能算个大概，可用「时辰倒推」向导辅助缩小范围，最终仍需自行核实，结果仅供参考。性别未填时会同时列出男命、女命两种大运排法。</li>
                <li>小六壬的农历月、日、时辰均按当下中国时间自动换算，报数起课时只有「日」由你随口报的数代入，月与时辰仍是真实农历，不会再对不上。六亲、六神、星曜对应为民间通行版本，不同流派/典籍分配略有出入。</li>
                <li>梅花易数「时间起卦」因未接入精确干支排盘，采阳历干支变体；如需严格古法，请改用数字起卦。</li>
                <li>六爻讲究「不问不卜」，选定体系后需先说出想问的具体事情，才会摇钱起卦。</li>
                <li>奇门遁甲的局数、地盘、值符值使已精确计算，其余七星七门按固定序由 AI 补齐；解读会紧扣值符值使、九星八门等盘面元素，而非泛泛而谈。</li>
                <li>塔罗提供整体运势、感情、事业财运、决策辅助等十余种牌阵，可在下拉框中按需选择。</li>
                <li>「历史记录」只保存在你这台设备的浏览器本地存储里，不会上传到任何服务器，换设备或清除浏览器数据后不可找回。</li>
              </ul>
              <div style={{ marginTop: 16 }}>
                <Callout tone="verm" label="免责 · Disclaimer">术数推演仅供参考与自省，不构成对具体决策（含投资、医疗、法律、婚姻等）的建议；请勿以此替代专业意见或用于赌博投机。</Callout>
              </div>
            </div>
          </details>
        </section>
        )}

        <RunBar pos="bot" />
        <p className="foot-note">术数推演仅供参考与自省，不构成对具体决策（含投资、医疗、法律等）的建议。</p>
      </div>
    </div>
  );
}

/* ---------------- 错误边界：任何运行时错误都显示提示，而不是整页白屏 ---------------- */
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
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#EAE2D3", color: "#241C12", fontFamily: "system-ui,-apple-system,sans-serif", textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>☯</div>
            <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>页面出了点小状况</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#6B5440" }}>刷新一下试试。如果反复出现，把下面这行信息发给开发者：</p>
            <pre style={{ fontSize: 12, background: "#FFFCF7", border: "1px solid #EFE7D8", borderRadius: 8, padding: "10px 12px", marginTop: 12, whiteSpace: "pre-wrap", textAlign: "left", color: "#B0463A" }}>{this.state.msg}</pre>
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


