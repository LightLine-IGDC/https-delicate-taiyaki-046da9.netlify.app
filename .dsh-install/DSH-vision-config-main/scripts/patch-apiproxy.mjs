#!/usr/bin/env node
/**
 * dsh-vision-config —— dsh-host-apiproxy 图片守卫补丁脚本
 *
 * 背景：DSH 核心 dsh-host-apiproxy 有两处图片模态守卫（selectModel 切换模型 /
 * prompt 发送图片），在会话含图或发送图片时会拦截不支持图片输入的模型。
 * 本插件通过 ctx.get("visionService") 提供 textFallback 视觉回退，因此这两处
 * 守卫在存在该服务时应放行。在官方合入上游 deepseek-ai/deepseek-harness 之前，
 * 升级/重装 DSH 后需用本脚本重新打补丁。
 *
 * 用法：
 *   node scripts/patch-apiproxy.mjs          # 打补丁（已打过则跳过）
 *   node scripts/patch-apiproxy.mjs --check  # 仅检查状态
 *   node scripts/patch-apiproxy.mjs --dry-run# 预览不写盘
 */
import { execFileSync } from "node:child_process";
import {
  copyFileSync, existsSync, readFileSync, realpathSync, writeFileSync
} from "node:fs";
import { dirname, join } from "node:path";

const FLAGS = new Set(process.argv.slice(2));
const CHECK = FLAGS.has("--check");
const DRY = FLAGS.has("--dry-run");

// ---------------- 两处守卫的补丁 ----------------
const PATCHES = [
  {
    id: "selectModel（切换模型）",
    old: `\t\t\t\t\t\t\tif (info.inputModalities !== void 0 && !info.inputModalities.includes("image")) return err(request, {
\t\t\t\t\t\t\t\tcode: "model-unavailable",
\t\t\t\t\t\t\t\tmessage: \`Model "\${resolved.model}" does not accept image input, but this session already contains images; select an image-capable model.\`,
\t\t\t\t\t\t\t\tdetails: {
\t\t\t\t\t\t\t\t\tprovider,
\t\t\t\t\t\t\t\t\tmodel
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t});`,
    new: `\t\t\t\t\t\t\tif (info.inputModalities !== void 0 && !info.inputModalities.includes("image")) {
\t\t\t\t\t\t\t\tconst vision = ctx.get("visionService", false);
\t\t\t\t\t\t\t\tif (!(vision && typeof vision.textFallback === "function")) return err(request, {
\t\t\t\t\t\t\t\t\tcode: "model-unavailable",
\t\t\t\t\t\t\t\t\tmessage: \`Model "\${resolved.model}" does not accept image input, but this session already contains images; select an image-capable model.\`,
\t\t\t\t\t\t\t\t\tdetails: {
\t\t\t\t\t\t\t\t\t\tprovider,
\t\t\t\t\t\t\t\t\t\tmodel
\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t});
\t\t\t\t\t\t\t}`
  },
  {
    id: "prompt（发送图片）",
    old: `\t\t\t\t\t\t\tif (modelInfo.inputModalities !== void 0 && !modelInfo.inputModalities.includes("image")) return err(request, {
\t\t\t\t\t\t\t\tcode: "attachment-error",
\t\t\t\t\t\t\t\tmessage: \`Model "\${current.model}" does not support image input.\`,
\t\t\t\t\t\t\t\tdetails: { reason: "MODEL_DOES_NOT_SUPPORT_IMAGES" }
\t\t\t\t\t\t\t});`,
    new: `\t\t\t\t\t\t\tif (modelInfo.inputModalities !== void 0 && !modelInfo.inputModalities.includes("image")) {
\t\t\t\t\t\t\t\tconst vision = ctx.get("visionService", false);
\t\t\t\t\t\t\t\tif (!(vision && typeof vision.textFallback === "function")) return err(request, {
\t\t\t\t\t\t\t\t\tcode: "attachment-error",
\t\t\t\t\t\t\t\t\tmessage: \`Model "\${current.model}" does not support image input.\`,
\t\t\t\t\t\t\t\t\tdetails: { reason: "MODEL_DOES_NOT_SUPPORT_IMAGES" }
\t\t\t\t\t\t\t\t});
\t\t\t\t\t\t\t}`
  }
];

const PROBE = `const vision = ctx.get("visionService", false);`;

// ---------------- 定位 dsh-host-apiproxy ----------------
function locateTarget() {
  const candidates = [];
  try {
    const bin = execFileSync("which", ["dsh"], { encoding: "utf8" }).trim();
    if (bin) {
      const real = realpathSync(bin);
      // 通常 .../@deepseek-ai/dsh/lib/bin.js → 包根目录 = dirname(dirname(real))
      const pkgRoot = dirname(dirname(real));
      candidates.push(join(pkgRoot, "node_modules", "@deepseek-ai", "dsh-host-apiproxy", "lib", "index.js"));
    }
  } catch { /* ignore */ }
  try {
    const gRoot = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
    candidates.push(join(gRoot, "@deepseek-ai", "dsh", "node_modules", "@deepseek-ai", "dsh-host-apiproxy", "lib", "index.js"));
    candidates.push(join(gRoot, "@deepseek-ai", "dsh-host-apiproxy", "lib", "index.js"));
  } catch { /* ignore */ }
  return candidates.find((c) => existsSync(c)) ?? null;
}

// ---------------- 主流程 ----------------
const target = locateTarget();
if (!target) {
  console.error("❌ 未找到 dsh-host-apiproxy/lib/index.js，请确认已安装 DSH（dsh 命令可用）后重试。");
  process.exit(1);
}
console.log(`目标文件: ${target}`);

const src = readFileSync(target, "utf8");
const states = PATCHES.map((p) => ({ ...p, hasOld: src.includes(p.old), hasNew: src.includes(p.new) }));
const allPatched = states.every((p) => p.hasNew);
const toApply = states.filter((p) => !p.hasNew);

if (CHECK) {
  if (allPatched) {
    console.log("✅ 已打过补丁（两处守卫均已包含 visionService 探测），无需处理。");
    process.exit(0);
  }
  console.log(`⚠️ 未打补丁。待补 ${toApply.length} 处：${toApply.map((p) => p.id).join("、")}。`);
  process.exit(1);
}

if (allPatched) {
  console.log("✅ 已打过补丁，跳过。");
  process.exit(0);
}

const mismatch = toApply.filter((p) => !p.hasOld);
if (mismatch.length > 0) {
  console.error(`❌ 源文件与预期不匹配（以下守卫文本未找到）：${mismatch.map((p) => p.id).join("、")}`);
  console.error("   可能是 DSH 版本升级改变了这段代码。请把上述信息反馈给插件作者，或检查是否已由上游合入。");
  process.exit(1);
}

if (DRY) {
  console.log("（--dry-run）以下补丁将应用：");
  for (const p of toApply) console.log(`  - ${p.id}`);
  process.exit(0);
}

const bak = `${target}.bak-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}`;
copyFileSync(target, bak);
console.log(`已备份: ${bak}`);

let out = src;
for (const p of toApply) {
  out = out.replace(p.old, p.new);
  console.log(`✅ 已应用: ${p.id}`);
}
writeFileSync(target, out);

// 语法校验
try {
  execFileSync(process.execPath, ["--check", target], { stdio: "pipe" });
  console.log("✅ node --check 语法校验通过。");
} catch (e) {
  console.error("❌ 语法校验失败，正在回滚备份...");
  writeFileSync(target, src);
  console.error("已回滚。请将上面的报错反馈给插件作者。");
  process.exit(1);
}

console.log("\n完成！请重启 dsh web 服务使补丁生效（例如：dsh web）。");
