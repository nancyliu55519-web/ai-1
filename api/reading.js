// Vercel Serverless Function
// 部署后可通过 POST /api/reading 调用
// API key 只存在于服务端环境变量里，浏览器永远看不到
//
// 本版本对接「小马API」(xiaoma.best)，使用其 anthropic 兼容端点 /v1/messages
// 如果小马的接口域名不是 https://xiaoma.best，请在 Vercel 环境变量里设置 XIAOMA_BASE_URL 覆盖

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "只支持 POST 请求" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "服务端未配置 ANTHROPIC_API_KEY，请在 Vercel 项目环境变量中添加（填小马API的令牌）" });
    return;
  }

  // 接口域名，默认小马API；可用环境变量 XIAOMA_BASE_URL 覆盖
  const baseUrl = process.env.XIAOMA_BASE_URL || "https://xiaoma.best";
  // 模型名，可用环境变量 MODEL_NAME 覆盖，默认用小马上的 claude sonnet
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

