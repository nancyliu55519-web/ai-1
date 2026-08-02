import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import db from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(function loadEnv() {
  try {
    const p = path.join(__dirname, ".env");
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, "utf8").split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const eq = t.indexOf("=");
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        const v = t.slice(eq + 1).trim();
        if (!(k in process.env)) process.env[k] = v;
      }
    }
  } catch (e) {}
})();

const app = express();
app.use(express.json({ limit: "15mb" }));

app.use((req, res, next) => {
  try { decodeURIComponent(req.path); } catch (e) { return res.status(400).send("Bad Request"); }
  const low = req.path.toLowerCase();
  if (low.includes("..") || low.includes(".env") || low.includes(".pem") || low.includes(".git") || low.includes(".ssh") || low.includes("data.db")) {
    return res.status(404).send("Not Found");
  }
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || "fujiatianxia_secret_key";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.qq.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return next();
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
}
app.use(authenticateToken);

app.post("/api/auth/send-code", (req, res) => {
  const { email } = req.body || {};
  if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: "请输入有效的邮箱地址" });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expireAt = Date.now() + 5 * 60 * 1000;
  db.run("INSERT INTO email_codes (email, code, expire_at) VALUES (?, ?, ?)", [email.toLowerCase(), code, expireAt], (err) => {
    if (err) return res.status(500).json({ error: "验证码写入失败" });
    const mailOptions = {
      from: `"富甲天下" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "【富甲天下】登录验证码",
      text: `您的登录验证码是：${code}，5分钟内有效。如非本人操作请忽略。`,
    };
    transporter.sendMail(mailOptions, (error) => {
      if (error) { console.error("邮件发送失败:", error); return res.status(500).json({ error: "邮件发送失败，请稍后再试" }); }
      res.json({ message: "验证码已发送至您的邮箱，请注意查收" });
    });
  });
});

app.post("/api/auth/verify-code", (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ error: "邮箱和验证码不能为空" });
  const cleanEmail = email.toLowerCase().trim();
  db.get("SELECT * FROM email_codes WHERE email = ? AND code = ? AND expire_at > ? ORDER BY id DESC LIMIT 1", [cleanEmail, code, Date.now()], (err, row) => {
    if (err || !row) return res.status(400).json({ error: "验证码错误或已失效" });
    db.get("SELECT * FROM users WHERE email = ?", [cleanEmail], (err, user) => {
      if (err) return res.status(500).json({ error: "数据库查询异常" });
      if (user) {
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
        return res.json({ token, user: { id: user.id, email: user.email } });
      } else {
        db.run("INSERT INTO users (email) VALUES (?)", [cleanEmail], function (err) {
          if (err) return res.status(500).json({ error: "注册用户失败" });
          const newUser = { id: this.lastID, email: cleanEmail };
          const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: "30d" });
          res.json({ token, user: newUser });
        });
      }
    });
  });
});

app.get("/api/user/info", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "未登录" });
  res.json({ user: req.user });
});

app.get("/api/chat/history", (req, res) => {
  if (!req.user) return res.json({ history: [] });
  db.all("SELECT * FROM chat_histories WHERE user_id = ? ORDER BY updated_at DESC", [req.user.id], (err, rows) => {
    if (err) return res.json({ history: [] });
    const formatted = (rows || []).map((r) => ({
      id: r.id, systemId: r.system_id, systemName: r.system_name, castSummary: r.cast_summary,
      castInfo: JSON.parse(r.cast_info || "null"), castContext: r.cast_context,
      messages: JSON.parse(r.messages || "[]"), updatedAt: r.updated_at,
    }));
    res.json({ history: formatted });
  });
});

app.post("/api/chat/history/save", (req, res) => {
  if (!req.user) return res.json({ success: false });
  const { id, systemId, systemName, castSummary, castInfo, castContext, messages, updatedAt } = req.body || {};
  if (!id) return res.json({ success: false });
  db.run(
    `INSERT INTO chat_histories (id, user_id, system_id, system_name, cast_summary, cast_info, cast_context, messages, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET messages=excluded.messages, updated_at=excluded.updated_at, cast_summary=excluded.cast_summary`,
    [id, req.user.id, systemId, systemName, castSummary, JSON.stringify(castInfo), castContext, JSON.stringify(messages), updatedAt || Date.now()],
    (err) => { if (err) console.error("保存云端历史失败:", err); res.json({ success: !err }); }
  );
});

app.post("/api/chat/history/delete", (req, res) => {
  if (!req.user) return res.json({ success: false });
  const { id } = req.body || {};
  if (!id) return res.json({ success: false });
  db.run("DELETE FROM chat_histories WHERE id = ? AND user_id = ?", [id, req.user.id], (err) => { res.json({ success: !err }); });
});

app.post("/api/reading", async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "服务端未配置 ANTHROPIC_API_KEY" });
  const base = process.env.XIAOMA_BASE_URL || "https://xiaoma.best";
  const model = process.env.MODEL_NAME || "claude-3-5-sonnet-20241022";
  const { system, messages } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "缺少 messages" });
  try {
    const payload = { model, max_tokens: 1800, messages };
    if (typeof system === "string" && system.trim()) payload.system = system;
    const r = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(payload),
    });
    const raw = await r.text();
    let data;
    try { data = JSON.parse(raw); } catch { return res.status(502).json({ error: `上游非JSON回应：${raw.slice(0, 160)}` }); }
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "请求失败" });
    const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
    res.status(200).json({ text: text || "（这一卦我一时看不真切，你换个说法再问问？）" });
  } catch (e) {
    res.status(500).json({ error: e.message || "服务端异常" });
  }
});

const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));
app.get("*", (req, res) => { res.sendFile(path.join(distDir, "index.html")); });
app.use((err, req, res, next) => { res.status(400).send("Bad Request"); });

const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => { console.log(`富甲天下服务已启动，监听端口 ${PORT}`); });
