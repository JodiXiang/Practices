# 入梦谣｜AI 黛玉对话游戏

这是基于《入梦谣・叙事策划案 V1.3》制作的纯前端文字对话原型。

## 运行

本地规则生成器可直接在浏览器打开：

```text
apps/daiyu-game/index.html
```

调用 DeepSeek 或其他 OpenAI-compatible 通用 Key 时请通过本地服务打开：

```bash
npm run dev -w apps/daiyu-game
```

然后访问：

```text
http://127.0.0.1:4173
```

模型 Key 不写在前端页面里。请用服务器环境变量设置：

```bash
DEEPSEEK_API_KEY=你的_key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
PORT=4173
```

如果使用女娲 / NuwaFlux 这类 OpenAI-compatible 通用 API，可改成：

```bash
DEEPSEEK_API_KEY=你的通用_key
DEEPSEEK_MODEL=你的模型名
DEEPSEEK_BASE_URL=https://api.nuwaflux.com/v1
PORT=4173
```

玩家打开游戏时不会看到 API Key 输入框。所有模型请求都会由 `server.mjs` 代为调用，消耗部署者配置的额度。未配置或请求失败时自动回退本地生成器。

## 已实现

- 三方聊天流：玩家、林黛玉、世界消息
- 系统按钮与系统面板
- Trust / Awareness / Agency / 气息值
- 四阶段章节状态机
- 原著固定事件顺序
- 查看内心功能
- 黛玉禁用现代系统词的输出净化
- 固定死亡结局与可变临终心境
- DeepSeek 服务端调用接口，未配置 API Key 时自动回退本地生成器

## 后续接入真实 LLM

当前前端会优先请求 `server.mjs` 中的 `/api/daiyu/turn`。请求失败或未配置 API Key 时，`game.js` 中的 `generateTurn(input)` 会作为本地叙事生成器回退使用。
