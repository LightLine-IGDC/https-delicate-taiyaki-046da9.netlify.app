import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  contentHasImage,
  convertBlocksToEvidence,
  isHttpUrl,
  hostOf,
  resolveWorkspacePath
} from "../lib/index.js";

test("contentHasImage 识别 image 与嵌套 tool-result", () => {
  assert.equal(contentHasImage([{ type: "text", text: "x" }]), false);
  assert.equal(contentHasImage([{ type: "image", attachment: { attachmentId: "1" } }]), true);
  assert.equal(contentHasImage([{ type: "tool-result", content: [{ type: "image", attachment: { attachmentId: "1" } }] }]), true);
});

test("convertBlocksToEvidence 图片转文本、其它块透传", async () => {
  const seen = [];
  const service = {
    _rememberRef: (ref) => seen.push(ref),
    async analyzeAttachment(ref) { return { evidence: `E:${ref.attachmentId}` }; }
  };
  const out = await convertBlocksToEvidence([
    { type: "text", text: "hi" },
    { type: "image", attachment: { attachmentId: "a1", name: "x.png" } }
  ], service);
  assert.equal(out[0].text, "hi");
  assert.equal(out[1].type, "text");
  assert.ok(out[1].text.includes("E:a1"));
  assert.deepEqual(seen.map((r) => r.attachmentId), ["a1"]);
});

test("convertBlocksToEvidence 失败降级为错误文本", async () => {
  const service = {
    _rememberRef() {},
    async analyzeAttachment() { throw new Error("boom"); }
  };
  const out = await convertBlocksToEvidence([{ type: "image", attachment: { attachmentId: "a1" } }], service);
  assert.ok(out[0].text.includes("自动识图失败"));
  assert.ok(out[0].text.includes("boom"));
});

test("isHttpUrl / hostOf", () => {
  assert.equal(isHttpUrl("https://a.com/v1"), true);
  assert.equal(isHttpUrl("ftp://a.com"), false);
  assert.equal(isHttpUrl(""), false);
  assert.equal(hostOf("https://a.com:8443/v1"), "a.com:8443");
});

test("resolveWorkspacePath 允许工作区内相对/绝对路径", () => {
  const dir = mkdtempSync(join(tmpdir(), "dvc-ws-"));
  try {
    mkdirSync(join(dir, "sub"));
    writeFileSync(join(dir, "sub", "a.png"), "x");
    assert.equal(resolveWorkspacePath(dir, "sub/a.png"), realpathSync(join(dir, "sub", "a.png")));
    assert.equal(resolveWorkspacePath(dir, join(dir, "sub", "a.png")), realpathSync(join(dir, "sub", "a.png")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveWorkspacePath 拒绝 .. 越界与绝对路径", () => {
  const dir = mkdtempSync(join(tmpdir(), "dvc-ws-"));
  try {
    assert.throws(() => resolveWorkspacePath(dir, "../outside.png"), /超出工作区范围/);
    assert.throws(() => resolveWorkspacePath(dir, "/etc/passwd"), /超出工作区范围/);
    assert.throws(() => resolveWorkspacePath(dir, ""), /不能为空/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveWorkspacePath 拒绝符号链接逃逸", { skip: process.platform === "win32" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "dvc-ws-"));
  const outside = mkdtempSync(join(tmpdir(), "dvc-out-"));
  try {
    writeFileSync(join(outside, "s.png"), "x");
    symlinkSync(join(outside, "s.png"), join(dir, "link.png"));
    assert.throws(() => resolveWorkspacePath(dir, "link.png"), /超出工作区范围/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
