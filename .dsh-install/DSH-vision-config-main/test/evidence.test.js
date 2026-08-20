import test from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, parseEvidence, toEvidenceText } from "../lib/evidence.js";

test("buildPrompt 无问题时为基础提示", () => {
  const p = buildPrompt("");
  assert.ok(p.includes("minified JSON"));
  assert.ok(!p.includes("重点问题"));
});

test("buildPrompt 带问题时追加重点问题", () => {
  const p = buildPrompt("图中有几个红色方块？");
  assert.ok(p.includes("重点问题：图中有几个红色方块？"));
});

test("parseEvidence 解析完整 JSON", () => {
  const r = parseEvidence('{"a":"一个苹果","t":"APPLE","o":["苹果"],"v":["1"],"c":0.95}');
  assert.equal(r.a, "一个苹果");
  assert.equal(r.t, "APPLE");
  assert.deepEqual(r.o, ["苹果"]);
  assert.equal(r.c, "0.95");
});

test("parseEvidence 解析被代码块包裹的 JSON", () => {
  const r = parseEvidence('```json\n{"a":"OK"}\n```');
  assert.equal(r.a, "OK");
});

test("parseEvidence 提取首个花括号片段", () => {
  const r = parseEvidence('这是结果 {"a":"答案"} 结束');
  assert.equal(r.a, "答案");
});

test("parseEvidence 无法解析时退回原文作为 t", () => {
  const r = parseEvidence("无法识别");
  assert.equal(r.a, "");
  assert.equal(r.t, "无法识别");
});

test("toEvidenceText 转义竖线并截断超长内容", () => {
  const long = { a: "x".repeat(600) };
  const text = toEvidenceText({ index: 1, raw: JSON.stringify(long), source: "model" });
  assert.ok(text.startsWith("[图像证据 1|src=model|m=v1|a="));
  assert.ok(text.length <= 520);
});
