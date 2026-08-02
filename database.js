// SQLite 数据库模块（用户、邮箱验证码、云端历史）
// 依赖 sqlite3 包。数据库文件存在同目录 data.db。
import sqlite3pkg from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const sqlite3 = sqlite3pkg.verbose();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "data.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("数据库打开失败:", err);
  else console.log("数据库已连接:", dbPath);
});

// 建表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s','now')*1000)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS email_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expire_at INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS chat_histories (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    system_id TEXT,
    system_name TEXT,
    cast_summary TEXT,
    cast_info TEXT,
    cast_context TEXT,
    messages TEXT,
    updated_at INTEGER
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_hist_user ON chat_histories(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_code_email ON email_codes(email)`);
});

export default db;
