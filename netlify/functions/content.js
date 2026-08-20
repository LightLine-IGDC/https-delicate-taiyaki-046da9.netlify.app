/* 内容读写：
 *   GET  /api/content                 → 公开读取全部内容
 *   POST /api/content  (需管理员令牌) → 保存全部内容
 */
const { readContent, writeContent, getSecret, verifyToken } = require("./_lib");

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function isAuthorized(event) {
  const auth = event.headers && (event.headers.authorization || event.headers.Authorization) || "";
  const token = String(auth).replace(/^Bearer\s+/i, "");
  const payload = verifyToken(getSecret(), token);
  return !!(payload && payload.role === "admin");
}

exports.handler = async (event) => {
  // 公开读取
  if (event.httpMethod === "GET") {
    const content = await readContent();
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(content || {}) };
  }

  // 写入（需要鉴权）
  if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
    if (!isAuthorized(event)) {
      return { statusCode: 401, headers: JSON_HEADERS, body: JSON.stringify({ error: "未授权：请先登录" }) };
    }

    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (e) { body = {}; }

    if (!body.data || typeof body.data !== "object") {
      return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "缺少 data 字段" }) };
    }

    const payload = {
      data: body.data,
      articles: body.articles && typeof body.articles === "object" ? body.articles : {}
    };

    try {
      await writeContent(payload);
    } catch (e) {
      return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: "保存失败：" + ((e && e.message) || "存储不可用") }) };
    }
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ ok: true, savedAt: new Date().toISOString() }) };
  }

  return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: "方法不允许" }) };
};
