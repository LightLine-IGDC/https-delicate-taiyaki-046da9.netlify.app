import test from "node:test";
import assert from "node:assert/strict";
import { providerById, expandBaseUrl } from "../lib/providers.js";

test("providerById 未知 id 回退到 custom", () => {
  const p = providerById("nonexistent");
  assert.equal(p.id, "custom");
});

test("expandBaseUrl 用 vars 替换并编码", () => {
  assert.equal(expandBaseUrl("https://x/{ACCOUNT_ID}/v1", { ACCOUNT_ID: "a b" }), "https://x/a%20b/v1");
});

test("expandBaseUrl 未知占位符原样保留", () => {
  assert.equal(expandBaseUrl("https://x/{MISSING}/v1", {}), "https://x/{MISSING}/v1");
});
