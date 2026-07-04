// Vercel Serverless Function
// 部署后可通过 POST /api/reading 调用
// API key 只存在于服务端环境变量里，浏览器永远看不到
//
// 本版本对接「小马API」(xiaoma.best)，使用其 anthropic 兼容端点 /v1/messages
// 环境变量：
//   ANTHROPIC_API_KEY  —— 小马API的令牌(sk-开头)
//   XIAOMA_BASE_URL    —— 小马接口域名，默认 https://xiaoma.best（结尾不要带斜杠）
//   MODEL_NAME         —— 模型名，默认 claude-3-5-sonnet-20241022
//   RATE_LIMIT_PER_HOUR—— 每个IP每小时最多请求次数，默认 20

// 简单的内存限流（同一个 serverless 实例内有效，能挡住大部分恶意刷量）
const ipHits = new Map();

function checkRateLimit(ip, limitPerHour) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1小时
  const record = ipHits.get(ip);
  if (!record || now - record.start > windowMs) {
    ipHits.set(ip, { start: now, count: 1 });
    return true;
  }
  if (record.count >= limitPerHour) {
    return false;
  }
  record.count += 1;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "只支持 POST 请求" });
    return;
  }

  // 限流：按访客IP限制每小时请求次数
  const limitPerHour = parseInt(process.env.RATE_LIMIT_PER_HOUR || "20", 10);
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    "unknown";
  if (!checkRateLimit(ip, limitPerHour)) {
    res.status(429).json({ error: "请求过于频繁，请稍后再试（每小时限次）。" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "服务端未配置 ANTHROPIC_API_KEY，请在 Vercel 项目环境变量中添加（填小马API的令牌）" });
    return;
  }

  const baseUrl = process.env.XIAOMA_BASE_URL || "https://xiaoma.best";
  const model = process.env.MODEL_NAME || "claude-3-5-sonnet-20241022";

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "缺少 prompt 字段" });
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
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

    res.status(200).json({ text: text || "解读生成失败，请重试。" });
  } catch (e) {
    res.status(500).json({ error: e.message || "服务端请求异常" });
  }
}
