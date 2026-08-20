/**
 * dsh-vision-config — 独立 DSH 识图插件。
 * 提供 visionService 服务：纯文本模型收到图片时，调用内置视觉 API 转成证据文本。
 * 不依赖任何外部 CLI / 用户插件。
 */

import { Service } from "@deepseek-ai/cordis";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, realpathSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { isAbsolute, join, extname, normalize, relative, resolve, sep } from "node:path";
import { PROVIDERS, providerById, expandBaseUrl } from "./providers.js";
import { analyze, TEST_IMAGE_DATA_URL } from "./call.js";
import { buildPrompt, toEvidenceText } from "./evidence.js";
import { VisionCache, cacheKey } from "./cache.js";

const CONFIG_DIR_NAME = "dsh-vision-config";
const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const DEFAULT_CONFIG = {
  provider: "alibaba",
  baseUrl: "",
  model: "",
  models: [],
  compressThresholdMB: 5,
  apiKeyEnv: ""
};

function resolveWorkspaceDir(ctx) {
  try {
    const registry = ctx.get("workspaceRegistry");
    if (registry && typeof registry.list === "function") {
      const workspaces = registry.list();
      const first = workspaces && workspaces[0];
      if (first && first.path) return first.path;
    }
  } catch { /* ignore */ }
  const dataDir = process.env.DSH_DATA_DIR || join(homedir(), ".dsh");
  try { mkdirSync(dataDir, { recursive: true }); } catch { /* ignore */ }
  return dataDir;
}

function extForMediaType(mediaType) {
  const t = String(mediaType || "").toLowerCase();
  if (t.includes("png")) return ".png";
  if (t.includes("webp")) return ".webp";
  if (t.includes("gif")) return ".gif";
  if (t.includes("bmp")) return ".bmp";
  return ".jpg";
}

function mediaTypeForPath(filePath) {
  switch (String(extname(String(filePath || ""))).toLowerCase()) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".gif": return "image/gif";
    default: return null;
  }
}

export function resolveWorkspacePath(workspaceDir, rawPath) {
  const raw = String(rawPath || "").trim();
  if (!raw) throw new Error("file_path 不能为空");
  const workspace = resolve(workspaceDir);
  const candidate = isAbsolute(raw) ? normalize(raw) : resolve(workspace, raw);
  const rel = relative(workspace, candidate);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`file_path 超出工作区范围（仅允许访问工作区内的图片）：${raw}`);
  }
  try {
    const real = realpathSync(candidate);
    const realWorkspace = realpathSync(workspace);
    const realRel = relative(realWorkspace, real);
    if (realRel === ".." || realRel.startsWith(`..${sep}`) || isAbsolute(realRel)) {
      throw new Error(`file_path 超出工作区范围（符号链接指向工作区外）：${raw}`);
    }
    return real;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("file_path ")) throw error;
    return candidate; // 文件不存在等场景交给后续 readFileSync 报错
  }
}

function isHttpUrl(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  try {
    const u = new URL(text);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function assertSafeBaseUrl(value) {
  if (!isHttpUrl(value)) throw new Error("baseUrl 必须是 http/https 地址");
}

function hostOf(value) {
  try { return new URL(String(value)).host; } catch { return ""; }
}

function runFfmpeg(input, output) {
  return new Promise((resolve, reject) => {
    execFile("ffmpeg", ["-y", "-i", input, "-q:v", "4", output], { timeout: 30000 }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function contentHasImage(content) {
  if (!Array.isArray(content)) return false;
  return content.some((block) => block?.type === "image" ||
    (block?.type === "tool-result" && contentHasImage(block.content)));
}

async function convertBlocksToEvidence(blocks, service, signal) {
  const out = [];
  for (const block of blocks) {
    if (block?.type === "image") {
      try {
        service._rememberRef(block.attachment);
        const result = await service.analyzeAttachment(block.attachment, "", signal);
        const label = block.attachment?.name ? `附件图片「${block.attachment.name}」` : "附件图片";
        out.push({ type: "text", text: `[${label} 已自动转为图像证据，请以证据内容为依据回答] ${result.evidence}` });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        out.push({ type: "text", text: `[附件图片自动识图失败：${message}]` });
      }
    } else if (block?.type === "tool-result" && Array.isArray(block.content)) {
      out.push({ ...block, content: await convertBlocksToEvidence(block.content, service, signal) });
    } else {
      out.push(block);
    }
  }
  return out;
}

/** 图片超过阈值时压缩为 JPEG q80；任何失败静默回退原图。 */
async function maybeCompress(bytes, mediaType, thresholdMB) {
  const threshold = Number(thresholdMB) > 0 ? Number(thresholdMB) : 5;
  if (!bytes || bytes.length <= threshold * 1024 * 1024) return bytes;
  const input = join(tmpdir(), `dvc-in-${randomUUID()}${extForMediaType(mediaType)}`);
  const output = join(tmpdir(), `dvc-out-${randomUUID()}.jpg`);
  try {
    await new Promise((resolve, reject) => {
      writeFileSync(input, bytes);
      resolve();
    });
    await runFfmpeg(input, output);
    const compressed = readFileSync(output);
    return compressed.length < bytes.length ? compressed : bytes;
  } catch {
    return bytes;
  } finally {
    try { rmSync(input, { force: true }); } catch { /* ignore */ }
    try { rmSync(output, { force: true }); } catch { /* ignore */ }
  }
}


function attachmentStoreOf(ctx) {
  try {
    return ctx.get("attachments", false);
  } catch {
    return undefined;
  }
}

/** 从会话事件中找出模型可见的 durable 图片引用。 */
function findImageRefInValue(value, attachmentId, seen = new Set()) {
  if (!value || typeof value !== "object") return undefined;
  if (seen.has(value)) return undefined;
  seen.add(value);
  if (value.type === "image" && value.attachment && typeof value.attachment === "object" &&
      String(value.attachment.attachmentId) === String(attachmentId)) {
    return value.attachment;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageRefInValue(item, attachmentId, seen);
      if (found) return found;
    }
    return undefined;
  }
  for (const item of Object.values(value)) {
    const found = findImageRefInValue(item, attachmentId, seen);
    if (found) return found;
  }
  return undefined;
}

function findImageRefInSession(session, attachmentId) {
  if (!session || !Array.isArray(session.events)) return undefined;
  for (const event of session.events) {
    const found = findImageRefInValue(event, attachmentId);
    if (found) return found;
  }
  return undefined;
}

/** 深度优先（数组/键均倒序）找最近一张图片的 durable 引用。 */
function findLatestImageAttachment(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return undefined;
  seen.add(value);
  if (value.type === "image" && value.attachment && typeof value.attachment === "object" && value.attachment.attachmentId) {
    return value.attachment;
  }
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i--) {
      const found = findLatestImageAttachment(value[i], seen);
      if (found) return found;
    }
    return undefined;
  }
  const keys = Object.keys(value);
  for (let i = keys.length - 1; i >= 0; i--) {
    const found = findLatestImageAttachment(value[keys[i]], seen);
    if (found) return found;
  }
  return undefined;
}

function findLatestImageInSession(session) {
  if (!session || !Array.isArray(session.events)) return undefined;
  for (let i = session.events.length - 1; i >= 0; i--) {
    const found = findLatestImageAttachment(session.events[i]);
    if (found) return found;
  }
  return undefined;
}

export class VisionConfigPlugin extends Service {
  constructor(ctx, config = {}) {
    super(ctx, "visionService");
    this.ctx = ctx;
    this.workspaceDir = resolveWorkspaceDir(ctx);
    this.configDir = join(this.workspaceDir, CONFIG_DIR_NAME);
    this.configPath = join(this.configDir, "config.json");
    this.refsPath = join(this.configDir, "attachment-refs.json");
    try {
      mkdirSync(this.configDir, { recursive: true });
    } catch { /* ignore */ }
    this.cache = new VisionCache(join(this.workspaceDir, "vision-cache"));
    this.refs = this._loadRefs();
    this.config = this._loadConfig();
    this._routeDisposers = [];
    this._registerRoutes();
  }

  // ---------- 配置 ----------

  _loadConfig() {
    const base = { ...DEFAULT_CONFIG };
    try {
      if (existsSync(this.configPath)) {
        const saved = JSON.parse(readFileSync(this.configPath, "utf8"));
        for (const key of Object.keys(DEFAULT_CONFIG)) {
          if (saved[key] !== undefined) base[key] = saved[key];
        }
      }
    } catch (error) {
      try { this.ctx.logger?.warn?.(`vision-config: 读取配置失败：${error instanceof Error ? error.message : String(error)}`); } catch { /* ignore */ }
    }
    const provider = providerById(base.provider);
    if (!base.baseUrl) base.baseUrl = provider.baseUrl;
    if (!base.model) base.model = provider.defaultModel;
    return base;
  }

  _publicConfig() {
    const provider = providerById(this.config.provider);
    return {
      provider: this.config.provider,
      providerName: provider.name,
      baseUrl: this.config.baseUrl,
      model: this.config.model,
      models: this.config.models || [],
      compressThresholdMB: this.config.compressThresholdMB,
      apiKeyEnv: this.config.apiKeyEnv || provider.apiKeyEnv
    };
  }

  _saveConfig(patch) {
    const provider = providerById(patch.provider ?? this.config.provider);
    const next = {
      provider: patch.provider ?? this.config.provider,
      baseUrl: patch.baseUrl !== undefined ? patch.baseUrl : this.config.baseUrl,
      model: patch.model !== undefined ? patch.model : this.config.model,
      models: Array.isArray(patch.models) ? patch.models : this.config.models || [],
      compressThresholdMB: Number(patch.compressThresholdMB) > 0 ? Number(patch.compressThresholdMB) : this.config.compressThresholdMB,
      apiKeyEnv: patch.apiKeyEnv !== undefined ? String(patch.apiKeyEnv) : this.config.apiKeyEnv
    };
    if (!next.baseUrl) next.baseUrl = provider.baseUrl;
    if (!next.model) next.model = provider.defaultModel;
    this.config = next;
    try {
      writeFileSync(this.configPath, JSON.stringify(next, null, 2));
    } catch (error) {
      try { this.ctx.logger?.warn?.(`vision-config: 保存配置失败：${error instanceof Error ? error.message : String(error)}`); } catch { /* ignore */ }
    }
    return this._publicConfig();
  }

  // ---------- durable 图片引用 ----------

  _loadRefs() {
    try {
      const saved = JSON.parse(readFileSync(this.refsPath, "utf8"));
      if (!saved || typeof saved !== "object") return new Map();
      return new Map(Object.entries(saved).filter(([, ref]) => ref && typeof ref === "object"));
    } catch (error) {
      try { this.ctx.logger?.warn?.(`vision-config: 读取附件引用失败：${error instanceof Error ? error.message : String(error)}`); } catch { /* ignore */ }
      return new Map();
    }
  }

  _rememberRef(ref) {
    if (!ref?.attachmentId) return;
    this.refs.set(String(ref.attachmentId), {
      attachmentId: String(ref.attachmentId),
      mediaType: ref.mediaType,
      bytes: Number(ref.bytes),
      width: Number(ref.width),
      height: Number(ref.height),
      ...(ref.name === undefined ? {} : { name: String(ref.name) })
    });
    // 避免长期运行的实例无限增长；旧引用仍可由当前 session 事件解析。
    while (this.refs.size > 1000) this.refs.delete(this.refs.keys().next().value);
    try {
      writeFileSync(this.refsPath, JSON.stringify(Object.fromEntries(this.refs), null, 2));
    } catch (error) {
      try { this.ctx.logger?.warn?.(`vision-config: 保存附件引用失败：${error instanceof Error ? error.message : String(error)}`); } catch { /* ignore */ }
    }
  }

  resolveAttachmentRef(attachmentId, exec, metadata = {}) {
    const id = String(attachmentId || "").trim();
    if (!id) throw new Error("attachment_id 不能为空");
    const known = this.refs.get(id) || findImageRefInSession(exec?.agent?.session, id);
    if (known) {
      this._rememberRef(known);
      return known;
    }
    const ref = {
      attachmentId: id,
      mediaType: metadata.media_type,
      bytes: Number(metadata.bytes),
      width: Number(metadata.width),
      height: Number(metadata.height),
      ...(metadata.name ? { name: String(metadata.name) } : {})
    };
    if (!/^image\/(png|jpeg|webp|gif)$/.test(String(ref.mediaType)) ||
        !Number.isInteger(ref.bytes) || ref.bytes <= 0 ||
        !Number.isInteger(ref.width) || ref.width <= 0 ||
        !Number.isInteger(ref.height) || ref.height <= 0) {
      throw new Error(`找不到图片附件 ${id} 的完整引用；请同时提供 media_type、bytes、width、height，或先在当前会话中出现该图片`);
    }
    this._rememberRef(ref);
    return ref;
  }

  /** 模型未提供 attachment_id 时，自动定位当前会话里最近的一张图（不跨会话）。 */
  resolveCurrentImage(exec) {
    const fromSession = findLatestImageInSession(exec?.agent?.session);
    if (fromSession) {
      this._rememberRef(fromSession);
      return fromSession;
    }
    // 不跨会话回退：其它会话的图片可能与本会话无关，避免误分析/隐私泄漏。
    // 插件在证据文本中会附带 attachment_id，模型可显式传入。
    throw new Error("当前会话中没有找到可识别的图片：请先发送一张图片，或显式传入 attachment_id");
  }

  // ---------- 凭据 ----------

  async _apiKey(envName) {
    const name = envName || this.config.apiKeyEnv || providerById(this.config.provider).apiKeyEnv;
    const creds = this.ctx.get("credentials");
    if (creds && typeof creds.resolve === "function") {
      try {
        // dsh resolve 返回 { value, source }（也可能直接返回字符串），只取 value
        const resolved = await creds.resolve(name);
        const key = resolved && typeof resolved === "object" ? resolved.value : resolved;
        if (key) return key;
      } catch { /* ignore */ }
    }
    if (typeof process !== "undefined" && process.env[name]) return process.env[name];
    return null;
  }

  // ---------- 模型列表 ----------

  async _listModels(providerId, baseUrl, envName, apiKeyOverride) {
    const provider = providerById(providerId);
    const effectiveBase = expandBaseUrl(baseUrl || provider.baseUrl, {});
    const preset = (this.config.models && this.config.models.length ? this.config.models : provider.models) || [];
    const key = apiKeyOverride || await this._apiKey(envName || this.config.apiKeyEnv);
    if (!effectiveBase || !key) return { models: preset, source: "preset", reason: key ? "bad-url" : "no-key" };
    if (!isHttpUrl(effectiveBase)) return { models: preset, source: "preset", reason: "bad-url" };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(effectiveBase.replace(/\/+$/, "") + "/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: controller.signal
      });
      if (!response.ok) return { models: preset, source: "preset", reason: `http-${response.status}` };
      const data = await response.json();
      const ids = (Array.isArray(data?.data) ? data.data : [])
        .map((m) => (m && typeof m === "object" ? m.id : m))
        .filter((id) => typeof id === "string" && id.length > 0);
      if (ids.length) return { models: [...new Set(ids)], source: "live", reason: "" };
      return { models: preset, source: "preset", reason: "empty" };
    } catch {
      return { models: preset, source: "preset", reason: "error" };
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------- 识图主逻辑 ----------

  async _analyzeBytes({ bytes, mediaType, question = "", index = 1, signal }) {
    const cfg = this.config;
    const provider = providerById(cfg.provider || "custom");
    const baseUrl = expandBaseUrl(cfg.baseUrl || provider.baseUrl, {});
    assertSafeBaseUrl(baseUrl);
    const model = cfg.model || provider.defaultModel;
    const prompt = buildPrompt(question);
    const imageBytes = await maybeCompress(bytes, mediaType, cfg.compressThresholdMB);
    if (imageBytes.length > MAX_INPUT_BYTES) {
      throw new Error(`图片过大（${(bytes.length / 1024 / 1024).toFixed(1)}MB，压缩后仍超过 ${MAX_INPUT_BYTES / 1024 / 1024}MB），无法识图`);
    }
    const dataUrl = `data:${imageBytes === bytes ? mediaType : "image/jpeg"};base64,${imageBytes.toString("base64")}`;
    const key = cacheKey({ imageBytes, question: prompt, provider: provider.id, model, baseUrl });
    let evidence = this.cache.get(key);
    let cached = evidence != null;
    if (evidence == null) {
      const apiKey = await this._apiKey(cfg.apiKeyEnv);
      if (!apiKey) {
        const env = cfg.apiKeyEnv || provider.apiKeyEnv;
        throw new Error(`未配置 API Key（环境变量 ${env}）`);
      }
      const raw = await analyze({
        provider: provider.id,
        apiKey,
        baseUrl,
        model,
        prompt,
        imageDataUrl: dataUrl,
        maxTokens: 900,
        timeoutMs: 60000,
        signal
      });
      evidence = toEvidenceText({ index, raw, source: model, mode: question ? "tool" : "v1" });
      this.cache.set(key, evidence);
    }
    return { evidence, provider: provider.id, model, cached };
  }

  async analyzeAttachment(ref, question = "", signal, index = 1) {
    const attachments = attachmentStoreOf(this.ctx);
    if (!attachments || typeof attachments.readImage !== "function") {
      throw new Error("当前运行环境没有 attachments 服务，无法读取图片附件");
    }
    const stored = await attachments.readImage(ref, signal);
    return this._analyzeBytes({
      bytes: Buffer.from(stored.data),
      mediaType: stored.ref?.mediaType || ref.mediaType,
      question,
      index,
      signal
    });
  }

  /** 把 file_path 限制在工作区目录内（拒绝 .. 越界与符号链接逃逸）。 */
  _resolveWorkspacePath(rawPath) {
    return resolveWorkspacePath(this.workspaceDir, rawPath);
  }

  async analyzeFilePath(filePath, question = "", signal) {
    const path = this._resolveWorkspacePath(filePath);
    const mediaType = mediaTypeForPath(path);
    if (!mediaType) throw new Error(`不支持的图片格式：${path}（仅支持 png/jpeg/webp/gif）`);
    let bytes;
    try {
      bytes = readFileSync(path);
    } catch {
      throw new Error(`无法读取本地图片文件：${path}`);
    }
    if (!bytes || bytes.length === 0) throw new Error(`图片文件为空：${path}`);
    if (bytes.length > MAX_INPUT_BYTES) {
      throw new Error(`图片文件过大（>${MAX_INPUT_BYTES / 1024 / 1024}MB）：${path}`);
    }
    return this._analyzeBytes({ bytes, mediaType, question, index: 1, signal });
  }

  async textFallback(content, signal) {
    const parts = [];
    let imageIndex = 0;
    const attachments = attachmentStoreOf(this.ctx);

    for (const part of content) {
      if (!part || part.type !== "image") {
        parts.push(part);
        continue;
      }
      imageIndex += 1;
      const mediaType = part.mediaType || "image/jpeg";
      const rawBytes = Buffer.from(String(part.data || ""), "base64");
      let ref;
      try {
        // 纯文本模型走这个 fallback 时，原始图片尚未进入 durable store；先保存，
        // 这样后续模型可以拿着 attachment_id 自主调用 vision_analyze。
        if (attachments?.saveImage) {
          ref = await attachments.saveImage({ data: rawBytes, mediaType, name: part.name });
          this._rememberRef(ref);
        }
        const result = await this._analyzeBytes({ bytes: rawBytes, mediaType, index: imageIndex, signal });
        const handle = ref
          ? `；attachment_id=${ref.attachmentId}（如需针对性复查，请调用 vision_analyze，question 写明要确认的内容）`
          : "";
        parts.push({
          type: "text",
          text: `[附件图片 ${imageIndex} 已自动转为图像证据，请以证据内容为依据回答]${handle} ${result.evidence}`
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        parts.push({
          type: "text",
          text: `[附件图片 ${imageIndex} 自动识图失败：${message}]`
        });
        try { this.ctx.logger?.warn?.(`vision-config: textFallback 识图失败：${message}`); } catch { /* ignore */ }
      }
    }
    return parts;
  }

  // ---------- HTTP API ----------

  _registerRoutes() {
    const webServer = this.ctx.get("webServer");
    if (!webServer || typeof webServer.register !== "function") return;
    const self = this;
    const byPath = new Map();

    const adapter = async (req, res) => {
      try {
        const url = new URL(req.url || "/", "http://x");
        req.query = Object.fromEntries(url.searchParams);
        req.body = {};
        if (req.method !== "GET" && req.method !== "HEAD") {
          req.body = await new Promise((resolve) => {
            let data = "";
            req.on("data", (chunk) => { data += chunk; });
            req.on("end", () => {
              try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
            });
          });
        }
        const origin = req.headers["origin"];
        const host = req.headers["host"];
        let sameOrigin = false;
        if (origin) {
          try {
            const o = new URL(origin);
            const h = new URL("http://" + (host || ""));
            sameOrigin = o.host === h.host;
          } catch { sameOrigin = false; }
        }
        if ((origin && !sameOrigin) || req.headers["sec-fetch-site"] === "cross-site") {
          res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: "forbidden" }));
          return;
        }
        const handler = byPath.get(url.pathname)?.[req.method];
        if (!handler) {
          res.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: "method not allowed" }));
          return;
        }
        res.json = (obj) => {
          const payload = JSON.stringify(obj);
          res.writeHead(res.statusCode || 200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(payload);
        };
        res.status = (code) => { res.statusCode = code; return res; };
        await handler(req, res);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: message }));
      }
    };

    const register = (method, path, handler) => {
      const entry = byPath.get(path) || {};
      entry[method] = handler;
      byPath.set(path, entry);
      if (Object.keys(entry).length === 1) {
        const disposer = webServer.register({ kind: "exact", path, handler: adapter });
        if (typeof disposer === "function") this._routeDisposers.push(disposer);
      }
    };

    // GET /vision/api/config
    register("GET", "/vision/api/config", (_req, res) => {
      res.json({ ok: true, config: self._publicConfig() });
    });

    // GET /vision/api/providers — 供应商清单（设置页以此为单一来源，避免与内置表漂移）
    register("GET", "/vision/api/providers", (_req, res) => {
      res.json({
        ok: true,
        providers: PROVIDERS.map((p) => ({
          id: p.id,
          name: p.name,
          baseUrl: p.baseUrl,
          apiKeyEnv: p.apiKeyEnv,
          defaultModel: p.defaultModel
        }))
      });
    });

    // POST /vision/api/config — 不接收 API Key
    register("POST", "/vision/api/config", (req, res) => {
      const body = req.body || {};
      const provider = providerById(body.provider || self.config.provider);
      const allowed = ["provider", "baseUrl", "model", "models", "compressThresholdMB", "apiKeyEnv"];
      const patch = {};
      for (const key of allowed) {
        if (body[key] !== undefined) patch[key] = body[key];
      }
      if (patch.provider !== undefined && providerById(patch.provider).id === "custom" && !patch.baseUrl) {
        patch.baseUrl = body.baseUrl || "";
      }
      if (patch.baseUrl !== undefined && String(patch.baseUrl).trim() !== "" && !isHttpUrl(String(patch.baseUrl))) {
        res.json({ ok: false, error: "Base URL 必须是 http/https 地址" });
        return;
      }
      res.json({ ok: true, config: self._saveConfig(patch) });
    });

    // GET /vision/api/models?provider=&env=
    // 安全：只使用已保存配置的 baseUrl，忽略查询参数传入的 baseUrl，
    // 避免外部页面诱导服务端携带存储的 API Key 请求任意地址。
    register("GET", "/vision/api/models", async (req, res) => {
      const providerId = providerById(req.query.provider || self.config.provider).id;
      const provider = providerById(providerId);
      const baseUrl = self.config.baseUrl || provider.baseUrl;
      const env = req.query.env || self.config.apiKeyEnv;
      if (providerId === "custom" && !self.config.baseUrl) {
        res.json({ ok: true, models: [], source: "preset", reason: "custom-need-save", provider: providerId });
        return;
      }
      const result = await self._listModels(providerId, baseUrl, env);
      res.json({ ok: true, ...result, provider: providerId });
    });

    // POST /vision/api/test — 临时 apiKey 仅用于测试，不落盘
    register("POST", "/vision/api/test", async (req, res) => {
      const body = req.body || {};
      const providerId = body.provider || self.config.provider;
      const provider = providerById(providerId);
      const baseUrl = expandBaseUrl(body.baseUrl || self.config.baseUrl || provider.baseUrl, {});
      const model = body.model || self.config.model || provider.defaultModel;
      if (!baseUrl || !model) {
        res.json({ ok: false, error: "请先配置供应商 Base URL 和模型" });
        return;
      }
      if (!isHttpUrl(baseUrl)) {
        res.json({ ok: false, error: "Base URL 必须是 http/https 地址" });
        return;
      }
      // 安全：仅当目标 host 与已保存配置一致时才允许使用存储的 Key；
      // 测试新的/未保存的地址必须显式传入 apiKey，避免存储 Key 被发往任意地址。
      const savedBase = expandBaseUrl(self.config.baseUrl || provider.baseUrl, {});
      const sameHost = hostOf(baseUrl) === hostOf(savedBase);
      const apiKey = body.apiKey || (sameHost ? await self._apiKey(body.env || self.config.apiKeyEnv) : null);
      if (!apiKey) {
        const env = body.env || self.config.apiKeyEnv || provider.apiKeyEnv;
        res.json({ ok: false, error: sameHost
          ? `未配置 API Key（环境变量 ${env}）`
          : "测试未保存的 Base URL 时请在请求中显式提供 apiKey" });
        return;
      }
      try {
        const result = await analyze({
          provider: providerId,
          apiKey,
          baseUrl,
          model,
          prompt: "请描述这张测试图片中的内容（颜色/形状/文字）。",
          imageDataUrl: TEST_IMAGE_DATA_URL,
          maxTokens: 200,
          timeoutMs: 60000
        });
        res.json({ ok: true, result: String(result).slice(0, 500), provider: providerId, model });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.json({ ok: false, error: message });
      }
    });

    // POST /vision/api/key — 将 API Key 写入 dsh 凭据层（等同环境变量，立即生效；不写入配置文件）
    // body: { envName, apiKey } 或 { envName, unset: true }
    register("POST", "/vision/api/key", async (req, res) => {
      const body = req.body || {};
      const envName = String(body.envName || "").trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(envName)) {
        res.json({ ok: false, error: "环境变量名非法，需为字母/下划线开头、仅含字母数字下划线" });
        return;
      }
      const creds = self.ctx.get("credentials");
      if (!creds || typeof creds.set !== "function" || typeof creds.unset !== "function") {
        res.json({ ok: false, error: "当前运行环境不支持写入凭据（credentials 服务不可用）" });
        return;
      }
      try {
        if (body.unset === true || body.apiKey === undefined || String(body.apiKey).trim() === "") {
          await creds.unset(envName);
          res.json({ ok: true, envName, saved: false, message: `已清除凭据 ${envName}` });
        } else {
          const apiKey = String(body.apiKey).trim();
          if (apiKey.length < 4) {
            res.json({ ok: false, error: "API Key 太短" });
            return;
          }
          await creds.set(envName, apiKey);
          res.json({ ok: true, envName, saved: true, message: `已保存到凭据 ${envName}（等同环境变量，立即生效）` });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.json({ ok: false, error: "保存失败：" + message });
      }
    });
  }
}

/** 注册给模型的自主识图工具。使用原始 JSON Schema，避免插件额外依赖一套 dsh-tools。 */
function registerVisionTool(ctx, service) {
  service.toolRegistrationState = "starting";
  const tools = (() => {
    try { return ctx.tools; } catch { return undefined; }
  })();
  if (!tools || typeof tools.register !== "function") {
    service.toolRegistrationState = "tools-unavailable";
    return () => {};
  }
  const dispose = tools.register({
    name: "vision_analyze",
    description: "Analyze an image with the configured vision model. Call this tool whenever the user sends or references an image and the answer depends on visual content; do not guess. Use file_path to analyze a local image file; use attachment_id for a session attachment; omit both to analyze the most recent image in the current conversation. Put the exact visual question in question; omit it only for a general objective description.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        attachment_id: {
          type: "string",
          description: "Optional. Opaque id of a specific image to analyze. Omit to analyze the most recent image in the current conversation."
        },
        file_path: {
          type: "string",
          description: "Optional. Path to an image file (PNG/JPEG/WebP/GIF) inside the current workspace only (paths outside the workspace are rejected). Use this when the image is a local file, not a session attachment."
        },
        question: {
          type: "string",
          description: "Specific question to answer from the image."
        },
        media_type: {
          type: "string",
          enum: ["image/png", "image/jpeg", "image/webp", "image/gif"],
          description: "Only needed when the attachment_id is not present in the current session or plugin index."
        },
        bytes: { type: "integer", description: "Image byte length, only needed with media_type/width/height." },
        width: { type: "integer", description: "Image width in pixels, only needed with media_type/bytes/height." },
        height: { type: "integer", description: "Image height in pixels, only needed with media_type/bytes/width." },
        name: { type: "string", description: "Optional image name." }
      },
      required: []
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          ok: { type: "boolean" },
          attachmentId: { type: "string" },
          question: { type: "string" },
          evidence: { type: "string" },
          provider: { type: "string" },
          model: { type: "string" },
          cached: { type: "boolean" }
        },
        required: ["ok", "attachmentId", "question", "evidence", "provider", "model", "cached"]
      },
      render: (_args, value) => [{
        type: "text",
        text: `图片 ${value.attachmentId} 的识图结果${value.question ? `（问题：${value.question}）` : ""}：${value.evidence}`
      }]
    },
    timeoutMs: 90000,
    async execute(args, exec) {
      const question = String(args.question || "").trim();
      if (args.file_path) {
        const path = String(args.file_path).trim();
        const result = await service.analyzeFilePath(path, question, exec.signal);
        return {
          ok: true,
          attachmentId: path,
          question,
          evidence: result.evidence,
          provider: result.provider,
          model: result.model,
          cached: result.cached
        };
      }
      const ref = args.attachment_id
        ? service.resolveAttachmentRef(args.attachment_id, exec, args)
        : service.resolveCurrentImage(exec);
      const result = await service.analyzeAttachment(ref, question, exec.signal);
      return {
        ok: true,
        attachmentId: String(ref.attachmentId),
        question,
        evidence: result.evidence,
        provider: result.provider,
        model: result.model,
        cached: result.cached
      };
    },
    presentCall: (args) => ({
      card: "generic",
      title: args.file_path
        ? `Analyze image file ${args.file_path}`
        : (args.attachment_id ? `Analyze image ${args.attachment_id}` : "Analyze the most recent image"),
      kind: "read",
      rawInput: args.question || "general description"
    })
  });
  service.toolRegistrationState = "registered";
  return dispose;
}

function registerStreamBridge(ctx, service) {
  const dispose = ctx.on("llm/stream", function (options, next) {
    if (!options?.messages?.some((m) => contentHasImage(m.content))) return next();
    const attachments = ctx.get("attachments", false);
    if (!attachments) return next();
    const self = this;
    return (async function* () {
      let info;
      try {
        info = await self.resolveModelInfo?.(options.provider, options.model, options.signal);
      } catch { info = undefined; }
      // 支持图片输入的模型：原样放行
      if (info?.inputModalities?.includes("image")) { yield* next(); return; }
      const messages = [];
      for (const message of options.messages) {
        if (!contentHasImage(message.content)) { messages.push(message); continue; }
        messages.push({ ...message, content: await convertBlocksToEvidence(message.content, service, options.signal) });
      }
      yield* self.adapterStream({ ...options, messages });
    })();
  }, { global: true });
  return () => { try { dispose?.(); } catch { /* ignore */ } };
}

export { contentHasImage, convertBlocksToEvidence };
export { isHttpUrl, hostOf };

export const name = "vision-config-plugin";
export const inject = ["webServer", "credentials", "tools", "attachments"];

export function apply(ctx, config = {}) {
  const service = new VisionConfigPlugin(ctx, config);
  const disposers = [
    registerVisionTool(ctx, service),
    registerStreamBridge(ctx, service),
    ...(service._routeDisposers || [])
  ].filter(Boolean);
  return () => {
    for (const dispose of disposers) {
      try { dispose(); } catch { /* ignore */ }
    }
  };
}

export default { name, inject, apply };
export { PROVIDERS };
