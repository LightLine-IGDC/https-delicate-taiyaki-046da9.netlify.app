# dsh-vision-config

独立 DSH 识图插件：接管纯文本模型收到图片时的自动识图，把图片转成紧凑文本证据再交给模型。

- **不依赖**  任何用户插件；仅 peerDependencies `@deepseek-ai/cordis`
- 内置 OpenAI 兼容供应商：阿里云百炼、OpenRouter、ModelScope、硅基流动、自定义
- 图片缓存：SHA-256 + 24h TTL + 上限 1000，目录 `<工作区>/vision-cache/`（无 workspace 时回退 `~/.dsh/vision-cache/`）
- 大图压缩：超过 `compressThresholdMB`（默认 5）压缩为 JPEG q80（失败回退原图）
- 设置面板中/英双语，跟随 DSH 语言设置

## 要求

- DSH 0.1.0-rc.6 或更高版本
- 运行时 peer 依赖 `@deepseek-ai/cordis`、`@deepseek-ai/dsh-attachment` 由 DSH 提供，无需单独安装
- 本地开发：`pnpm install` 后 `npm test`（node:test 单测）

## 安装（完整教程）

> 以下命令在 Linux / macOS 终端执行；Windows 请用 Git Bash 或 WSL。

### 前置要求

- 已安装 DSH（`dsh --version` 可用，建议 0.1.0-rc.6 及以上）
- git、Node.js 18+、pnpm（没有则先 `npm i -g pnpm`）

### 第 1 步：克隆仓库

```sh
git clone https://github.com/firefly-710/DSH-vision-config.git
cd DSH-vision-config
```

### 第 2 步：安装依赖并自测（可选，推荐）

```sh
pnpm install
npm test        # 应看到 20/20 通过
```

### 第 3 步：安装到 DSH web profile

```sh
# 用绝对路径最稳（DSH 会自动以 link: 方式链接插件目录）
dsh plugin --profile web add /绝对/路径/DSH-vision-config
```

> 也可以先 `cd DSH-vision-config` 再 `dsh plugin --profile web add .`（相对路径会被自动转成绝对路径）。
> 非 web 界面（如 headless / tui）把 `web` 换成对应 profile 名即可。

### 第 4 步：给 DSH 核心打补丁（上游合入前必做）

DSH 核心 `dsh-host-apiproxy` 有两处图片守卫，会拦截「给纯文本模型发图 / 切到纯文本模型」。
上游合入前，需要对本机 DSH 打一次补丁（仓库自带一键脚本，幂等、自动备份）：

```sh
node scripts/patch-apiproxy.mjs --check    # 先检查状态
node scripts/patch-apiproxy.mjs            # 打补丁（自动备份 + 语法校验）
```

### 第 5 步：重启 DSH Web 使补丁与插件生效

```sh
# 先停掉当前 dsh web（终端里 Ctrl+C，或 kill 对应进程），然后：
dsh web
```

### 第 6 步：验证

1. 打开 DSH Web 设置页 → 出现「视觉配置」面板
2. 配置供应商 / Base URL / 模型 / API Key，点「获取模型列表」能拉到模型
3. 新建会话选一个**纯文本模型**直接发图片 → 图片被自动转为文本证据，不再提示「当前模型不支持图片」
4. 会话历史含图时切换到纯文本模型 → 不再返回 `model-unavailable`

### 卸载 / 回滚

```sh
dsh plugin --profile web remove dsh-vision-config   # 卸载
dsh plugin --profile web add /绝对/路径/DSH-vision-config   # 恢复
# 卸载/恢复后都需重启 dsh web 才生效
```

### 常见问题（FAQ）

- **`pnpm: command not found`** → `npm i -g pnpm`，重新执行第 2/3 步。
- **升级/重装 DSH 后「发图被拦」又出现** → DSH 核心升级会覆盖补丁，重新执行第 4 步即可。
- **装完设置页没有「视觉配置」面板** → 确认 `dsh plugin --profile web list` 里有 `dsh-vision-config`，并已重启 `dsh web`。
- **补丁脚本报「未找到 dsh-host-apiproxy」** → 确认 `dsh --version` 可用；Windows 请用 Git Bash / WSL。

## 配置

- 设置面板 → 视觉配置（供应商 / Base URL / 模型 / Key 环境变量 / 压缩阈值）
- 模型列表：点「获取模型列表」拉取（仅使用已保存配置的 Base URL），旁边的搜索框可按关键字过滤
- API Key 不写入配置：测试与识图时从 `ctx.credentials` 或同名环境变量读取
  （如 `DASHSCOPE_API_KEY`、`OPENROUTER_API_KEY`、`CUSTOM_VISION_API_KEY`）

## HTTP API

- `GET/POST /vision/api/config`
- `GET /vision/api/providers`
- `GET /vision/api/models?provider=`
- `POST /vision/api/test`（body 可带临时 `apiKey` 覆盖）

## 安全说明

- HTTP 端点仅应在 DSH Web（默认绑定 127.0.0.1）上访问；跨站来源（Origin 不匹配 / `Sec-Fetch-Site: cross-site`）会被拒绝
- `GET /vision/api/models` 只使用已保存配置的 Base URL，忽略查询参数传入的地址，避免存储的 API Key 被诱导发往任意主机
- `POST /vision/api/test` 仅在目标 host 与已保存配置一致时才使用存储的 Key；测试未保存的地址必须显式传入 apiKey
- 模型工具 `vision_analyze` 的 `file_path` 仅允许访问当前工作区内的图片（拒绝 `..` 越界与符号链接逃逸）

## 与 apiproxy 集成

插件以 `ctx.get("visionService")` 提供服务，核心方法为 `textFallback(content, signal)`（把图片转成文本证据）。
host 侧 `dsh-host-apiproxy` 有两处图片模态守卫都会检测该服务，仅在回退服务缺失时才拒绝：

- **模型切换（selectModel）**：会话历史已含图片、目标模型又不支持图片输入时，若存在 `visionService.textFallback` 则放行切换，否则返回 `model-unavailable`。
- **发送图片（prompt）**：当前模型不支持图片输入时，若存在 `visionService.textFallback` 则放行（图片会在 `llm/stream` 阶段自动转为文本证据），否则返回 `attachment-error` / `MODEL_DOES_NOT_SUPPORT_IMAGES`。

> 注意：两处守卫都需要同步到上游 `deepseek-ai/deepseek-harness` 的 `packages/host/apiproxy`；
> 在官方构建合入前，升级/重装 DSH 后需要重新应用对应补丁。

### 安装后：给 DSH 核心打补丁（上游合入前必做）

仓库自带一键补丁脚本（幂等，重复执行会自动跳过），对新装/升级后的 DSH 执行一次即可：

```sh
node scripts/patch-apiproxy.mjs --check    # 先检查是否已打补丁
node scripts/patch-apiproxy.mjs            # 打补丁（自动备份 + 语法校验）
# 然后重启 dsh web 使补丁生效
```

> 每次升级/重装 DSH 后重新执行一次；上游 `deepseek-harness` 合入后即可删除此步骤。

## 开发

```sh
pnpm install
npm test   # node --test：覆盖证据解析、缓存 key、供应商、安全路径校验等
```
