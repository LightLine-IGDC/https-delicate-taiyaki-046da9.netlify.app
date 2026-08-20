/**
 * dsh-vision-config — SHA-256 文件缓存。
 * 24h TTL，上限 1000，缓存目录为工作区 dataDir/vision-cache/。
 * 命中不重写磁盘（按创建时间淘汰），避免高频读写。
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 1000;

export function cacheKey({ imageBytes, question, provider, model, baseUrl }) {
  const hash = createHash("sha256");
  hash.update(Buffer.isBuffer(imageBytes) ? imageBytes : String(imageBytes));
  hash.update("\u0000");
  hash.update(String(baseUrl ?? ""));
  hash.update("\u0000");
  hash.update(String(question ?? ""));
  hash.update("\u0000");
  hash.update(String(provider ?? ""));
  hash.update("\u0000");
  hash.update(String(model ?? ""));
  return hash.digest("hex");
}

export class VisionCache {
  constructor(dir) {
    this.dir = dir;
    try {
      mkdirSync(dir, { recursive: true });
    } catch { /* ignore */ }
  }

  _path(key) {
    return join(this.dir, key + ".json");
  }

  get(key) {
    try {
      const file = this._path(key);
      if (!existsSync(file)) return null;
      const entry = JSON.parse(readFileSync(file, "utf8"));
      if (!entry || Date.now() - Number(entry.createdAt || 0) > TTL_MS) {
        this._remove(key);
        return null;
      }
      return typeof entry.evidence === "string" ? entry.evidence : null;
    } catch {
      return null;
    }
  }

  set(key, evidence) {
    try {
      writeFileSync(this._path(key), JSON.stringify({
        key,
        evidence,
        createdAt: Date.now(),
        touchedAt: Date.now()
      }));
      this._trim();
    } catch { /* ignore */ }
  }

  _remove(key) {
    try {
      unlinkSync(this._path(key));
    } catch { /* ignore */ }
  }

  _trim() {
    try {
      const files = readdirSync(this.dir).filter((f) => f.endsWith(".json"));
      if (files.length <= MAX_ENTRIES) return;
      const sorted = files
        .map((f) => ({ f, m: statSync(join(this.dir, f)).mtimeMs }))
        .sort((a, b) => a.m - b.m);
      for (const item of sorted.slice(0, files.length - MAX_ENTRIES)) {
        this._remove(item.f.slice(0, -5));
      }
    } catch { /* ignore */ }
  }
}
