/**
 * dsh-vision-config — 模型输出 → 紧凑证据文本。
 * 格式（空字段省略）：
 *   [图像证据 N|src=模型|m=模式|a=答案|t=OCR文本|o=[对象]|e=[问题]|v=[数值]|c=置信度]
 */

const MAX_LENGTH = 520;

const PROMPT = [
  "你是图像证据提取器。请分析这张图片，只输出一行 minified JSON，不要 Markdown、不要解释、不要换行。",
  "字段定义：",
  '{"a":"一句话答案","t":"图中所有可见文字（逐字，无则空）","o":["主要对象"],"e":["可以回答的问题"],"v":["关键数值"],"c":0到1的置信度}',
  "如果完全无法识别，a 填“无法识别”。"
].join("\n");

export function buildPrompt(question = "") {
  const focus = String(question || "").trim();
  if (!focus) return PROMPT;
  return `${PROMPT}
重点问题：${focus}
字段 a 必须直接回答重点问题；其余字段继续记录可核对的客观证据。`;
}

function sanitize(value) {
  if (value === undefined || value === null) return "";
  const text = Array.isArray(value) ? value.join(";") : String(value);
  return text
    .replace(/[\|\n\r\t\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(obj) {
  const out = { a: "", t: "", o: [], e: [], v: [], c: "" };
  if (!obj || typeof obj !== "object") return out;
  out.a = sanitize(obj.a);
  out.t = sanitize(obj.t);
  out.o = Array.isArray(obj.o) ? obj.o.map(sanitize).filter(Boolean) : obj.o ? [sanitize(obj.o)] : [];
  out.e = Array.isArray(obj.e) ? obj.e.map(sanitize).filter(Boolean) : obj.e ? [sanitize(obj.e)] : [];
  out.v = Array.isArray(obj.v) ? obj.v.map(sanitize).filter(Boolean) : obj.v ? [sanitize(obj.v)] : [];
  const conf = Number(obj.c);
  if (Number.isFinite(conf) && conf >= 0 && conf <= 1) out.c = String(Math.round(conf * 100) / 100);
  return out;
}

/** 解析模型输出：先整体 JSON，再提取首个 {…} 片段，最后退回纯文本。 */
export function parseEvidence(raw) {
  if (!raw) return normalize(null);
  let text = String(raw).trim();
  text = text.replace(/^```[a-zA-Z0-9]*\s*/, "").replace(/\s*```$/, "").trim();

  try {
    return normalize(JSON.parse(text));
  } catch { /* continue */ }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return normalize(JSON.parse(text.slice(start, end + 1)));
    } catch { /* continue */ }
  }

  const fallback = normalize(null);
  fallback.t = sanitize(text);
  return fallback;
}

export function formatEvidence(parsed, { index, source = "模型", mode = "v1" }) {
  const seg = [`图像证据 ${index}`, `src=${sanitize(source)}`, `m=${sanitize(mode)}`];
  if (parsed.a) seg.push(`a=${parsed.a}`);
  if (parsed.t) seg.push(`t=${parsed.t}`);
  if (parsed.o.length) seg.push(`o=[${parsed.o.join(",")}]`);
  if (parsed.e.length) seg.push(`e=[${parsed.e.join(",")}]`);
  if (parsed.v.length) seg.push(`v=[${parsed.v.join(",")}]`);
  if (parsed.c) seg.push(`c=${parsed.c}`);
  return `[${seg.join("|")}]`;
}

export function toEvidenceText({ index, raw, source = "模型", mode = "v1" }) {
  const parsed = parseEvidence(raw);
  let line = formatEvidence(parsed, { index, source, mode });
  if (line.length > MAX_LENGTH) line = line.slice(0, MAX_LENGTH - 3) + "...";
  return line;
}
