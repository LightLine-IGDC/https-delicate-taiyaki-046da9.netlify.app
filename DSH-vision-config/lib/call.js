/**
 * dsh-vision-config — OpenAI 兼容视觉 API 调用。
 * 独立实现，不依赖任何外部 CLI。
 */

export const TEST_IMAGE_DATA_URL =
  "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAAAPAAAABaCAIAAAAJsExNAAAEUklEQVR4nO3dW2hbdRzA8X+S5pg09pq0w7bZ2JqOXnS3GMpGmPVS3YMgvilDBoqWeXkRFBwqiIgPPky8gXtQKmrxQWHugrWuD/MC3ShujamLWN2lSWsuXa8JuZzEh7BQJm2VUyL77ft5as6/5/B7+Pb035f+TYVCQQFSmP/vAYD1RNAQhaAhCkFDFIKGKAQNUQgaohA0RCFoiFKx+vJsb2955iin2qGhlZb8r6fKOUl5/PCKfaWl1p8OlHOS9TKxp3+lJd7QEIWgIQpBQxSChigEDVEIGqIQNEQhaIhC0BCFoCEKQUMUgoYoBA1RCBqiEDREIWiIQtAQhaAhCkFDFIKGKAQNUQgaohA0RCFoiELQEIWgIcoa/wrs3/gkHH4hFAr4/Y2appS6bXjYW1NTUGohlzu0Zcu+hob+cPijyclbKyocFsvh9vZmm61071wu91IodDwWu9zTU7zyaSTyWSSyqOuveTz3OJ0pXX9mfDyaySzmcodaW+93uYwPDMHWIehv4vE+t3soHt/f1KSU0szm416vUuqXhYVHz5+/xWL5cnp60Oezmc3fJRJPj48f3bWrdO8j5849vGHDiVis+DGeyQxMTZ3weieSyf1jY2d27z4yObmzuvq5TZv+Sqd7z54d8/uNDwzBjG45Urqe1PXHmpsH4/HrlrqqqipMpvcuXXrV47GZzUqp+5zOzXZ7dtlBcv3btj3ldpc+Xs1mn2xpMZtMzTbb1WxWKXWgqanP7VZK/bq0ZDWzQcIajL6hTyUS9zqdbZWVl1OpTD6vLWvu9MzMm1u3Pn/hwh1VVaWLb3d0LL+9uEspaXM42hwOpdTRaHSfy6WUqrValVJ9weCxaHRg+3aD00I8o0GfjMUCi4tfR6NT6fSPs7N319dn8vkHR0fT+fzP8/N76+r0/36w55+p1DsXLx7zektXPuzqeqixcWBq6q76eoMDQzZDv8T1QuH3ZPL77u4hn++Drq7BWExd20MP+Xynu7tH5+c9DkdgYaH4/QWlDgaDqz9zSdcfDwTe7ex0aZpS6sVQKFcoKKUecLm+/ceuBriOoaBHZmdvv7ad2FNbOzwzs3y13mrdbLc/0dLyxsREOp9XSn01PZ3J51d5YLH4ZzduvLOmpnhlPpcr/sl4Zm7OU1lpZFrcDAxtOU7GYnvr6opf2y2WBk37bWmpuOUo/qAc7ujYWV39RzLZMzLi0rQGTXurvX2VB34eiZxKJGay2Y/DYYfF8sWOHS+3th4MBo9cuaKZTO93dhqZFjcD0+qH13MkhQAcSQHcqAgaohA0RCFoiELQEIWgIQpBQxSChigEDVEIGqIQNEQhaIhC0BCFoCEKQUMUgoYoBA1RCBqiEDREIWiIQtAQhaAhCkFDFIKGKAQNUQgaohA0RCFoiELQEIWgIQpBQxSChigEDVEIGqIQNERZ44wV4MbCGxqiEDREIWiIQtAQhaAhCkFDFIKGKAQNUf4GoTs/gyGBZtAAAAAASUVORK5CYII=";

const MAX_ATTEMPTS = 2;

/**
 * 调用 OpenAI 兼容 /chat/completions 做图片分析。
 * 对 5xx / 网络层错误自动重试一次；超时与主动取消不重试。
 * @returns 模型返回的纯文本内容。
 */
export async function analyze({
  provider = "custom",
  apiKey,
  baseUrl,
  model,
  prompt,
  imageDataUrl,
  maxTokens = 900,
  timeoutMs = 60000,
  signal
}) {
  const endpoint = String(baseUrl || "").replace(/\/+$/, "") + "/chat/completions";
  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort(signal?.reason ?? new Error("aborted"));
  if (signal?.aborted) onAbort();
  else signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error("timeout"));
  }, timeoutMs);
  try {
    const init = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } }
            ]
          }
        ],
        temperature: 0,
        stream: false,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    };

    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(endpoint, init);
        const raw = await response.text();
        if (!response.ok) {
          const detail = raw.slice(0, 500);
          const error = new Error(`Vision API HTTP ${response.status}: ${detail}`);
          error.status = response.status;
          error.detail = detail;
          if (attempt < MAX_ATTEMPTS && response.status >= 500) {
            lastError = error;
            continue;
          }
          throw error;
        }

        let payload;
        try {
          payload = JSON.parse(raw);
        } catch {
          throw new Error("Vision API returned non-JSON: " + raw.slice(0, 500));
        }

        const content = payload?.choices?.[0]?.message?.content;
        if (typeof content === "string") return content;
        if (Array.isArray(content)) {
          const joined = content.map((p) => (p && typeof p.text === "string" ? p.text : "")).filter(Boolean).join("\n").trim();
          if (joined) return joined;
        }
        throw new Error(`Vision API returned no content for "${provider}/${model}"`);
      } catch (error) {
        if (timedOut) throw new Error(`Vision API 请求超时（${timeoutMs}ms）`);
        if (signal?.aborted) throw signal.reason ?? error;
        if (error && error.name === "AbortError") {
          throw new Error(`Vision API 请求超时（${timeoutMs}ms）`);
        }
        // 仅网络层错误（无 HTTP status）重试一次；4xx/应用错误不重试
        if (attempt < MAX_ATTEMPTS && error && error.status === undefined) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error("Vision API 请求失败");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
