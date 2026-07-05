// Vercel Serverless Function —— 对话式版本
// POST /api/reading   body: { system: string, messages: [{role, content}, ...] }
// 对接「小马API」(xiaoma.best) 的 anthropic 兼容端点 /v1/messages，支持多轮对话
//
// 环境变量：
//   ANTHROPIC_API_KEY  —— 小马API令牌(sk-开头)
//   XIAOMA_BASE_URL    —— 小马接口域名，默认 https://xiaoma.best（结尾不要带斜杠）
//   MODEL_NAME         —— 模型名，默认 claude-3-5-sonnet-20241022
//   RATE_LIMIT_PER_HOUR—— 每IP每小时最多请求次数，默认 40（对话式每轮一次，放宽一些）

const ipHits = new Map();
function checkRateLimit(ip, limitPerHour) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const record = ipHits.get(ip);
  if (!record || now - record.start > windowMs) {
    ipHits.set(ip, { start: now, count: 1 });
    return true;
  }
  if (record.count >= limitPerHour) return false;
  record.count += 1;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "只支持 POST 请求" });
    return;
  }

  const limitPerHour = parseInt(process.env.RATE_LIMIT_PER_HOUR || "40", 10);
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    "unknown";
  if (!checkRateLimit(ip, limitPerHour)) {
    res.status(429).json({ error: "问得有点急，歇一小会儿再来吧（每小时有次数限制）。" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "服务端未配置 ANTHROPIC_API_KEY，请在 Vercel 项目环境变量中添加（填小马API的令牌）" });
    return;
  }

  const baseUrl = process.env.XIAOMA_BASE_URL || "https://xiaoma.best";
  const model = process.env.MODEL_NAME || "claude-3-5-sonnet-20241022";

  const { system, messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "缺少 messages（对话历史）" });
    return;
  }

  // 清洗消息：保留 user/assistant，content 允许字符串或数组（数组用于携带图片）
  const cleanMessages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && (typeof m.content === "string" || Array.isArray(m.content)))
    .map((m) => ({ role: m.role, content: m.content }));

  if (cleanMessages.length === 0) {
    res.status(400).json({ error: "对话历史为空" });
    return;
  }

  try {
    const payload = {
      model: model,
      max_tokens: 1200,
      messages: cleanMessages,
    };
    if (typeof system === "string" && system.trim()) {
      payload.system = system;
    }

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      res.status(502).json({ error: `上游返回非JSON（HTTP ${response.status}）：${rawText.slice(0, 200)}` });
      return;
    }

    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || JSON.stringify(data.error) || "上游API请求失败" });
      return;
    }

    const text = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    res.status(200).json({ text: text || "（这一卦我一时看不真切，你换个说法再问问？）" });
  } catch (e) {
    res.status(500).json({ error: e.message || "服务端请求异常" });
  }
}

