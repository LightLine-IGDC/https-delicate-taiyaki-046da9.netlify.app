/* 共享工具：内容存储（Netlify Blobs）与管理员令牌签发/校验 */
const crypto = require("crypto");
const { getStore } = require("@netlify/blobs");

const STORE_NAME = "site-content";
const CONTENT_KEY = "content";

function getContentStore() {
  return getStore(STORE_NAME);
}

async function readContent() {
  try {
    const store = getContentStore();
    const raw = await store.get(CONTENT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  } catch (e) {
    // Blobs 不可用（未配置 / 网络异常）时回退为空，避免函数直接 502 崩溃
    return null;
  }
}

async function writeContent(obj) {
  const store = getContentStore();
  await store.set(CONTENT_KEY, JSON.stringify(obj));
}

function getSecret() {
  return process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_PASSWORD || "";
}

// 用 HMAC-SHA256 生成一个带过期时间的令牌
function signToken(secret, payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + sig;
}

// 校验令牌，通过则返回 payload，否则返回 null
function verifyToken(secret, token) {
  if (!secret || !token) return null;
  try {
    const parts = String(token).split(".");
    if (parts.length !== 2) return null;
    const body = parts[0];
    const sig = parts[1];
    const expect = crypto.createHmac("sha256", secret).update(body).digest("base64url");
    if (sig !== expect) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

module.exports = { readContent, writeContent, getSecret, signToken, verifyToken };
