/**
 * dsh-vision-config — 供应商注册表。
 * 仅内置 OpenAI 兼容供应商；配置可覆盖 baseUrl / model，支持 {ACCOUNT_ID} 等占位符。
 */

export const PROVIDERS = [
  {
    id: "alibaba",
    name: "阿里云百炼 DashScope",
    kind: "openai",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKeyEnv: "DASHSCOPE_API_KEY",
    defaultModel: "qwen3-vl-flash",
    models: [
      "qwen3-vl-flash",
      "qwen3-vl-plus",
      "qwen-vl-max",
      "qwen-vl-max-latest",
      "qwen-vl-plus",
      "qwen2.5-vl-72b-instruct",
      "qwen2.5-vl-32b-instruct",
      "qwen2.5-vl-7b-instruct",
      "qwen2-vl-72b-instruct",
      "qwen2-vl-7b-instruct"
    ]
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    kind: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    defaultModel: "qwen/qwen3-vl-flash",
    models: [
      "qwen/qwen3-vl-flash",
      "qwen/qwen3-vl-plus",
      "qwen/qwen2.5-vl-72b-instruct",
      "google/gemini-2.0-flash-exp:free",
      "moonshotai/kimi-vl-a3b-thinking",
      "openai/gpt-4o-mini",
      "meta-llama/llama-3.2-11b-vision-instruct"
    ]
  },
  {
    id: "modelscope",
    name: "ModelScope 魔搭",
    kind: "openai",
    baseUrl: "https://api-inference.modelscope.cn/v1",
    apiKeyEnv: "MODELSCOPE_API_KEY",
    defaultModel: "Qwen/Qwen3-VL-Flash",
    models: [
      "Qwen/Qwen3-VL-Flash",
      "Qwen/Qwen3-VL-Plus",
      "Qwen/Qwen2.5-VL-72B-Instruct",
      "Qwen/Qwen2.5-VL-32B-Instruct",
      "Qwen/Qwen2-VL-72B-Instruct"
    ]
  },
  {
    id: "siliconflow",
    name: "硅基流动 SiliconFlow",
    kind: "openai",
    baseUrl: "https://api.siliconflow.cn/v1",
    apiKeyEnv: "SILICONFLOW_API_KEY",
    defaultModel: "Qwen/Qwen3-VL-Flash",
    models: [
      "Qwen/Qwen3-VL-Flash",
      "Qwen/Qwen3-VL-Plus",
      "Qwen/Qwen2.5-VL-72B-Instruct",
      "Qwen/Qwen2.5-VL-32B-Instruct",
      "Qwen/Qwen2-VL-72B-Instruct"
    ]
  },
  {
    id: "custom",
    name: "自定义（OpenAI 兼容）",
    kind: "openai",
    baseUrl: "",
    apiKeyEnv: "CUSTOM_VISION_API_KEY",
    defaultModel: "",
    models: []
  }
];

export function providerById(id) {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[PROVIDERS.length - 1];
}

/** 展开 baseUrl 中的 {NAME} 占位符（优先配置 vars，其次同名环境变量）。 */
export function expandBaseUrl(baseUrl, vars = {}) {
  if (!baseUrl) return baseUrl;
  return String(baseUrl).replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_m, name) => {
    const v = vars[name];
    if (v !== undefined && v !== null && String(v) !== "") return encodeURIComponent(String(v));
    if (typeof process !== "undefined" && process.env[name]) return encodeURIComponent(process.env[name]);
    return `{${name}}`;
  });
}
