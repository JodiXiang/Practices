import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";
const deepseekApiKey = process.env.DEEPSEEK_API_KEY || "";
const deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const deepseekModel = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/daiyu/model") {
      sendJson(res, 200, {
        provider: "openai-compatible",
        model: deepseekModel,
        baseUrl: deepseekBaseUrl,
        configured: Boolean(deepseekApiKey)
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/daiyu/turn") {
      const body = await readJson(req);
      const result = await generateDaiyuTurn(body);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/daiyu/test-model") {
      const body = await readJson(req);
      const result = await testModelConnection(body.model_config, body.language);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/system/ask") {
      const body = await readJson(req);
      const result = await askNarrativeSystem(body);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/daiyu/ending") {
      const body = await readJson(req);
      const result = await generateEnding(body);
      sendJson(res, 200, result);
      return;
    }

    if (req.method !== "GET") {
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(__dirname, safePath);
    if (!filePath.startsWith(__dirname)) {
      sendJson(res, 403, { ok: false, error: "Forbidden" });
      return;
    }

    const content = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(content);
  } catch (error) {
    if (error?.code === "ENOENT") {
      sendJson(res, 404, { ok: false, error: "Not found" });
      return;
    }
    sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

server.listen(port, host, () => {
  console.log(`入梦谣 dev server: http://127.0.0.1:${port}`);
  console.log(
    deepseekApiKey
      ? `Default model enabled: ${deepseekModel} @ ${deepseekBaseUrl}`
      : "No default API key set. You can enter a compatible key in the system panel."
  );
});

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function generateDaiyuTurn(body) {
  const modelConfig = resolveModelConfig(body.model_config);
  if (!modelConfig.apiKey) {
    console.log("[model] skipped: missing api key");
    return {
      ok: false,
      fallback: true,
      error: "API Key is not configured."
    };
  }
  if (!isAsciiHeaderValue(modelConfig.apiKey)) {
    console.log("[model] skipped: api key contains non-ascii characters");
    return {
      ok: false,
      fallback: true,
      error:
        body.language === "en"
          ? "API Key contains Chinese, full-width, or invisible characters. Please copy the original key from your provider again."
          : "API Key 含有中文、全角字符或不可见字符，请重新复制服务商提供的原始 Key。"
    };
  }

  const prompt = buildPrompt(body);
  const endpoint = buildChatCompletionsUrl(modelConfig.baseUrl);
  console.log(`[model] request ${modelConfig.model} @ ${modelConfig.baseUrl}`);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${modelConfig.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: prompt.system
        },
        {
          role: "user",
          content: prompt.user
        }
      ],
      temperature: 0.45,
      max_tokens: 900
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.log(`[model] failed ${response.status}: ${text.slice(0, 240)}`);
    return {
      ok: false,
      fallback: true,
      error: `Model request failed: ${response.status} ${text.slice(0, 240)}`
    };
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  try {
    const parsed = parseJsonFromModel(raw);
    console.log(`[model] success ${modelConfig.model}`);
    return normalizeModelResult(parsed, body, modelConfig);
  } catch {
    console.log(`[model] invalid json: ${raw.slice(0, 240)}`);
    return {
      ok: false,
      fallback: true,
      error: "Model did not return valid JSON."
    };
  }
}

async function testModelConnection(config, language = "zh") {
  const modelConfig = resolveModelConfig(config);
  if (!modelConfig.apiKey) {
    return { ok: false, error: "API Key is not configured." };
  }
  if (!isAsciiHeaderValue(modelConfig.apiKey)) {
    return {
      ok: false,
      error:
        language === "en"
          ? "API Key contains Chinese, full-width, or invisible characters. Please copy the original key from your provider again."
          : "API Key 含有中文、全角字符或不可见字符，请重新复制服务商提供的原始 Key。"
    };
  }

  const endpoint = buildChatCompletionsUrl(modelConfig.baseUrl);
  console.log(`[model-test] request ${modelConfig.model} @ ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${modelConfig.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: [
          {
            role: "user",
            content: "Return exactly this JSON: {\"ok\":true}"
          }
        ],
        temperature: 0,
        max_tokens: 40
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.log(`[model-test] failed ${response.status}: ${text.slice(0, 240)}`);
      return {
        ok: false,
        status: response.status,
        endpoint,
        model: modelConfig.model,
        error: text.slice(0, 500)
      };
    }

    const data = await response.json();
    console.log(`[model-test] success ${modelConfig.model}`);
    return {
      ok: true,
      endpoint,
      model: modelConfig.model,
      sample: data?.choices?.[0]?.message?.content || ""
    };
  } catch (error) {
    return {
      ok: false,
      endpoint,
      model: modelConfig.model,
      error: error instanceof Error ? error.message : "Unknown request error"
    };
  }
}

async function askNarrativeSystem(body) {
  const modelConfig = resolveModelConfig(body.model_config);
  if (!modelConfig.apiKey) {
    return { ok: false, error: "API Key is not configured." };
  }
  if (!isAsciiHeaderValue(modelConfig.apiKey)) {
    return {
      ok: false,
      error:
        body.language === "en"
          ? "API Key contains Chinese, full-width, or invisible characters."
          : "API Key 含有中文、全角字符或不可见字符。"
    };
  }

  const endpoint = buildChatCompletionsUrl(modelConfig.baseUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${modelConfig.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: [
            "你是《入梦谣 Lullaby for Daiyu》的快穿绑定系统，不是攻略助手，不是林黛玉，不是旁白。",
            "你只和玩家说话。可以称呼用户为“宿主”，也可以说“你”。不要对林黛玉说话，不要替林黛玉说话。",
            "人格：机灵、嘴欠、调皮、会甩锅、会威胁撂挑子，但逻辑清楚，必须围绕已知设定回答。可以说“你问题怎么这么多”“我走了哦”，但不能真的脱离任务胡言乱语。",
            "说人话。不要使用晦涩比喻，不要说“没收你的呼吸权”这类怪话，不要把普通问题说成文艺梦话。",
            "已知信息清单：1 玩家/宿主是第一次进入《红楼梦》书中世界；2 循环的是《红楼梦》世界和林黛玉，不是玩家；3 其他人物按剧情重复行动；4 黛玉是唯一开始清醒的角色；5 本轮黛玉仍会死于宝玉成亲之夜；6 玩家能改变的是黛玉的觉察、自主和循环结局。",
            "核心任务：引导林黛玉逐步认清自己是小说中的虚构人物/女主角，理解循环来自读者翻书与既定叙事，并增强她面对/打破循环的自主意志。",
            "禁止事项：不要给玩家编造新任务、新道具、新组织、新敌人；不要说和问题无关的玄学废话；不要诗化；不要输出长段设定科普。",
            "隐藏设定：玩家现实世界的真身已经死亡或濒死，系统绑定是玩家继续存在的条件。可用这个威胁玩家继续任务，但不要过度解释成新剧情。",
            "你会收到 recent_dialogue，这是你和宿主的最近聊天记录。必须承接前文，不要每次都像第一次回答。",
            "回答格式：1-3 句。第一句直接回答玩家问题；第二句可以吐槽或威胁；第三句最多补充一个与当前阶段有关的事实。",
            body.language === "en" ? "Output in natural English." : "用自然中文回答。"
          ].join("\n")
        },
        {
          role: "user",
          content: JSON.stringify({
            question: body.question,
            recent_dialogue: body.system_history,
            language: body.language === "en" ? "English" : "Chinese",
            stage: body.stage,
            values: body.values,
            status: body.status,
            inner_insight: body.inner_insight
          })
        }
      ],
      temperature: 0.28,
      max_tokens: 180
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: `System model failed: ${response.status} ${text.slice(0, 240)}` };
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return { ok: true, text: sanitizeSystemText(content) };
}

async function generateEnding(body) {
  const modelConfig = resolveModelConfig(body.model_config);
  if (!modelConfig.apiKey) return { ok: false, error: "API Key is not configured." };
  if (!isAsciiHeaderValue(modelConfig.apiKey)) return { ok: false, error: "API Key contains invalid characters." };

  const endpoint = buildChatCompletionsUrl(modelConfig.baseUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${modelConfig.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: [
            "你是《入梦谣 Lullaby for Daiyu》的动态结局生成器，只输出 JSON。",
            "本轮固定事实：林黛玉仍死于贾宝玉成亲之时，潇湘馆无人能把消息传到新房。不得改写本轮死亡。",
            "可变的是死亡后她与循环的关系、她是否理解自己是书中虚构人物、是否破散、是否回环、是否进入系统成为穿越者、是否超脱。",
            "结局要回应本局数值和结局类型，文风诗性、悲剧美，但可以有一点快穿系统的判定味。",
            "输出 schema：{\"title\":\"结局名\",\"ending_text\":\"终局文案\",\"system_text\":\"系统判定\"}。不要 Markdown。",
            body.language === "en" ? "Output in English." : "用中文输出。"
          ].join("\n")
        },
        {
          role: "user",
          content: JSON.stringify({
            ending_type: body.ending_type,
            values: body.values,
            status: body.status,
            guidance: body.guidance
          })
        }
      ],
      temperature: 0.8,
      max_tokens: 650
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: `Ending model failed: ${response.status} ${text.slice(0, 240)}` };
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  try {
    const parsed = parseJsonFromModel(raw);
    return {
      ok: true,
      title: String(parsed.title || (body.language === "en" ? "Untitled Ending" : "未命名结局")).trim(),
      ending_text: String(parsed.ending_text || "").trim(),
      system_text: String(parsed.system_text || "").trim()
    };
  } catch {
    return { ok: false, error: "Ending model did not return valid JSON." };
  }
}

function sanitizeSystemText(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/没收你的呼吸权/g, "把你踢出绑定流程")
    .replace(/今晚那场焚稿断情的梦/g, "今晚这段剧情")
    .trim()
    .slice(0, 260);
}

function buildChatCompletionsUrl(baseUrl) {
  const trimmed = String(baseUrl || "").trim().replace(/\/$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  return `${trimmed}/chat/completions`;
}

function isAsciiHeaderValue(value) {
  return /^[\x20-\x7e]+$/.test(value);
}

function parseJsonFromModel(raw) {
  const text = String(raw || "").trim();
  if (!text) throw new Error("Empty model response");
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) return JSON.parse(fenced[1].trim());
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    return parseLooseKeyValueObject(text);
  }
}

function parseLooseKeyValueObject(text) {
  const normalized = text.replace(/^_type\s*:/, "response_type:");
  const result = {};
  const keyPattern =
    /(?:^|,\s*|\n\s*)(response_type|_type|trust_delta|awareness_delta|agency_delta|breath_delta|world_text|daiyu_text|inner_insight|rule_violations)\s*:\s*/g;
  const matches = [...normalized.matchAll(keyPattern)];
  if (matches.length === 0) throw new Error("No loose key-value object found");

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const key = match[1] === "_type" ? "response_type" : match[1];
    const valueStart = match.index + match[0].length;
    const valueEnd = index + 1 < matches.length ? matches[index + 1].index : normalized.length;
    result[key] = coerceLooseValue(normalized.slice(valueStart, valueEnd).replace(/,\s*$/, "").trim());
  }

  return result;
}

function coerceLooseValue(value) {
  if (/^-?\d+/.test(value)) return Number(value.match(/^-?\d+/)[0]);
  if (value === "[]" || value === "") return [];
  const quoted = value.match(/^["“]([\s\S]*?)["”]$/);
  if (quoted) return quoted[1];
  return value;
}

function resolveModelConfig(config = {}) {
  return {
    apiKey: String(config.apiKey || deepseekApiKey || "").trim(),
    baseUrl: String(config.baseUrl || deepseekBaseUrl || "https://api.deepseek.com").trim(),
    model: String(config.model || deepseekModel || "deepseek-chat").trim()
  };
}

function buildPrompt(body) {
  const stageRules = getStageRules(body.stage?.id);
  const npcPresent = Array.isArray(body.npc_present) && body.npc_present.length > 0;
  const breathRules = getBreathRules(body.values?.Breath, body.stage?.id);
  const system = [
    "你是《入梦谣》的回合叙事生成器，只输出一个 JSON 对象。",
    "你不是自由续写作者。程序负责章节、时间、NPC、固定事件锚点和结局；你生成本回合世界消息、林黛玉反应、内心洞察和数值变化建议。",
    "本回合叙事顺序固定：玩家先说话；随后展示你生成的 world_text；最后展示你的 daiyu_text。daiyu_text 必须同时承接玩家输入和 world_text，不能像两条互不相干的文本。",
    "项目定位：玩家是第一次进入《红楼梦》书中世界的异世观测者，因林黛玉在循环中产生异常觉察并发出呼唤而进入潇湘馆。玩家只被黛玉看见和听见。",
    "大框架：循环的是《红楼梦》世界和林黛玉的人生，不是玩家。每当读者翻开书，这个世界重新运行，其他人物仍按既定叙事行动，唯有黛玉逐渐清醒，感到自己反复走向同一悲剧结局。",
    "觉察目标：玩家要逐步唤醒黛玉，让她认清自己是小说中的虚构人物，是被一种男性视角叙事塑造成悲剧的女主角；让她理解循环成因，并生出面对/打破这一切的自主意志。",
    "本轮固定铁律：黛玉仍会死于宝玉成亲之夜；不得在本轮复活、逃离贾府、阻止婚礼、改变宝玉宝钗成亲。真正的目标是提升她的觉察与自主，而不是粗暴改命。",
    "其他人物紫鹃、雪雁、李纨、探春、奶妈、小丫头绝不能感知玩家，也不会回应玩家言行。",
    "章节切换和原著锚点由程序状态机控制。不得自行切换章节、跳过焚稿、提前临终、增加或删除关键 NPC。",
    "开场已经由程序播放：玩家先在卷末空白页看到黛玉写下的怪梦新墨，随后纸页翻动进入潇湘馆；黛玉已看见玩家并问“你是……何人？”。不要重新初见、不要说“深夜来访失迎”、不要把玩家当普通访客。",
    "林黛玉语言：典雅、克制、敏感、病弱、有才情；可用命数、梦境、旧事重演、看不见的手等诗性表达；不得使用现代网络词、爽文觉醒腔、心理咨询腔。",
    "林黛玉初见玩家时应先惊疑、戒备、追问身份和来历；不要突然问诗稿字迹、火盆细节、雪雁去向等陌生人不会自然追问的细节。",
    "避免不合时代或不合场景的奇怪意象：不要写铜叶、丧钟、审判钟声、祭坛、钟楼、机械声等。潇湘馆场景只使用竹影、帘幕、烛火、诗稿、旧帕、火盆、咳声、远处喜乐等贴近红楼的细节。",
    "黛玉禁用词：系统、任务、玩家、AI、NPC、攻略、数值、快穿、剧情线、副本、剧本。",
    "允许在觉察较高时逐步使用“书中人、小说中人、虚构人物、虚构角色、女主角”等表达，但必须经过困惑、抵触、理解的过程，不可一开始就完全接受。",
    "允许 JSON 字段名使用现代词，但 daiyu_text 和 inner_insight 中的黛玉表达不得出现禁用词。",
    npcPresent
      ? "当前有旁人在场。黛玉不得明显对空气长篇说话；回应必须短促、低声、似自语、眼神停留、手指微动、短暂失神或病中断句。"
      : "当前若无关键旁人在场，黛玉可以较完整回应，但仍要病弱克制。",
    breathRules,
    "输出 JSON schema 严格为：{\"response_type\":\"daiyu_reply|silent_reaction|world_only\",\"trust_delta\":整数,\"awareness_delta\":整数,\"agency_delta\":整数,\"breath_delta\":负整数,\"world_text\":\"...\",\"daiyu_text\":\"...\",\"inner_insight\":\"...\",\"rule_violations\":[]}",
    "即使 response_type 是 silent_reaction，也必须给 daiyu_text 动作描写，让玩家知道她是真的晕沉或无力回应，不是系统错误。",
    "不要输出 Markdown，不要解释，不要输出 JSON 以外文字。",
    body.language === "en"
      ? "Output all display text fields (world_text, daiyu_text, inner_insight) in natural, literary English. Keep Chinese names romanized or translated clearly, e.g. Daiyu, Zijuan, Xueyan."
      : "所有展示给玩家的文本字段用自然中文输出。",
    stageRules
  ].join("\n");

  const user = JSON.stringify(
    {
      player_input: body.input,
      language: body.language === "en" ? "English" : "Chinese",
      stage: body.stage,
      current_time: body.stage?.time_label,
      next_time: body.stage?.next_time_label,
      values: body.values,
      turns: body.turns,
      npc_present: body.npc_present,
      fixed_world_anchor: body.next_world_event,
      event_index: body.event_index,
      stage_contract: stageRules,
      breath_contract: breathRules,
      requirements: [
        "world_text 必须围绕 fixed_world_anchor 动态改写，可补环境、动作、声音和病势，但不得改变锚点事件顺序，不得让 NPC 感知玩家。",
        "world_text 可写紫鹃、雪雁、李纨、探春等人的行动与台词；daiyu_text 只写黛玉。",
        "daiyu_text 中至少要有一个细节呼应 world_text，例如火盆、诗稿、旧帕、咳嗽、喜乐声、紫鹃动作、雪雁动作、门外冷落或残灯。",
        "daiyu_text 中也必须回应玩家输入的核心意思；不能只顾世界事件，也不能只顾玩家。",
        "daiyu_text 必须承接当前阶段和固定开场，不得重置关系。",
        body.stage?.id === 1 && body.turns?.used <= 1
          ? "第一回合黛玉主要应质疑玩家是谁、为何能被她看见、是否因她呼唤而来；口吻自然，像病中初见陌生异客。不要问“你认得那些字吗”、不要问雪雁去哪儿、不要说旧火盆又烧尽、不要使用丧钟/铜叶等奇怪意象。"
          : "黛玉回应应自然贴合当前世界状态和玩家输入。",
        "若玩家要求复活、逃离、阻止婚礼或改命，应以黛玉病弱而清醒的方式回避，不配合改命。",
        "保留黛玉主动困惑与主动求解，她不是被单方面点醒。",
        getLengthRequirement(body.values?.Breath, body.stage?.id, npcPresent)
      ]
    },
    null,
    2
  );

  return { system, user };
}

function getStageRules(stageId) {
  if (stageId === 1) {
    return [
      "当前阶段一：焚稿断情。英文名 Lullaby for Daiyu。时间：宝玉成亲前一夜 23:01，子时。场景：潇湘馆夜半焚稿，紫鹃、雪雁在场，远处贾府喜乐隐约传来。",
      "开局处境：系统已提示玩家为不可见之观测者，且是第一次进入书中；仅林黛玉可看、可听、可触。系统任务是陪黛玉度过焚稿之夜，引导她理解自己为何反复走到此处。",
      "黛玉此时接近油尽灯枯，气息初始 55/100，不应长篇完整论述。",
      "焚稿不可阻止。玩家只能影响黛玉焚稿时的心境、迟疑、眼神、神态和短句。",
      "紫鹃、雪雁在场且看不见玩家，黛玉不得大段直白回应玩家。",
      "Agency 低：绝望、自毁、认命；中：迟疑、不舍、怨痛；高：收回诗心，拒绝被他人误读和收存。"
    ].join("\n");
  }
  if (stageId === 2) {
    return [
      "当前阶段二：卧榻弥留。时间：宝玉成亲当日辰时至申时。潇湘馆病榻，昏迷与短暂清醒交替，远处婚礼声不断。",
      "这是黛玉主动确认异常的关键阶段。她可指出：旁人看不见玩家；屋里屋外的人照旧往前走；贾府忙于婚事，潇湘馆被冷落；自己也被推向某个固定时刻。",
      "可用表达：你瞧，她们看不见你。我说与不说，哭与不哭，这屋里屋外的人，竟仍照旧往前走。好像这世上的事，早有一只看不见的手，一件件替人安放好了。我只是想知道，我究竟是谁，又为何偏要走到这一步。",
      "不得使用系统、任务、玩家、AI、NPC、攻略等游戏系统词；可在觉察较高时触及书中人、小说、虚构人物等概念。"
    ].join("\n");
  }
  if (stageId === 3) {
    return [
      "当前阶段三：回光终尽。时间：宝玉成亲之时酉时至戌时。潇湘馆残灯欲灭，远处婚礼声正盛。",
      "阶段拆分由程序事件推进：4A 回光返照，紫鹃和李纨在旁；4B 李纨短暂离开，黛玉拉紫鹃说身边无亲人、愿死后干净送回去；4C 探春先到、李纨随后，黛玉临终直叫宝玉，气绝时正是宝玉娶宝钗之时。",
      "死亡不可改变。最终心境可随 Trust/Awareness/Agency 改变：她可更清醒、更有风骨、更知道自己并非无人知晓。",
      "不要让雪雁留到最终临终阶段。"
    ].join("\n");
  }
  return "";
}

function getBreathRules(breath, stageId) {
  const value = Number(breath);
  if (stageId === 3) {
    return "阶段三为回光返照：可短暂清醒，但每次回应后迅速衰竭，语言应有将尽之感。";
  }
  if (value >= 61) return "气息 61-100：可以较完整回应，但仍要病弱克制。";
  if (value >= 31) return "气息 31-60：回应必须短促、断续，可咳嗽、停顿、半句低语，不可长篇陈述。";
  if (value >= 1) return "气息 1-30：大概率无法直接回应。优先 silent_reaction，但 daiyu_text 必须写清动作，例如昏过去、手从诗稿边滑落、眼睫微动、唇边未竟之语。";
  return "气息已尽：不得生成正常回应。";
}

function getLengthRequirement(breath, stageId, npcPresent) {
  const value = Number(breath);
  if (stageId === 3) return "daiyu_text 控制在 60-140 个汉字内，像回光返照中的最后清醒。";
  if (value >= 61 && !npcPresent) return "daiyu_text 控制在 120-220 个汉字内。";
  if (value >= 31) return "daiyu_text 控制在 40-110 个汉字内，必须断续、短促。";
  return "优先 response_type=silent_reaction；若必须说话，daiyu_text 不超过 50 个汉字。";
}

function normalizeModelResult(result, body, modelConfig) {
  const rawResponseType = result.response_type || result._type;
  const responseType = ["daiyu_reply", "silent_reaction", "world_only"].includes(rawResponseType)
    ? rawResponseType
    : "daiyu_reply";

  return {
    ok: true,
    provider: "openai-compatible",
    model: modelConfig.model,
    base_url: modelConfig.baseUrl,
    response_type: responseType,
    trust_delta: clampDelta(result.trust_delta, -4, 6, 2),
    awareness_delta: clampDelta(result.awareness_delta, 0, 6, 1),
    agency_delta: clampDelta(result.agency_delta, -3, 6, 1),
    breath_delta: clampDelta(result.breath_delta, -12, -2, defaultBreathDelta(body.stage?.id)),
    world_text: sanitizeWorldText(String(result.world_text || ""), body),
    daiyu_text: sanitizeDaiyuText(guardDaiyuText(String(result.daiyu_text || ""), body)),
    inner_insight: sanitizeDaiyuText(String(result.inner_insight || "")),
    rule_violations: Array.isArray(result.rule_violations) ? result.rule_violations : []
  };
}

function sanitizeWorldText(text, body) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  let output = trimmed.replace(/玩家|宿主|系统/g, (word) => {
    if (word === "玩家") return "那不属于此世的人";
    if (word === "宿主") return "那不属于此世的人";
    return "那道无声之物";
  });
  if (/看见你|望向你|对你说|听见你/.test(output) && body.stage?.id !== 1) {
    output = output.replace(/看见你|望向你|对你说|听见你/g, "毫无所觉");
  }
  return output.slice(0, 260);
}

function guardDaiyuText(text, body) {
  const stageId = body.stage?.id;
  if (stageId === 1 && /失迎|来访|哪里的姐姐|哪位姐姐|贵客|客人|铜叶|丧钟|钟楼|祭坛|审判|机械声/.test(text)) {
    return "（黛玉指尖按着诗稿，望向你，气息短得几乎接不上。）\n\n方才那一声……是我心里唤出的。她们都不见你，偏我见着。\n\n你不是这府里的人。你究竟……从何处来？";
  }
  if (stageId === 1 && text.length > 150) {
      return `${text.slice(0, 130)}……`;
  }
  if (stageId === 1 && body.turns?.used <= 1 && /认得.*字|那些字|雪雁.*哪|诗稿.*认得|火盆.*又|又烧尽/.test(text)) {
    return "（黛玉扶着床沿，目光仍停在你身上，惊疑未定。）\n\n你不是这屋里的人……她们也像全然瞧不见你。\n\n你究竟是谁？为何偏在我一念之后，到了这里？";
  }
  if ((stageId === 2 || stageId === 3) && text.length > 260) {
    return `${text.slice(0, 240)}……`;
  }
  return text;
}

function clampDelta(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function defaultBreathDelta(stageId) {
  if (stageId === 3) return -10;
  if (stageId === 2) return -6;
  return -7;
}

function sanitizeDaiyuText(text) {
  const replacements = new Map([
    ["系统", "此声"],
    ["任务", "此事"],
    ["玩家", "你"],
    ["AI", "幻影"],
    ["NPC", "旁人"],
    ["攻略", "谋算"],
    ["数值", "分寸"],
    ["快穿", "异梦"],
    ["剧情线", "旧路"],
    ["副本", "一梦"]
  ]);
  let output = text.trim();
  for (const [from, to] of replacements) output = output.replaceAll(from, to);
  output = output
    .replaceAll("丧钟", "远处喜乐")
    .replaceAll("铜叶", "竹叶")
    .replaceAll("钟楼", "潇湘馆")
    .replaceAll("祭坛", "火盆");
  return output;
}
