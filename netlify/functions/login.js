/* 管理员登录：POST /api/login  { password } → { token }
 * 注意：本文件不依赖 @netlify/blobs，避免内容存储异常时登录也被连带崩溃 */
const crypto = require("crypto");

const JSON_HEADERS = { "Content-Type": "application/json" };

function getSecret() {
  return process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_PASSWORD || "";
}

function signToken(secret, payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + sig;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: "仅支持 POST" }) };
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminPassword) {
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: "未配置 ADMIN_PASSWORD 环境变量" }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (e) { body = {}; }

  if (body.password !== adminPassword) {
    return { statusCode: 401, headers: JSON_HEADERS, body: JSON.stringify({ error: "密码错误" }) };
  }

  const token = signToken(getSecret(), {
    role: "admin",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 天有效期
  });

  return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ token }) };
};
