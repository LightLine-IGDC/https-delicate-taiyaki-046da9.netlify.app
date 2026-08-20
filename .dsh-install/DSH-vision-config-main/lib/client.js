window.__ModuleLoader__.load({
  id: "dsh-vision-config",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    let react = require("react");
    let React = react;
    let react_jsx_runtime = require("react/jsx-runtime");
    let jsx = react_jsx_runtime.jsx;
    let jsxs = react_jsx_runtime.jsxs;

    // ── CSS（dvc_ 前缀，独立注入，不引用其它插件）──
    const css = `.dvc_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:14px;display:flex}
.dvc_heading{margin:0;font-size:18px;font-weight:600}
.dvc_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px;line-height:1.6}
.dvc_banner{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:10px 12px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}
.dvc_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;padding:14px 16px;flex-direction:column;gap:12px;display:flex}
.dvc_row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.dvc_row .lab{width:120px;flex:none;color:var(--dsw-alias-label-secondary);font-size:13px}
.dvc_input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 10px;font-size:13px;font:inherit;min-width:200px;flex:1}
.dvc_input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.dvc_select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 10px;font-size:13px;font:inherit;min-width:220px;flex:1}
.dvc_btn{appearance:none;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 14px;font-size:13px;line-height:1.5}
.dvc_btn:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed)}
.dvc_btn:disabled{opacity:.45;cursor:default}
.dvc_btn.primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}
.dvc_hint{color:var(--dsw-alias-label-tertiary);font-size:12px}
.dvc_testOk{color:var(--dsw-alias-state-success-primary, #22c55e);font-size:13px;word-break:break-all}
.dvc_testErr{color:var(--dsw-alias-label-error);font-size:13px;word-break:break-all}
.dvc_env{color:var(--dsw-alias-label-tertiary);font-size:12px}
.dvc_modelPicker{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);max-height:220px;overflow-y:auto;display:flex;flex-direction:column;padding:4px;min-width:280px;max-width:100%}
.dvc_modelOption{display:flex;align-items:center;width:100%;text-align:left;font:inherit;font-size:13px;color:var(--dsw-alias-label-primary);background:0 0;border:0;border-radius:6px;padding:7px 10px;cursor:pointer}
.dvc_modelOption:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(103,126,183,.12))}
.dvc_modelOption.active{color:var(--dsw-alias-brand-primary,#526aa8);font-weight:600}
`;

    // ── 内置供应商（仅作为服务端列表加载前的兜底；以 /vision/api/providers 为准）──
    const PROVIDER_OPTIONS = [
      { id: "alibaba", name: "阿里云百炼 DashScope", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", apiKeyEnv: "DASHSCOPE_API_KEY", defaultModel: "qwen3-vl-flash" },
      { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", apiKeyEnv: "OPENROUTER_API_KEY", defaultModel: "qwen/qwen3-vl-flash" },
      { id: "modelscope", name: "ModelScope 魔搭", baseUrl: "https://api-inference.modelscope.cn/v1", apiKeyEnv: "MODELSCOPE_API_KEY", defaultModel: "Qwen/Qwen3-VL-Flash" },
      { id: "siliconflow", name: "硅基流动 SiliconFlow", baseUrl: "https://api.siliconflow.cn/v1", apiKeyEnv: "SILICONFLOW_API_KEY", defaultModel: "Qwen/Qwen3-VL-Flash" },
      { id: "custom", name: "自定义（OpenAI 兼容）", baseUrl: "", apiKeyEnv: "CUSTOM_VISION_API_KEY", defaultModel: "" }
    ];

    async function api(path, options) {
      const res = await fetch(path, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        const error = new Error(data.error || res.statusText || ("HTTP " + res.status));
        error.data = data;
        throw error;
      }
      return data;
    }

    // ── 设置面板 ──
    function VisionConfigSection(props) {
      const t = props?.t || ((key) => key);
      const [loaded, setLoaded] = React.useState(false);
      const [providerOptions, setProviderOptions] = React.useState(PROVIDER_OPTIONS);
      const [provider, setProvider] = React.useState("alibaba");
      const [baseUrl, setBaseUrl] = React.useState("");
      const [model, setModel] = React.useState("");
      const [modelOptions, setModelOptions] = React.useState([]);
      const [apiKeyEnv, setApiKeyEnv] = React.useState("");
      const [apiKey, setApiKey] = React.useState("");
      const [compressThresholdMB, setCompressThresholdMB] = React.useState(5);
      const [saving, setSaving] = React.useState(false);
      const [savingKey, setSavingKey] = React.useState(false);
      const [modelPickerOpen, setModelPickerOpen] = React.useState(false);
      const [modelQuery, setModelQuery] = React.useState("");
      const [testing, setTesting] = React.useState(false);
      const [loadingModels, setLoadingModels] = React.useState(false);
      const [testResult, setTestResult] = React.useState(null);

      React.useEffect(() => {
        api("/vision/api/providers")
          .then((d) => { if (Array.isArray(d.providers) && d.providers.length) setProviderOptions(d.providers); })
          .catch(() => { /* 保持内置兜底 */ });
        api("/vision/api/config")
          .then((d) => {
            const c = d.config || {};
            setProvider(c.provider || "alibaba");
            setBaseUrl(c.baseUrl || "");
            setModel(c.model || "");
            setModelOptions(Array.isArray(c.models) ? c.models : []);
            setApiKeyEnv(c.apiKeyEnv || "");
            setCompressThresholdMB(c.compressThresholdMB || 5);
            setLoaded(true);
          })
          .catch((e) => {
            setLoaded(true);
            setTestResult({ ok: false, message: t("loadConfigError", { message: e.message }) });
          });
      }, []);

      const currentProvider = providerOptions.find((p) => p.id === provider) || providerOptions[0];

      const changeProvider = (id) => {
        const p = providerOptions.find((x) => x.id === id) || providerOptions[0];
        setProvider(id);
        setBaseUrl(p.baseUrl);
        setApiKeyEnv(p.apiKeyEnv);
        setModel(p.defaultModel);
        setModelOptions([]);
        setModelQuery("");
        setTestResult(null);
      };

      const REASON_TEXT = {
        "no-key": t("reasonNoKey"),
        "bad-url": t("reasonBadUrl"),
        "empty": t("reasonEmpty"),
        "error": t("reasonError"),
        "custom-need-save": t("reasonCustomNeedSave")
      };

      const fetchModels = () => {
        setLoadingModels(true);
        const params = new URLSearchParams({ provider });
        api("/vision/api/models?" + params.toString())
          .then((d) => {
            setModelOptions(d.models || []);
            if (!model && d.models && d.models.length) setModel(d.models[0]);
            setModelPickerOpen(true);
            const source = d.source === "live" ? t("sourceLive") : t("sourcePreset");
            let message = t("modelsLoaded", { count: (d.models || []).length, source });
            if (d.reason) {
              const reasonText = (d.reason.indexOf("http-") === 0 ? t("reasonHttp") : REASON_TEXT[d.reason]) || d.reason;
              message += "（" + reasonText + "）";
            }
            setTestResult({ ok: !d.reason, message });
          })
          .catch((e) => setTestResult({ ok: false, message: t("fetchModelsError", { message: e.message }) }))
          .finally(() => setLoadingModels(false));
      };

      const testConnection = () => {
        setTesting(true);
        setTestResult(null);
        const body = { provider, baseUrl, model };
        if (apiKey.trim()) body.apiKey = apiKey.trim();
        api("/vision/api/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
          .then((d) => setTestResult({ ok: true, message: t("testOk", { model: d.model, result: String(d.result).slice(0, 200) }) }))
          .catch((e) => setTestResult({ ok: false, message: e.message }))
          .finally(() => setTesting(false));
      };

      const saveKey = () => {
        setSavingKey(true);
        api("/vision/api/key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ envName: apiKeyEnv, apiKey: apiKey.trim() })
        })
          .then((d) => { setTestResult({ ok: true, message: d.message }); setApiKey(""); })
          .catch((e) => setTestResult({ ok: false, message: e.message }))
          .finally(() => setSavingKey(false));
      };

      const clearKey = () => {
        setSavingKey(true);
        api("/vision/api/key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ envName: apiKeyEnv, unset: true })
        })
          .then((d) => setTestResult({ ok: true, message: d.message }))
          .catch((e) => setTestResult({ ok: false, message: e.message }))
          .finally(() => setSavingKey(false));
      };

      const saveConfig = () => {
        setSaving(true);
        const body = {
          provider,
          baseUrl,
          model,
          models: modelOptions,
          compressThresholdMB: Number(compressThresholdMB) || 5,
          apiKeyEnv
        };
        api("/vision/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
          .then((d) => setTestResult({ ok: true, message: t("configSaved", { provider: (d.config && d.config.provider) || "", model: (d.config && d.config.model) || "" }) }))
          .catch((e) => setTestResult({ ok: false, message: t("saveConfigError", { message: e.message }) }))
          .finally(() => setSaving(false));
      };

      const normalizedQuery = modelQuery.trim().toLowerCase();
      const visibleModelOptions = normalizedQuery
        ? modelOptions.filter((m) => String(m).toLowerCase().includes(normalizedQuery))
        : modelOptions;

      if (!loaded) {
        return jsx("div", { className: "dvc_section", children: jsx("p", { className: "dvc_hint", children: t("loading") }) });
      }

      return jsxs("div", { className: "dvc_section", children: [
        jsx("h2", { className: "dvc_heading", children: t("heading") }),
        jsx("p", { className: "dvc_intro", children: t("intro") }),
        jsx("div", { className: "dvc_banner", children: t("banner") }),

        jsxs("div", { className: "dvc_card", children: [
          jsxs("div", { className: "dvc_row", children: [
            jsx("span", { className: "lab", children: t("provider") }),
            jsxs("select", { className: "dvc_select", value: provider, onChange: (e) => changeProvider(e.target.value), children: providerOptions.map((p) => jsx("option", { value: p.id, children: p.name }, p.id)) })
          ] }),
          jsxs("div", { className: "dvc_row", children: [
            jsx("span", { className: "lab", children: t("baseUrl") }),
            jsx("input", { className: "dvc_input", value: baseUrl, placeholder: "https://…/v1（支持 {ACCOUNT_ID} 占位符）", onChange: (e) => setBaseUrl(e.target.value) })
          ] }),
          jsxs("div", { className: "dvc_row", children: [
            jsx("span", { className: "lab", children: t("model") }),
            jsx("input", { className: "dvc_input", value: model, placeholder: t("modelPlaceholder"), onChange: (e) => setModel(e.target.value) }),
            jsx("button", { className: "dvc_btn", onClick: () => setModelPickerOpen(v => !v), children: modelPickerOpen ? t("modelListClose") : t("modelListOpen") }),
            jsx("button", { className: "dvc_btn", onClick: fetchModels, disabled: loadingModels, children: loadingModels ? t("loading") : t("fetchModels") }),
            jsx("input", { className: "dvc_input", value: modelQuery, placeholder: t("searchPlaceholder"), onChange: (e) => setModelQuery(e.target.value) })
          ] }),
          modelPickerOpen && jsxs("div", { className: "dvc_modelPicker", children: [
            visibleModelOptions.length === 0 ? jsx("div", { className: "dvc_hint", children: modelOptions.length === 0 ? t("noModels") : t("noMatch", { query: modelQuery.trim() }) }) :
            visibleModelOptions.map((m) => jsx("button", {
              className: "dvc_modelOption" + (m === model ? " active" : ""),
              onClick: () => { setModel(m); setModelPickerOpen(false); },
              children: m
            }, m))
          ] }),
          jsxs("div", { className: "dvc_row", children: [
            jsx("span", { className: "lab", children: t("keyEnv") }),
            jsx("input", { className: "dvc_input", value: apiKeyEnv, placeholder: "如 DASHSCOPE_API_KEY", onChange: (e) => setApiKeyEnv(e.target.value) }),
            jsx("span", { className: "dvc_env", children: t("keyEnvHint") })
          ] }),
          jsxs("div", { className: "dvc_row", children: [
            jsx("span", { className: "lab", children: t("apiKey") }),
            jsx("input", { className: "dvc_input", type: "password", value: apiKey, placeholder: t("apiKeyPlaceholder"), onChange: (e) => setApiKey(e.target.value) }),
            jsx("button", { className: "dvc_btn primary", onClick: saveKey, disabled: savingKey || !apiKey.trim(), children: savingKey ? t("saving") : t("saveKey") }),
            jsx("button", { className: "dvc_btn", onClick: clearKey, disabled: savingKey, children: t("clearKey") })
          ] }),
          jsx("div", { className: "dvc_env", children: t("keyHint", { env: apiKeyEnv }) }),
          jsxs("div", { className: "dvc_row", children: [
            jsx("span", { className: "lab", children: t("compressThreshold") }),
            jsx("input", { className: "dvc_input", type: "number", min: "0", step: "1", value: compressThresholdMB, onChange: (e) => setCompressThresholdMB(e.target.value) }),
            jsx("span", { className: "dvc_hint", children: t("compressHint") })
          ] }),
          jsxs("div", { className: "dvc_row", children: [
            jsx("button", { className: "dvc_btn primary", onClick: saveConfig, disabled: saving, children: saving ? t("saving") : t("saveConfig") }),
            jsx("button", { className: "dvc_btn", onClick: testConnection, disabled: testing, children: testing ? t("testing") : t("testConnection") })
          ] }),
          testResult && jsx("div", { className: testResult.ok ? "dvc_testOk" : "dvc_testErr", children: (testResult.ok ? "✓ " : "✗ ") + testResult.message })
        ] })
      ] });
    }

    // ── 注册 ──
    const NS = "vision-config";
    const zh = {
  "nav": "视觉配置",
  "heading": "视觉配置",
  "intro": "配置视觉模型供应商。发送图片给纯文本模型时，将由本插件自动识图后再交给模型。",
  "banner": "提示：图片会先经本插件的视觉 API 转为文本证据，再作为普通文本进入模型；API Key 不写入配置文件。",
  "loading": "加载中…",
  "loadConfigError": "加载配置失败：{message}",
  "provider": "供应商",
  "baseUrl": "Base URL",
  "model": "模型",
  "modelPlaceholder": "输入模型 ID 或从列表选择",
  "modelListOpen": "模型列表 ▾",
  "modelListClose": "收起 ▴",
  "fetchModels": "获取模型列表",
  "searchPlaceholder": "搜索模型…",
  "noModels": "暂无模型，请先点「获取模型列表」",
  "noMatch": "未找到匹配「{query}」的模型",
  "modelsLoaded": "模型列表：已加载 {count} 个（来源 {source}）",
  "sourcePreset": "预设",
  "sourceLive": "接口",
  "fetchModelsError": "获取模型列表失败：{message}",
  "reasonNoKey": "未配置 API Key，已用预设列表",
  "reasonCustomNeedSave": "自定义供应商请先保存 Base URL，再获取模型列表",
  "reasonBadUrl": "Base URL 无效，已用预设列表",
  "reasonHttp": "接口返回错误，已用预设列表",
  "reasonEmpty": "接口未返回模型，已用预设列表",
  "reasonError": "请求失败，已用预设列表",
  "keyEnv": "Key 环境变量",
  "keyEnvHint": "测试/拉取模型时从该环境变量读取",
  "apiKey": "API Key",
  "apiKeyPlaceholder": "填入后点确定，自动写入环境变量凭据",
  "saveKey": "确定",
  "clearKey": "清除",
  "keyHint": "保存到 dsh 凭据层（等同环境变量 {env}），识图与测试立即生效；若提示被启动环境占用，需在启动 dsh 的 shell 中设置该变量",
  "compressThreshold": "压缩阈值(MB)",
  "compressHint": "超过该大小的图片压缩为 JPEG q80（失败则用原图）",
  "saveConfig": "保存配置",
  "testConnection": "测试连接",
  "saving": "保存中…",
  "testing": "测试中…",
  "testOk": "连接成功（{model}）：{result}",
  "configSaved": "配置已保存（{provider} / {model}）",
  "saveConfigError": "保存失败：{message}"
};
    const en = {
  "nav": "Vision Config",
  "heading": "Vision Config",
  "intro": "Configure the vision model provider. When an image is sent to a text-only model, this plugin recognizes it and turns it into text evidence first.",
  "banner": "Images are converted to text evidence by this plugin's vision API before reaching the model; API keys are never written to the config file.",
  "loading": "Loading…",
  "loadConfigError": "Failed to load config: {message}",
  "provider": "Provider",
  "baseUrl": "Base URL",
  "model": "Model",
  "modelPlaceholder": "Type a model ID or pick from the list",
  "modelListOpen": "Model list ▾",
  "modelListClose": "Collapse ▴",
  "fetchModels": "Fetch model list",
  "searchPlaceholder": "Search models…",
  "noModels": "No models yet. Click “Fetch model list” first.",
  "noMatch": "No model matches “{query}”",
  "modelsLoaded": "Model list: loaded {count} ({source})",
  "sourcePreset": "preset",
  "sourceLive": "live",
  "fetchModelsError": "Failed to fetch model list: {message}",
  "reasonNoKey": "No API key configured; using preset list",
  "reasonCustomNeedSave": "Custom provider: save the Base URL first, then fetch the model list",
  "reasonBadUrl": "Invalid Base URL; using preset list",
  "reasonHttp": "Provider returned an error; using preset list",
  "reasonEmpty": "Provider returned no models; using preset list",
  "reasonError": "Request failed; using preset list",
  "keyEnv": "Key env var",
  "keyEnvHint": "Used when testing / fetching models",
  "apiKey": "API Key",
  "apiKeyPlaceholder": "Fill in and click Save to write it into the credential env var",
  "saveKey": "Save",
  "clearKey": "Clear",
  "keyHint": "Saved into the dsh credential layer (same as env var {env}); takes effect immediately. If the launch environment holds the variable, set it in the shell that starts dsh.",
  "compressThreshold": "Compress threshold (MB)",
  "compressHint": "Images larger than this are compressed to JPEG q80 (fallback to original on failure)",
  "saveConfig": "Save config",
  "testConnection": "Test connection",
  "saving": "Saving…",
  "testing": "Testing…",
  "testOk": "Connected ({model}): {result}",
  "configSaved": "Config saved ({provider} / {model})",
  "saveConfigError": "Save failed: {message}"
};
    const inject = ["slots", "locale", "connection", "settingsScope"];

    function apply(ctx) {
      const t = ctx.locale.bind(NS);
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "vision-config: locale");

      if (typeof document !== "undefined" && !document.querySelector("style[data-plugin='dsh-vision-config']")) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "dsh-vision-config";
        tag.textContent = css;
        document.head.appendChild(tag);
      }

      ctx.slots.inject("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: "vision-config",
        order: 30,
        label: () => t("nav"),
        locale: NS,
        inject: () => ({ hooks: {}, t }),
        children: {}
      }, VisionConfigSection));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
