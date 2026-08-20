import test from "node:test";
import assert from "node:assert/strict";
import { cacheKey } from "../lib/cache.js";

test("cacheKey 相同输入产出相同 key", () => {
  const a = cacheKey({ imageBytes: Buffer.from("abc"), question: "q", provider: "p", model: "m", baseUrl: "https://x" });
  const b = cacheKey({ imageBytes: Buffer.from("abc"), question: "q", provider: "p", model: "m", baseUrl: "https://x" });
  assert.equal(a, b);
});

test("cacheKey 不同 baseUrl 产出不同 key", () => {
  const a = cacheKey({ imageBytes: Buffer.from("abc"), question: "q", provider: "p", model: "m", baseUrl: "https://a" });
  const b = cacheKey({ imageBytes: Buffer.from("abc"), question: "q", provider: "p", model: "m", baseUrl: "https://b" });
  assert.notEqual(a, b);
});

test("cacheKey 不同图片产出不同 key", () => {
  const a = cacheKey({ imageBytes: Buffer.from("a"), question: "", provider: "p", model: "m", baseUrl: "" });
  const b = cacheKey({ imageBytes: Buffer.from("b"), question: "", provider: "p", model: "m", baseUrl: "" });
  assert.notEqual(a, b);
});
