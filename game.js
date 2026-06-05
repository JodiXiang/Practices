const forbiddenDaiyuTerms = [
  "系统",
  "任务",
  "玩家",
  "AI",
  "NPC",
  "攻略",
  "数值",
  "快穿",
  "剧情线",
  "副本",
  "剧本"
];

const stages = [
  {
    id: 1,
    chapter: "第一章",
    title: "焚稿断情",
    meta: "宝玉成亲前一夜・亥时｜潇湘馆",
    startMinutes: 21 * 60 + 1,
    turnMinutes: 7,
    maxTurns: 6,
    initialBreath: 55,
    task: "陪黛玉度过焚稿之夜，引导她察觉循环，并开始追问自己究竟是谁。",
    npcPresent: ["紫鹃", "雪雁"],
    opening:
      "（抬眼看向你，神情有几分错愕，也有几分戒备。）\n\n“你是……何人？”",
    events: [
      "黛玉喘了半晌，低声向雪雁道：“把我的诗稿拿来。”她又似想起什么：“还有那有字的旧帕，一并给我。”",
      "黛玉先将旧帕投向火中，帕角一卷，字迹顷刻模糊。",
      "她把诗稿拢在怀中片刻，终于一页页送入火里。紫鹃急得要拦，却扶着黛玉身子，半步也腾挪不开。",
      "雪雁扑过去抢救诗稿，火星一散，余下的已不过几片残纸。纸灰落尽，黛玉猛地咳起来，病势像被那火一并催重了。"
    ]
  },
  {
    id: 2,
    chapter: "第二章",
    title: "卧榻弥留",
    meta: "宝玉成亲当日・辰时至申时｜潇湘馆",
    startMinutes: 9 * 60 + 18,
    turnMinutes: 37,
    maxTurns: 10,
    initialBreath: 35,
    task: "在她清醒时，引导她看清自己的心结。",
    threshold: { awareness: 52 },
    npcPresent: ["紫鹃", "雪雁", "王奶妈", "小丫头"],
    events: [
      "白日渐明，黛玉昏晕在榻，只剩一丝微气细细不断。",
      "紫鹃探了探她的气息，脸色一变，转身要去回贾母。",
      "外头却正为宝玉婚事忙乱，潇湘馆门前冷清得像隔了一重世。",
      "紫鹃请不动众人，只得又托人去请李纨。",
      "李纨因婚礼场面需回避，终于来到潇湘馆，坐在榻边照应。",
      "雪雁被婚事那边叫走，回头望了望床上人，终究被催着离开。"
    ]
  },
  {
    id: 3,
    chapter: "第三章",
    title: "回光终尽",
    meta: "宝玉成亲之时・酉时至戌时｜潇湘馆",
    startMinutes: 18 * 60 + 42,
    turnMinutes: 9,
    maxTurns: 5,
    initialBreath: 45,
    task: "完成最后告别。",
    npcPresent: ["紫鹃", "李纨"],
    events: [
      "晚间，黛玉忽缓过一口气来，眼底竟有一线清明。雪雁此时已不在屋内。",
      "紫鹃忙俯身唤道：“姑娘，你醒了？感觉怎么样？”黛玉微微张口：“紫鹃，给我口水喝。”紫鹃赶紧喂了些桂圆汤与梨汁。",
      "李纨看着她忽然转亮的神色，心中一沉，知这多半是回光返照，便暂去料理外头事务。",
      "屋里只剩紫鹃、奶妈和几个小丫头守着。黛玉醒来看见紫鹃，伸手拉住她，断续说身边并无亲人。",
      "她又轻声嘱咐，若自己去了，身子要干干净净，好歹送她回去。紫鹃哭着叫人去请李纨，帘外脚步纷乱，探春先赶了进来。",
      "李纨随后赶到，远处喜乐正盛，潇湘馆里却只听得人压低的哭声。黛玉气息已微，仍一声声叫着宝玉。此时，宝钗正入洞房。"
    ]
  }
];

const state = {
  stageIndex: 0,
  eventIndex: 0,
  turnsUsed: 0,
  unread: 1,
  finished: false,
  introReady: false,
  introDialogueShown: false,
  values: {
    Trust: 10,
    Awareness: 5,
    Agency: 3,
    Breath: 55
  },
  consecutiveSleep: 0,
  innerInsight: ""
};

const el = {
  chatFlow: document.querySelector("#chatFlow"),
  input: document.querySelector("#playerInput"),
  send: document.querySelector("#sendButton"),
  statusLine: document.querySelector("#statusLine"),
  systemButton: document.querySelector("#systemButton"),
  settingsButton: document.querySelector("#settingsButton"),
  languageButton: document.querySelector("#languageButton"),
  badge: document.querySelector("#systemBadge"),
  panel: document.querySelector("#systemPanel"),
  settingsPanel: document.querySelector("#settingsPanel"),
  introCard: document.querySelector("#introCard"),
  introKicker: document.querySelector("#introKicker"),
  introBody: document.querySelector("#introBody"),
  introTimeTitle: document.querySelector("#introTimeTitle"),
  introTimeText: document.querySelector("#introTimeText"),
  introTurnsTitle: document.querySelector("#introTurnsTitle"),
  introTurnsText: document.querySelector("#introTurnsText"),
  introBreathTitle: document.querySelector("#introBreathTitle"),
  introBreathText: document.querySelector("#introBreathText"),
  introTrustTitle: document.querySelector("#introTrustTitle"),
  introTrustText: document.querySelector("#introTrustText"),
  introAwarenessTitle: document.querySelector("#introAwarenessTitle"),
  introAwarenessText: document.querySelector("#introAwarenessText"),
  introAgencyTitle: document.querySelector("#introAgencyTitle"),
  introAgencyText: document.querySelector("#introAgencyText"),
  introSystemChatTitle: document.querySelector("#introSystemChatTitle"),
  introSystemChatText: document.querySelector("#introSystemChatText"),
  dismissIntro: document.querySelector("#dismissIntro"),
  topKicker: document.querySelector("#topKicker"),
  mainTitle: document.querySelector("#mainTitle"),
  systemKicker: document.querySelector("#systemKicker"),
  settingsKicker: document.querySelector("#settingsKicker"),
  settingsTitle: document.querySelector("#settingsTitle"),
  modelStatusLabel: document.querySelector("#modelStatusLabel"),
  saveModelSettings: document.querySelector("#saveModelSettings"),
  closePanel: document.querySelector("#closePanel"),
  closeSettingsPanel: document.querySelector("#closeSettingsPanel"),
  panelChapter: document.querySelector("#panelChapter"),
  panelTask: document.querySelector("#panelTask"),
  panelStatus: document.querySelector("#panelStatus"),
  trustValue: document.querySelector("#trustValue"),
  awarenessValue: document.querySelector("#awarenessValue"),
  agencyValue: document.querySelector("#agencyValue"),
  panelModel: document.querySelector("#panelModel"),
  modelForm: document.querySelector("#modelForm"),
  baseUrlInput: document.querySelector("#baseUrlInput"),
  apiKeyInput: document.querySelector("#apiKeyInput"),
  modelInput: document.querySelector("#modelInput"),
  clearModelSettings: document.querySelector("#clearModelSettings"),
  testModelSettings: document.querySelector("#testModelSettings"),
  systemLog: document.querySelector("#systemLog"),
  systemQuestionInput: document.querySelector("#systemQuestionInput"),
  askSystemButton: document.querySelector("#askSystemButton"),
  bootOverlay: document.querySelector("#bootOverlay"),
  bootLines: document.querySelector("#bootLines"),
  modal: document.querySelector("#chapterModal"),
  chapterNumber: document.querySelector("#chapterNumber"),
  chapterTitle: document.querySelector("#chapterTitle"),
  chapterMeta: document.querySelector("#chapterMeta"),
  continueChapter: document.querySelector("#continueChapter")
};

let language = localStorage.getItem("rumengyao:language") || "zh";

const uiText = {
  zh: {
    langButton: "EN",
    systemButton: "系统",
    inputPlaceholder: "对黛玉说些什么。",
    send: "发送",
    taskLabel: "当前任务",
    statusLabel: "当前状态",
    trust: "信任",
    trustHint: "她有多相信你。",
    awareness: "觉察",
    awarenessHint: "她有多认清自己是谁、循环为何发生。",
    agency: "自主",
    agencyHint: "她有多想面对并打破这一切。",
    introKicker: "系统说明",
    introBody:
      "林黛玉被困在《红楼梦》的循环里。每当书页重新翻开，她便再次醒来，走向同一场焚稿、病逝与误解。你的任务不是强行改写本轮死亡，而是在最后一程中唤醒她：让她明白自己活在一本书里，所受之苦并非她的错，而是早已写好的剧情。",
    mainTask: "陪伴黛玉走过临终之前的一段时光，并唤醒她的自主意识；只有这样，才有机会带她脱离书中的剧情与循环。",
    introTimeTitle: "当前时间",
    introTimeText: "21:01｜亥时。时间会随回合向前推进，提示原著事件正在逼近。",
    introTurnsTitle: "剩余对话",
    introTurnsText: "你还剩多少次主要发言。每发送一次给黛玉的话，都会消耗 1 回合。",
    introBreathTitle: "黛玉气息",
    introBreathText: "她当前的体力与精神。气息越低，回应越短；低于 30 时可能只能给出动作反应。",
    introTrustTitle: "信任",
    introTrustText: "她有多相信你，是否愿意把最后的脆弱交给你听。",
    introAwarenessTitle: "觉察",
    introAwarenessText: "她有多意识到自己是书中人、命运为何反复重演。",
    introAgencyTitle: "自主",
    introAgencyText: "她有多少勇气面对真相，并试着从既定剧情中挣脱。",
    introSystemChatTitle: "系统对话",
    introSystemChatText: "你可以在下方和系统自由对话，询问背景、状态或吐槽它。系统只对你说话，不会被黛玉听见。",
    dismissIntro: "我明白了",
    systemIntro: "宿主，绑定已完成。别急着问我是不是靠谱，我通常靠谱，偶尔甩锅。",
    askPlaceholder: "和系统说话...",
    askSend: "发",
    topKicker: "入梦谣 · Lullaby for Daiyu",
    mainTitle: "香魂一缕随风散，愁绪三更入梦——",
    systemKicker: "快穿系统",
    settingsKicker: "模型设置",
    settingsTitle: "对话模型",
    modelStatusLabel: "当前模型",
    saveModel: "保存模型设置",
    testModel: "测试",
    clearModel: "清除模型设置",
    continue: "继续",
    systemThinking: "等会儿，宿主。系统正在把锅从自己身上挪开……",
    modelMissingKey: "API Key 为空",
    modelFileProtocol: "请通过 http://127.0.0.1:4173 打开页面后再测试模型连接。",
    modelUnavailable: "DeepSeek 暂不可用",
    modelRequestFailed: "DeepSeek 请求失败",
    modelFallbackPrefix: "模型调用失败，已回退本地生成器：",
    modelTestSuccess: "连接成功",
    modelTestFailed: "连接失败",
    modelTestNotSent: "请求未发出",
    modelTestRequestFailed: "连接测试失败",
    modelTestError: "测试失败",
    gameOver: "游戏结束。",
    chapterWord: "第",
    chapterSuffix: "章"
  },
  en: {
    langButton: "中",
    systemButton: "System",
    inputPlaceholder: "Say something to Daiyu.",
    send: "Send",
    taskLabel: "Current Task",
    statusLabel: "Current Status",
    trust: "Trust",
    trustHint: "How much she trusts you.",
    awareness: "Awareness",
    awarenessHint: "How clearly she understands who she is and why the loop exists.",
    agency: "Agency",
    agencyHint: "How strongly she wants to face and break all this.",
    introKicker: "System Briefing",
    introBody:
      "Lin Daiyu is trapped inside the repeating world of Dream of the Red Chamber. Whenever the book is opened again, she wakes again and walks toward the same burning of manuscripts, illness, death, and misunderstanding. Your task is not to forcibly rewrite this death, but to awaken her in the final stretch: help her understand that she lives inside a book, and that her suffering was not her fault, but a story written in advance.",
    mainTask: "Accompany Daiyu through the final stretch before death and awaken her agency; only then can she have a chance to leave the written plot and its cycle.",
    introTimeTitle: "Current Time",
    introTimeText: "21:01 | Hai hour. Time advances with each turn, showing the original events drawing closer.",
    introTurnsTitle: "Remaining Turns",
    introTurnsText: "How many major messages you can still send to Daiyu. Each message costs 1 turn.",
    introBreathTitle: "Daiyu Breath",
    introBreathText: "Her current strength and spirit. The lower it gets, the shorter her replies become; below 30, she may only react silently.",
    introTrustTitle: "Trust",
    introTrustText: "How much she trusts you, and whether she can entrust her final vulnerability to you.",
    introAwarenessTitle: "Awareness",
    introAwarenessText: "How clearly she realizes she is a person in a book, and why fate keeps repeating.",
    introAgencyTitle: "Agency",
    introAgencyText: "How much courage she has to face the truth and struggle beyond the written plot.",
    introSystemChatTitle: "System Chat",
    introSystemChatText: "You can freely talk with the system below about the world, status, or its suspicious work ethic. The system speaks only to you; Daiyu cannot hear it.",
    dismissIntro: "Got it",
    systemIntro: "Host, binding complete. Do not ask whether I am reliable. I usually am. Occasionally I blame others.",
    askPlaceholder: "Talk to the system...",
    askSend: "Send",
    topKicker: "Lullaby for Daiyu",
    mainTitle: "A wisp of fragrant soul scatters with the wind; sorrow enters the dream at midnight—",
    systemKicker: "Transmigration System",
    settingsKicker: "Model Settings",
    settingsTitle: "Dialogue Model",
    modelStatusLabel: "Current Model",
    saveModel: "Save Model Settings",
    testModel: "Test",
    clearModel: "Clear Model Settings",
    continue: "Continue",
    systemThinking: "One second, Host. The system is moving the blame off its own desk...",
    modelMissingKey: "API Key is empty",
    modelFileProtocol: "Open http://127.0.0.1:4173 before testing the model connection.",
    modelUnavailable: "DeepSeek is temporarily unavailable",
    modelRequestFailed: "DeepSeek request failed",
    modelFallbackPrefix: "Model call failed; using local generator: ",
    modelTestSuccess: "Connected",
    modelTestFailed: "Connection failed",
    modelTestNotSent: "request not sent",
    modelTestRequestFailed: "Connection test failed",
    modelTestError: "Test failed",
    gameOver: "Game Over.",
    chapterWord: "Chapter ",
    chapterSuffix: ""
  }
};

const stageEnglish = {
  1: {
    chapter: "Chapter 1",
    title: "Burning the Manuscripts",
    meta: "The night before Baoyu's wedding · Hai hour · Xiaoxiang Lodge",
    task: "Stay with Daiyu through the night of burning manuscripts; guide her to sense the loop and begin asking who she truly is."
  },
  2: {
    chapter: "Chapter 2",
    title: "Lingering at the Sickbed",
    meta: "The day of Baoyu's wedding · Chen to Shen hours · Xiaoxiang Lodge",
    task: "When she is briefly lucid, guide her toward the truth of her situation."
  },
  3: {
    chapter: "Chapter 3",
    title: "The Last Light",
    meta: "During Baoyu's wedding · You to Xu hours · Xiaoxiang Lodge",
    task: "Complete the final farewell."
  }
};

function displayStage(stage) {
  if (language !== "en") return stage;
  return {
    ...stage,
    chapter: stageEnglish[stage.id]?.chapter || stage.chapter,
    title: stageEnglish[stage.id]?.title || stage.title,
    meta: stageEnglish[stage.id]?.meta || stage.meta,
    task: stageEnglish[stage.id]?.task || stage.task
  };
}

const modelState = {
  provider: "openai-compatible",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
  configured: false,
  lastError: "",
  testMessage: ""
};

const modelSettingsKey = "rumengyao:model-settings";

const systemHistory = [
  {
    role: "assistant",
    content:
      language === "en"
        ? "Host, binding complete. Do not ask whether I am reliable. I usually am. Occasionally I blame others."
        : "宿主，绑定已完成。别急着问我是不是靠谱，我通常靠谱，偶尔甩锅。"
  }
];

function currentStage() {
  return stages[state.stageIndex];
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function statusLine() {
  const stage = currentStage();
  const remaining = Math.max(0, stage.maxTurns - state.turnsUsed);
  if (language === "en") {
    return `${currentClock()} | Turns ${remaining}/${stage.maxTurns} | Daiyu Breath ${state.values.Breath}/100`;
  }
  return `${currentClock()}｜剩余对话 ${remaining}/${stage.maxTurns}｜黛玉气息 ${state.values.Breath}/100`;
}

function currentClock(offsetTurns = 0) {
  const stage = currentStage();
  const minutes = (stage.startMinutes + (state.turnsUsed + offsetTurns) * stage.turnMinutes) % (24 * 60);
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

function renderStatus() {
  const stage = displayStage(currentStage());
  const badgeText = String(state.unread);
  const text = uiText[language];
  el.statusLine.textContent = statusLine();
  el.panelChapter.textContent = `${stage.chapter}｜${stage.title}`;
  el.panelTask.textContent = text.mainTask;
  el.panelModel.textContent = modelLabel();
  el.panelStatus.textContent = statusLine();
  el.trustValue.textContent = state.values.Trust;
  el.awarenessValue.textContent = state.values.Awareness;
  el.agencyValue.textContent = state.values.Agency;
  el.badge.textContent = badgeText;
  el.badge.classList.toggle("hidden", state.unread === 0);
}

function applyLanguage() {
  const text = uiText[language];
  document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  el.topKicker.textContent = text.topKicker;
  el.mainTitle.textContent = text.mainTitle;
  el.languageButton.textContent = text.langButton;
  el.systemButton.firstChild.textContent = text.systemButton;
  el.input.placeholder = text.inputPlaceholder;
  el.send.textContent = text.send;
  el.systemKicker.textContent = text.systemKicker;
  el.settingsKicker.textContent = text.settingsKicker;
  el.settingsTitle.textContent = text.settingsTitle;
  el.modelStatusLabel.textContent = text.modelStatusLabel;
  el.saveModelSettings.textContent = text.saveModel;
  el.testModelSettings.textContent = text.testModel;
  el.clearModelSettings.textContent = text.clearModel;
  el.continueChapter.textContent = text.continue;
  const panelItems = el.panel.querySelectorAll(".panel-list dt");
  if (panelItems[0]) panelItems[0].textContent = text.taskLabel;
  if (panelItems[1]) panelItems[1].textContent = text.statusLabel;
  el.trustValue.previousElementSibling.textContent = text.trust;
  el.awarenessValue.previousElementSibling.textContent = text.awareness;
  el.agencyValue.previousElementSibling.textContent = text.agency;
  el.introKicker.textContent = text.introKicker;
  el.introBody.textContent = text.introBody;
  el.introTimeTitle.textContent = text.introTimeTitle;
  el.introTimeText.textContent = text.introTimeText;
  el.introTurnsTitle.textContent = text.introTurnsTitle;
  el.introTurnsText.textContent = text.introTurnsText;
  el.introBreathTitle.textContent = text.introBreathTitle;
  el.introBreathText.textContent = text.introBreathText;
  el.introTrustTitle.textContent = text.introTrustTitle;
  el.introTrustText.textContent = text.introTrustText;
  el.introAwarenessTitle.textContent = text.introAwarenessTitle;
  el.introAwarenessText.textContent = text.introAwarenessText;
  el.introAgencyTitle.textContent = text.introAgencyTitle;
  el.introAgencyText.textContent = text.introAgencyText;
  el.introSystemChatTitle.textContent = text.introSystemChatTitle;
  el.introSystemChatText.textContent = text.introSystemChatText;
  el.dismissIntro.textContent = text.dismissIntro;
  const firstSystemMessage = el.systemLog?.querySelector(".system-chat-row.system p");
  if (firstSystemMessage && systemHistory.length === 1) {
    firstSystemMessage.textContent = text.systemIntro;
    systemHistory[0].content = text.systemIntro;
  }
  el.systemLog?.querySelectorAll(".system-chat-row").forEach((row) => {
    const label = row.querySelector("span");
    if (!label) return;
    label.textContent = row.classList.contains("user") ? (language === "en" ? "Host" : "宿主") : language === "en" ? "System" : "系统";
  });
  el.systemQuestionInput.placeholder = text.askPlaceholder;
  el.askSystemButton.textContent = text.askSend;
  if (el.modal.classList.contains("open")) showChapterCard(currentStage());
  document.title = language === "en" ? "Lullaby for Daiyu" : "入梦谣｜Lullaby for Daiyu";
}

function toggleLanguage() {
  language = language === "zh" ? "en" : "zh";
  localStorage.setItem("rumengyao:language", language);
  applyLanguage();
  renderStatus();
}

function modelLabel() {
  if (modelState.testMessage) {
    return modelState.testMessage;
  }
  if (modelState.configured) {
    return `${modelState.model} | ${modelState.baseUrl}`;
  }
  if (modelState.lastError) {
    return language === "en" ? `Local generator | ${modelState.lastError}` : `本地生成器｜${modelState.lastError}`;
  }
  return language === "en" ? "No model configured | using local fallback" : "未配置模型｜已回退本地生成器";
}

function addMessage(kind, label, text) {
  const wrap = document.createElement("article");
  wrap.className = `message ${kind}`;

  const labelEl = document.createElement("div");
  labelEl.className = "label";
  labelEl.textContent = labelText(label);

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrap.append(labelEl, bubble);
  el.chatFlow.append(wrap);
  el.chatFlow.scrollTop = el.chatFlow.scrollHeight;
}

function labelText(label) {
  if (language !== "en") return label;
  const labels = {
    玩家信息: "Player",
    世界: "World",
    林黛玉: "Daiyu",
    系统: "System"
  };
  return labels[label] || label;
}

function playerOpeningText() {
  if (language === "en") {
    return "On a blank page at the end of Dream of the Red Chamber, you see a line of fresh ink.\n\n“Lately I often dream a strange dream. When someone opens the book, I wake; when someone closes it, I die. Yet I am plainly still here. Gods, spirits, ghosts, whatever hand made this world—if such a hand exists, can it tell me: who am I?”\n\nThe ink has not yet dried.\n\nA moment later, the pages turn by themselves.";
  }
  return "你在《红楼梦》卷末的空白页上，看见了一行新墨。\n\n“我近来常做一个怪梦。梦里有人翻书，我便醒来；有人合卷，我便死去。可我明明还在这里。天地神佛也好，精灵鬼怪也罢，若真有造物之手，可否告诉我——我究竟是谁？”\n\n墨迹未干。\n\n下一刻，纸页自行翻动。";
}

function worldOpeningText() {
  if (language === "en") {
    return "You hear bamboo leaves rustling in the night, and behind the curtain, a restrained cough. The lamp in Xiaoxiang Lodge is still lit.\n\nSeveral bundles of poems lie on the table, with an old handkerchief beside them. The brazier has not yet been kindled.\n\nA young girl in a crimson outer robe leans against the bed. Her face is very pale, her hair slightly disordered, as if she has been waiting for a long time.";
  }
  return "你听见竹叶在夜里沙沙作响，听见帘后传来一声压低的轻咳。潇湘馆的灯还亮着。\n\n案上堆着几卷诗稿，旁边放着一方旧帕。火盆里的炭尚未点起。\n\n一个披着绛色外衣的少女斜倚床榻，脸色极白，鬓发微乱，像是已经等了很久。";
}

function daiyuOpeningText() {
  if (language === "en") {
    return "(She raises her eyes to you, startled and wary.)\n\n“Who... are you?”";
  }
  return stages[0].opening;
}

const bootLines = [
  "【系统提示：世界线锚定完毕。】",
  "【当前时空：《红楼梦》高鹗续作流派 · 第九十七回。】",
  "【核心场景：贾府大婚在即，潇湘馆夜半焚稿。】",
  "【宿主身份：不可见之观测者（全隐匿状态，仅目标人物林黛玉可看、可听、可触）。】",
  "【主线任务：陪伴目标人物林黛玉走完凡世最后一程。】",
  "【核心限制：历史修正力极其强大，天命不可违逆，林黛玉必死于贾宝玉大婚之夜。请宿主切勿尝试强行扭转因果，否则将引发系统崩溃。】",
  "【系统提示：检测到目标人物精神波动剧烈，正在接入梦境……】"
];

const bootLinesEn = [
  "[System: Worldline anchored.]",
  "[Current Time-Space: Dream of the Red Chamber, Gao E continuation lineage, Chapter 97.]",
  "[Core Scene: The Jia household wedding approaches; Xiaoxiang Lodge, midnight, burning manuscripts.]",
  "[Host Identity: Invisible observer. Fully concealed; only Lin Daiyu can see, hear, and touch you.]",
  "[Main Task: Accompany Lin Daiyu through the final stretch of her mortal life.]",
  "[Core Restriction: Historical correction force is extremely strong. Fate cannot be directly overturned; Lin Daiyu will die on the night of Jia Baoyu's wedding.]",
  "[System: Severe mental fluctuation detected in target. Connecting to dream state...]"
];

function playBootSequence() {
  el.bootLines.textContent = "";
  el.bootOverlay.classList.add("open");
  el.bootOverlay.setAttribute("aria-hidden", "false");
  const lines = language === "en" ? bootLinesEn : bootLines;
  lines.forEach((line, index) => {
    window.setTimeout(() => {
      const lineEl = document.createElement("div");
      lineEl.className = "boot-line";
      lineEl.textContent = line;
      el.bootLines.append(lineEl);
    }, index * 920);
  });
  window.setTimeout(() => {
    el.bootOverlay.classList.remove("open");
    el.bootOverlay.setAttribute("aria-hidden", "true");
    openPanel();
  }, lines.length * 920 + 2200);
}

function sanitizeDaiyu(text) {
  let output = text;
  if (language === "en") return output;
  for (const term of forbiddenDaiyuTerms) {
    output = output.replaceAll(term, "此事");
  }
  return output;
}

function analyzeInput(text) {
  const trustWords = ["陪", "懂", "听", "在", "别怕", "不独", "不是一个人", "相信", "来见"];
  const awarenessWords = ["命", "梦", "书", "后世", "记得", "看见", "安排", "注定", "异常", "真"];
  const agencyWords = ["你是你", "不属于", "不只是", "诗", "清白", "自己", "留下", "拒绝", "由你"];
  return {
    trust: trustWords.some((word) => text.includes(word)),
    awareness: awarenessWords.some((word) => text.includes(word)),
    agency: agencyWords.some((word) => text.includes(word)),
    gentle: /抱歉|对不起|冒昧|不强求|慢慢|歇/.test(text),
    forceful: /逃|复活|改命|阻止|带你走|杀|救你出去/.test(text)
  };
}

function applyDeltas(deltas) {
  state.values.Trust = clamp(state.values.Trust + deltas.trust);
  state.values.Awareness = clamp(state.values.Awareness + deltas.awareness);
  state.values.Agency = clamp(state.values.Agency + deltas.agency);
  state.values.Breath = clamp(state.values.Breath + deltas.breath);
}

function stageOneReply(input, cues) {
  if (language === "en") {
    const posture =
      state.values.Agency >= 28
        ? "(She looks toward the brazier. There are tears in her eyes, but she refuses to let them fall.)\n\nBurning them may be better. Left in this world, they may never be read as mine."
        : state.values.Agency >= 14
          ? "(Her arms tighten around the manuscripts as Xueyan tends the fire nearby.)\n\nThese pages stayed with me for years. Now even the flame is kinder than people."
          : "(She gives a faint, paper-thin smile, her cough buried under the distant wedding music.)\n\nIf all of it is gone, perhaps it will be clean.";
    const reply = cues.trust
      ? "\n\nHer lashes tremble as if she has heard you. She adds, barely aloud, “If you are here... then watch for me.”"
      : "\n\nWith Zijuan beside her, she does not turn her head. Half a sentence disappears into a cough.";
    return `${posture}${reply}`;
  }
  const posture =
    state.values.Agency >= 28
      ? "（她望着火盆，眼中有泪，却不肯落下。）\n\n烧了也好。留在人间，未必有人肯按我的心读它。"
      : state.values.Agency >= 14
        ? "（她抱着诗稿的手微微一顿，听着雪雁在旁拨火，眼底一酸。）\n\n这些字跟了我这几年，如今竟也只有火还肯收。"
        : "（她忽然一笑，笑意薄得像纸灰，咳声压在喜乐声底下。）\n\n都没了才干净。";
  const reply = cues.trust
    ? "\n\n她像听见你的话，眼睫轻轻一颤，只低低添了一句：“你在，便替我看着罢。”"
    : "\n\n紫鹃在旁，她没有回头，只将半句话咽进咳声里。";
  return sanitizeDaiyu(`${posture}${reply}`);
}

function stageTwoReply(input, cues) {
  const breathWeak = state.values.Breath <= 30;
  if (breathWeak && Math.random() < 0.45) {
    state.consecutiveSleep += 1;
    return {
      type: "silent_reaction",
      text:
        language === "en"
          ? "(Daiyu's lashes stir as if she has heard you, but she has no strength to answer. Her fingers curl faintly on the quilt, then loosen again.)"
          : "（黛玉眼睫动了动，似乎听见，却终究没有力气答你。她的手指在被上轻轻蜷起，又慢慢松开。）"
    };
  }

  state.consecutiveSleep = 0;
  if (language === "en") {
    const opening =
      "(She wakes from a daze. Her gaze first falls on Zijuan, then passes beyond everyone else and rests where you stand.)\n\nLook. They cannot see you.";
    const awareness =
      state.values.Awareness >= 34 || cues.awareness
        ? "\n\nWhether I speak or stay silent, whether I weep or not, everyone inside and outside this room keeps walking the same old path. It is as if an unseen hand has already arranged each thing."
        : "\n\nThese days, old moments keep pressing down on me. People's hearts seem to follow a road already worn into the ground.";
    const agency =
      state.values.Agency >= 30 || cues.agency
        ? "\n\nBut I did not live only for that wedding. I wrote poems, loved flowers, and suffered with a heart that was my own."
        : "\n\nI only want to know who I am, and why I must come to this end.";
    return { type: "daiyu_reply", text: `${opening}${awareness}${agency}` };
  }

  const opening =
    "（她从昏沉里醒来，目光先落在紫鹃身上，又越过众人，停在你所在之处。）\n\n你瞧，她们看不见你。";
  const awareness =
    state.values.Awareness >= 34 || cues.awareness
      ? "\n\n我说与不说，哭与不哭，这屋里屋外的人，竟仍照旧往前走。好像这世上的事，早有一只看不见的手，一件件替人安放好了。"
      : "\n\n这些日子，我总觉得旧事一层层压来，人心也像照着旧路走，竟没有一处肯为我停一停。";
  const agency =
    state.values.Agency >= 30 || cues.agency
      ? "\n\n可我不是只为那一场婚事活过。我也写过诗，也爱过花，也清清白白地疼过、恨过。"
      : "\n\n我只是想知道，我究竟是谁，又为何偏要走到这一步。";
  return {
    type: "daiyu_reply",
    text: sanitizeDaiyu(`${opening}${awareness}${agency}`)
  };
}

function stageThreeReply(input, cues) {
  if (language === "en") {
    const highTrust = state.values.Trust >= 48;
    const highAwareness = state.values.Awareness >= 52;
    const highAgency = state.values.Agency >= 40;
    let text =
      "(For one moment, Daiyu's eyes clear in the lamplight, as if she can see past this little sickroom to a very distant shore.)";

    text += highAwareness
      ? "\n\nSo these tears of mine did not fall only here. If someone later remembers, then I did not suffer unseen."
      : "\n\nMy life has been like walking through a dream. Whether I have awakened, I can hardly tell.";
    text += highAgency
      ? "\n\nLet them judge me as they like. I know only this: my heart was not a fault, and my innocence was not a joke."
      : "\n\nOnly these words are almost gone now, and few were ever willing to listen closely.";
    if (highTrust) text += "\n\n(Her lips move faintly.)\n\nYou came this far. I know.";
    return text;
  }

  const highTrust = state.values.Trust >= 48;
  const highAwareness = state.values.Awareness >= 52;
  const highAgency = state.values.Agency >= 40;
  let text = "（黛玉的目光在灯影里清了一瞬，像终于越过这间小小病房，看见一条极远的水路。）";

  if (highAwareness) {
    text += "\n\n原来我这一身泪，并非只落在这里。若真有后来的人记得，也不枉我曾这样明明白白地疼过。";
  } else {
    text += "\n\n我这一生，像梦里走了一遭，醒不醒的，倒也分不清了。";
  }

  if (highAgency) {
    text += "\n\n他们要怎样说我，由他们去。我只知道，我的心不是错处，我的清白也不是笑话。";
  } else {
    text += "\n\n只是可惜这些话，终究说不尽，也没人肯细听。";
  }

  if (highTrust) {
    text += "\n\n（她唇边微微动了动。）\n\n你来这一程，我知道。";
  }

  return sanitizeDaiyu(text);
}

function worldEventText() {
  return consumeWorldEvent();
}

function consumeWorldEvent() {
  const text = peekWorldEventText();
  const stage = currentStage();
  if (stage.events.length) state.eventIndex += 1;
  return text;
}

function peekWorldEventText() {
  const stage = currentStage();
  if (!stage.events.length) {
    return language === "en"
      ? "Outside Xiaoxiang Lodge, all is quiet, though distant footsteps still hurry for the Jia household's wedding."
      : "潇湘馆外静得很，远处却隐隐传来贾府为喜事奔走的脚步声。";
  }
  if (language === "en") {
    return stageEventEnglish(stage.id, Math.min(state.eventIndex, stage.events.length - 1));
  }
  return stage.events[Math.min(state.eventIndex, stage.events.length - 1)];
}

function stageEventEnglish(stageId, index) {
  const events = {
    1: [
      "After breathing unevenly for a long while, Daiyu tells Xueyan in a low voice, “Bring me my manuscripts.” A moment later she adds, “And the old handkerchief with writing on it too.”",
      "Daiyu first throws the old handkerchief into the fire. One corner curls inward, and the words blur almost at once.",
      "She holds the manuscripts against herself for a moment, then finally feeds them page by page into the flames. Zijuan wants to stop her, but she is holding Daiyu upright and cannot move in time.",
      "Xueyan rushes forward to save the manuscripts. Sparks scatter; only a few scraps remain. As the ash settles, Daiyu coughs violently, her illness deepening as if the fire has urged it on."
    ],
    2: [
      "Daylight grows pale. Daiyu lies faint on the bed, with only the thinnest breath still continuing.",
      "Zijuan checks her breathing and turns pale, then hurries to report to Grandmother Jia.",
      "Outside, everyone is busy with Baoyu's wedding. Xiaoxiang Lodge is left so cold and quiet it feels cut off from the house.",
      "Unable to move the household, Zijuan sends someone to ask Li Wan to come.",
      "Because the wedding scene is improper for her to attend, Li Wan finally arrives at Xiaoxiang Lodge and sits by the bed to watch over Daiyu.",
      "Xueyan is called away for wedding arrangements. She looks back at the figure on the bed, but is urged out all the same."
    ],
    3: [
      "In the evening, Daiyu suddenly catches a breath. A thread of clarity returns to her eyes. Xueyan is no longer in the room.",
      "Zijuan bends close and calls, “Miss, are you awake? How do you feel?” Daiyu parts her lips: “Zijuan, give me some water.” Zijuan quickly feeds her longan soup and pear juice.",
      "Li Wan sees the sudden brightness in Daiyu's expression and sinks inwardly, knowing it is likely the last flare of life. She steps out briefly to manage matters outside.",
      "Only Zijuan, the nurse, and a few little maids remain. Daiyu wakes and sees Zijuan, then reaches for her hand and says brokenly that she has no kin beside her.",
      "She asks, in a faint voice, that if she dies, her body be kept clean and sent home somehow. Weeping, Zijuan sends for Li Wan; footsteps stir beyond the curtain, and Tanchun arrives first.",
      "Li Wan follows soon after. Wedding music swells in the distance, while Xiaoxiang Lodge holds only muffled sobs. Daiyu's breath is almost gone; she still calls Baoyu's name again and again. At that very moment, Baochai enters the bridal chamber."
    ]
  };
  return events[stageId]?.[index] || "";
}

function generateTurn(input) {
  const stage = currentStage();
  const cues = analyzeInput(input);
  const deltas = {
    trust: cues.forceful ? -3 : cues.trust || cues.gentle ? 4 : 2,
    awareness: cues.awareness ? 5 : 1,
    agency: cues.agency ? 5 : cues.forceful ? -2 : 1,
    breath: stage.id === 3 ? -10 : stage.id === 2 ? -6 : -7
  };

  if (cues.forceful) {
    deltas.awareness = Math.max(0, deltas.awareness - 2);
  }

  applyDeltas(deltas);

  let responseType = "daiyu_reply";
  let daiyuText = "";
  if (stage.id === 1) daiyuText = stageOneReply(input, cues);
  if (stage.id === 2) {
    const generated = stageTwoReply(input, cues);
    responseType = generated.type;
    daiyuText = generated.text;
  }
  if (stage.id === 3) daiyuText = stageThreeReply(input, cues);

  if (state.values.Breath <= 20 && stage.id !== 3 && responseType === "daiyu_reply") {
    responseType = "silent_reaction";
    daiyuText =
      language === "en"
        ? "(Daiyu seems about to speak, but a sharp breath cuts her off. She looks at you with one clear instant in her eyes, then sinks back into exhaustion.)"
        : "（黛玉唇边似有话，却被一阵急促的喘息截住。她望着你，眼中有一瞬清明，很快又沉入昏倦。）";
  }

  const worldText = worldEventText();
  state.innerInsight = createInnerInsight(stage.id, cues);

  return {
    stage_id: stage.id,
    event_id: `stage_${stage.id}_turn_${String(state.turnsUsed).padStart(2, "0")}`,
    response_type: responseType,
    trust_delta: deltas.trust,
    awareness_delta: deltas.awareness,
    agency_delta: deltas.agency,
    breath_delta: deltas.breath,
    values: { ...state.values },
    daiyu_state_internal: internalState(),
    daiyu_text: daiyuText,
    world_text: worldText,
    system_notice: null,
    inner_insight: null,
    next_stage: shouldAdvanceStage(),
    rule_violations: []
  };
}

async function generateModelTurn(input) {
  if (window.location.protocol === "file:") {
    return { ok: false, fallback: true, error: uiText[language].modelFileProtocol };
  }

  const stage = currentStage();
  const response = await fetch("/api/daiyu/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input,
      stage: {
        id: stage.id,
        chapter: stage.chapter,
        title: stage.title,
        time_label: currentClock(),
        next_time_label: currentClock(1),
        task: stage.task,
        meta: stage.meta,
        max_turns: stage.maxTurns
      },
      values: { ...state.values },
      turns: {
        used: state.turnsUsed,
        max: stage.maxTurns,
        remaining: Math.max(0, stage.maxTurns - state.turnsUsed)
      },
      npc_present: stage.npcPresent,
      event_index: state.eventIndex,
      next_world_event: peekWorldEventText(),
      language,
      model_config: getModelConfig()
    })
  });
  return response.json();
}

function getModelConfig() {
  // Player-facing builds do not send API keys from the browser.
  // The server reads DEEPSEEK_API_KEY / DEEPSEEK_BASE_URL / DEEPSEEK_MODEL.
  return {
    baseUrl: "",
    apiKey: "",
    model: ""
  };
}

function applyModelTurn(result) {
  applyDeltas({
    trust: result.trust_delta,
    awareness: result.awareness_delta,
    agency: result.agency_delta,
    breath: result.breath_delta
  });

  state.innerInsight = result.inner_insight
    ? result.inner_insight.startsWith("【内心洞察】")
      ? result.inner_insight
      : `【内心洞察】${result.inner_insight}`
    : createInnerInsight(currentStage().id, {});

  const resolved = resolveDaiyuFeedback(result.response_type, result.daiyu_text || "");
  const worldText = result.world_text?.trim() || consumeWorldEvent();
  if (result.world_text?.trim() && currentStage().events.length) state.eventIndex += 1;

  return {
    stage_id: currentStage().id,
    event_id: `stage_${currentStage().id}_turn_${String(state.turnsUsed).padStart(2, "0")}`,
    response_type: resolved.responseType,
    values: { ...state.values },
    daiyu_state_internal: internalState(),
    daiyu_text: sanitizeDaiyu(resolved.daiyuText),
    world_text: worldText,
    system_notice: null,
    inner_insight: null,
    next_stage: shouldAdvanceStage(),
    rule_violations: result.rule_violations || []
  };
}

function resolveDaiyuFeedback(responseType, daiyuText) {
  const text = String(daiyuText || "").trim();
  if (text) return { responseType, daiyuText: text };

  if (state.values.Breath <= 30) {
    return {
      responseType: "silent_reaction",
      daiyuText:
        language === "en"
          ? "(Daiyu's lashes tremble as if she has heard you, but she can no longer hold the breath to answer. Her hand slips from the edge of the manuscripts; she turns her head away in a faint, wordless daze.)"
          : "（黛玉眼睫颤了颤，像是听见了，却再撑不住这口气。她的手从诗稿边滑落，昏沉地偏过头去，没有说话。）"
    };
  }

  return {
    responseType: "silent_reaction",
    daiyuText:
      language === "en"
        ? "(Daiyu looks at you as if words are near her lips, but a cough presses them down. She only shakes her head faintly.)"
        : "（黛玉望着你，唇边似有话，却被一阵咳意压住，只轻轻摇了摇头。）"
  };
}

function createInnerInsight(stageId, cues) {
  if (language === "en") {
    if (stageId === 1) {
      return cues.gentle
        ? "[Inner Signal] She still does not fully trust you, but your restraint has softened her guard. She fears pity almost as much as being unheard."
        : "[Inner Signal] She is trying to decide whether you are an apparition, an omen, or the answer her call truly reached.";
    }
    if (stageId === 2) {
      return state.values.Agency >= 28
        ? "[Inner Signal] She does not only want to destroy old things; she wants to reclaim her poetry from other people's misreadings."
        : "[Inner Signal] The closer the flame comes, the more she feels her life has nowhere to be entrusted.";
    }
    if (stageId === 3) {
      return state.values.Awareness >= 45
        ? "[Inner Signal] She dimly understands that her tragedy is not only temperament or illness, but something heavier."
        : "[Inner Signal] She senses everyone moving as before, like a current beneath the surface, but cannot yet name it.";
    }
    return state.values.Trust >= 48
      ? "[Inner Signal] She has no strength left to live, but still remembers that you are here."
      : "[Inner Signal] Many words remain hidden in her breath. More than being saved, she wants to know she did not exist for nothing.";
  }
  if (stageId === 1) {
    return cues.gentle
      ? "【内心洞察】她仍不肯轻信，却因你的克制少了几分防备。她最怕被怜悯，也最怕无人肯听。"
      : "【内心洞察】她在分辨你究竟是幻影、梦兆，还是那声呼唤真正等来的回答。";
  }
  if (stageId === 2) {
    return state.values.Agency >= 28
      ? "【内心洞察】她不是单要毁去旧物，而是要把自己的诗心从旁人的误读里收回来。"
      : "【内心洞察】火光越近，她越觉得一生心事无人可托，只剩绝望与不舍交缠。";
  }
  if (stageId === 3) {
    return state.values.Awareness >= 45
      ? "【内心洞察】她已隐约明白，自己的悲剧不只是性情与病弱，也有一重更沉的命数。"
      : "【内心洞察】她困惑于众人的照旧前行，像看见水面下有暗流，却还说不出那暗流是什么。";
  }
  return state.values.Trust >= 48
    ? "【内心洞察】她已无力求生，却仍记得你在。那一点被懂得的心安，成了她最后的灯。"
    : "【内心洞察】她把许多话藏在气息里。此刻比起被救，她更想知道自己没有白白来过。";
}

function internalState() {
  if (language === "en") {
    if (currentStage().id === 3) return "last light";
    if (state.values.Breath >= 61) return "lucid";
    if (state.values.Breath >= 31) return "dazed";
    return "unconscious";
  }
  if (currentStage().id === 3) return "回光返照";
  if (state.values.Breath >= 61) return "清醒";
  if (state.values.Breath >= 31) return "恍惚";
  return "昏睡";
}

function shouldAdvanceStage() {
  const stage = currentStage();
  if (stage.id === 1) {
    return state.turnsUsed >= stage.maxTurns || state.eventIndex >= stage.events.length;
  }
  if (stage.id === 2) {
    return (
      state.turnsUsed >= stage.maxTurns ||
      state.values.Awareness >= stage.threshold.awareness ||
      state.consecutiveSleep >= 2
    );
  }
  if (stage.id === 3) {
    return state.turnsUsed >= stage.maxTurns || state.values.Breath <= 0 || state.eventIndex >= stage.events.length;
  }
  return false;
}

function maybeAdvanceStage() {
  if (!shouldAdvanceStage()) return;
  if (currentStage().id === 3) {
    finishGame();
    return;
  }

  const next = stages[state.stageIndex + 1];
  addMessage("world", "世界", transitionText(next.id));
  state.stageIndex += 1;
  state.eventIndex = 0;
  state.turnsUsed = 0;
  state.values.Breath = next.initialBreath;
  state.unread += 1;
  showChapterCard(next);
  renderStatus();
}

function transitionText(nextId) {
  if (language === "en") {
    if (nextId === 2) return "The ashes in the brazier cool. Dawn slowly arrives, and Daiyu's illness sinks deeper, as if she may never wake from the long dream.";
    return "Wedding music drifts in from afar. The lamp in Xiaoxiang Lodge has not yet gone out. At dusk, she suddenly catches one last breath.";
  }
  if (nextId === 2) return "火盆里的纸灰渐冷。天色一点点发白，黛玉的病势却沉下去，像再难从长梦里醒来。";
  return "喜乐从远处一层层漫来，潇湘馆残灯未灭。黄昏已至，她忽然缓过一口气。";
}

function showChapterCard(stage) {
  const display = displayStage(stage);
  el.chapterNumber.textContent = display.chapter;
  el.chapterTitle.textContent = display.title;
  el.chapterMeta.textContent = display.meta;
  el.modal.classList.add("open");
  el.modal.setAttribute("aria-hidden", "false");
}

function closeChapterModal() {
  el.modal.classList.remove("open");
  el.modal.setAttribute("aria-hidden", "true");
  if (!state.finished) {
    el.input.disabled = false;
    el.send.disabled = false;
    window.setTimeout(() => el.input.focus(), 0);
  }
  renderStatus();
}

async function finishGame() {
  if (state.finished) return;
  state.finished = true;
  el.input.disabled = true;
  el.send.disabled = true;

  addMessage(
    "world",
    "世界",
    language === "en"
      ? "Faint music drifts from afar. No one in Xiaoxiang Lodge can carry the news to the bridal chamber. Daiyu's last breath fades beneath the dying lamp; bamboo shadows remain at the window."
      : "远处音乐隐隐传来，潇湘馆内无人能把消息传到新房。黛玉最后一缕气息散在残灯下，竹影仍在窗前。"
  );
  const ending = await resolveEnding();
  addMessage("world", "系统", `【${ending.title}】\n\n${ending.endingText}\n\n${ending.systemText}\n\n${uiText[language].gameOver}`);
  state.unread += 1;
  renderStatus();
}

async function resolveEnding() {
  const endingType = chooseEndingType();
  const fallback = localEnding(endingType);
  if (window.location.protocol === "file:" || !modelState.configured) return fallback;

  try {
    const response = await fetch("/api/daiyu/ending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ending_type: endingType,
        values: { ...state.values },
        status: statusLine(),
        guidance: endingGuidance(endingType),
        language,
        model_config: getModelConfig()
      })
    });
    const result = await response.json();
    if (!result.ok) return fallback;
    return {
      title: result.title || fallback.title,
      endingText: result.ending_text || fallback.endingText,
      systemText: result.system_text || fallback.systemText
    };
  } catch {
    return fallback;
  }
}

function chooseEndingType() {
  const { Trust, Awareness, Agency } = state.values;
  if (Awareness < 35) return "回环未醒";
  if (Awareness >= 70 && Agency < 35) return "真相破散";
  if (Awareness >= 70 && Agency >= 70 && Trust >= 55) return "携手入梦";
  if (Awareness >= 80 && Agency >= 55) return "书页之外";
  if (Awareness >= 55 && Agency >= 45) return "知梦而别";
  return "半醒残灯";
}

function endingGuidance(type) {
  if (language === "en") {
    const map = {
      回环未醒: "Daiyu does not truly understand the loop; after death she returns to the old life and lives it again.",
      半醒残灯: "Daiyu senses the anomaly but cannot bear the whole truth; a half-awake pain remains.",
      知梦而别: "Daiyu knows she is a person in a book; she accepts this death but is no longer fully defined by the narrative.",
      真相破散: "Daiyu sees that she was written as a tragic character, but awareness overwhelms her before agency can hold.",
      携手入梦: "With high trust and agency, Daiyu is connected to the system after death and becomes a fellow traveler.",
      书页之外: "Daiyu understands her fictional identity and the loop, and steps beyond repeated death by her own will."
    };
    return map[type] || map.半醒残灯;
  }
  const map = {
    回环未醒: "黛玉没有真正认清循环，死亡后仍会回到旧人生重新经历。",
    半醒残灯: "黛玉察觉异常但未能承受全部真相，留下半醒半梦的余痛。",
    知梦而别: "黛玉知道自己是书中人，接受本轮死亡，但不再完全被叙事定义。",
    真相破散: "黛玉看见自己被写成悲剧角色，觉察过强但自主不足，精神在真相中破散。",
    携手入梦: "黛玉与玩家建立足够信任和自主，死亡后被系统接入，成为新的穿越者。",
    书页之外: "黛玉认清虚构身份和循环机制，以自己的意志从重复死亡中超脱。"
  };
  return map[type] || map.半醒残灯;
}

function localEnding(type) {
  if (language === "en") {
    const base = "Lin Daiyu still dies at the moment of Jia Baoyu's wedding. This run of the Red Chamber is not rewritten, and the lamp in Xiaoxiang Lodge finally goes out.";
    const variants = {
      回环未醒: ["Ending · Unawakened Return", `${base}\n\nBut the call never reaches the deepest part of her heart. When the book is closed and opened again, the old dream begins once more.`, "[System Verdict] Awareness insufficient. Loop continues."],
      半醒残灯: ["Ending · Half-Awake Lamp", `${base}\n\nShe seems to understand something, but not enough to hold it. In the next cycle, that pain remains beneath the dream.`, "[System Verdict] Loop loosened, not broken."],
      知梦而别: ["Ending · Knowing the Dream", `${base}\n\nThis time, she knows she cannot be reduced to the words 'ill-fated.' She takes her name back from the judgment written for her.`, "[System Verdict] Partial awakening achieved."],
      真相破散: ["Ending · Shattered by Truth", `${base}\n\nThe truth arrives too quickly: her joys and griefs were arranged by ink. She sees the cage, but has no strength left to step out.`, "[System Verdict] Awareness overload. Agency insufficient."],
      携手入梦: ["Ending · Into the System", `${base}\n\nAt the instant the book closes, she does not return to the beginning. The system catches her final choice: she wakes as a fellow traveler.`, "[System Verdict] Special connection successful. Lin Daiyu has entered the observer sequence."],
      书页之外: ["Ending · Beyond the Page", `${base}\n\nBut she has seen the hand that wrote her fate. Death remains, yet it can no longer send her back unchanged. On the blank page, a new line appears in her own hand.`, "[System Verdict] Loop broken. Target transcended."]
    };
    const [title, endingText, systemText] = variants[type] || variants.半醒残灯;
    return { title, endingText, systemText };
  }
  const base = "林黛玉最终仍死在宝玉成亲之时。本轮红楼没有改写，潇湘馆的灯也终于灭了。";
  const variants = {
    回环未醒: ["结局 · 回环未醒", `${base}\n\n可那一声呼唤尚未抵达她心底最深处。合卷之后，旧梦重开，她仍会从花影、诗稿、病榻之间再走一遍。`, "【系统判定】觉察不足。循环继续。"],
    半醒残灯: ["结局 · 半醒残灯", `${base}\n\n她似乎明白了什么，又像来不及明白。下一轮开始时，那点疼痛会留在梦底，成为她再度抬眼的理由。`, "【系统判定】循环松动，但未断裂。"],
    知梦而别: ["结局 · 知梦而别", `${base}\n\n这一次，她知道自己不是薄命二字可以写尽的人。她向书页深处轻轻一笑，像终于把自己的名字从旁人的判词里收回。`, "【系统判定】目标完成局部觉醒。"],
    真相破散: ["结局 · 真相破散", `${base}\n\n真相来得太急：原来一生悲欢竟被笔墨安排。她看见了笼子，却没有力气走出，意识如焚稿后的纸灰四散。`, "【系统判定】觉察过载，自主不足。"],
    携手入梦: ["结局 · 携手入梦", `${base}\n\n合卷的一瞬，她没有回到旧梦开头。系统捕捉到她最后的选择：她回望你，像第一次不是作为书中人，而是作为同行者醒来。`, "【系统判定】特殊接入成功。林黛玉已转入观测者序列。"],
    书页之外: ["结局 · 书页之外", `${base}\n\n但她已看清那只写下她命运的手。死亡没有消失，却不再能把她送回原处。书页翻过，空白处多了一行属于她自己的新墨。`, "【系统判定】循环断裂。目标完成超脱。"]
  };
  const [title, endingText, systemText] = variants[type] || variants.半醒残灯;
  return { title, endingText, systemText };
}

async function handlePlayerInput() {
  const text = el.input.value.trim();
  if (!text || !state.introReady || state.finished || el.modal.classList.contains("open")) return;
  el.input.value = "";

  addMessage("player", language === "en" ? "You" : "你", text);
  state.turnsUsed += 1;

  el.send.disabled = true;
  let result;
  try {
    const modelResult = await generateModelTurn(text);
    if (modelResult.ok) {
      modelState.provider = modelResult.provider || "openai-compatible";
      modelState.baseUrl = modelResult.base_url || getModelConfig().baseUrl || modelState.baseUrl;
      modelState.model = modelResult.model || "deepseek-chat";
      modelState.configured = true;
      modelState.lastError = "";
      result = applyModelTurn(modelResult);
    } else {
      modelState.lastError = modelResult.error || uiText[language].modelUnavailable;
      addMessage("world", "系统", `${uiText[language].modelFallbackPrefix}${modelState.lastError}`);
      result = generateTurn(text);
    }
  } catch (error) {
    modelState.lastError = error instanceof Error ? error.message : uiText[language].modelRequestFailed;
    addMessage("world", "系统", `${uiText[language].modelFallbackPrefix}${modelState.lastError}`);
    result = generateTurn(text);
  } finally {
    el.send.disabled = state.finished;
  }

  if (result.world_text) addMessage("world", "世界", result.world_text);
  if (result.response_type === "daiyu_reply") addMessage("daiyu", "林黛玉", result.daiyu_text);
  if (result.response_type === "silent_reaction") addMessage("daiyu", "林黛玉", result.daiyu_text);

  renderStatus();
  maybeAdvanceStage();
}

function openPanel() {
  state.unread = 0;
  el.panel.classList.add("open");
  el.panel.setAttribute("aria-hidden", "false");
  renderStatus();
}

function closePanel() {
  el.panel.classList.remove("open");
  el.panel.setAttribute("aria-hidden", "true");
  if (!state.introDialogueShown) {
    showOpeningScene();
  }
}

function showOpeningScene() {
  state.introDialogueShown = true;
  state.introReady = true;
  addMessage(
    "world",
    "世界",
    worldOpeningText()
  );
  addMessage("daiyu", "林黛玉", daiyuOpeningText());
  el.input.disabled = false;
  el.send.disabled = false;
  el.input.focus();
}

function openSettingsPanel() {
  el.settingsPanel.classList.add("open");
  el.settingsPanel.setAttribute("aria-hidden", "false");
  renderStatus();
}

function closeSettingsPanel() {
  el.settingsPanel.classList.remove("open");
  el.settingsPanel.setAttribute("aria-hidden", "true");
}

function dismissIntro() {
  el.panel.classList.remove("intro-active");
  el.introCard.classList.add("hidden");
}

async function askSystem() {
  const question = el.systemQuestionInput.value.trim();
  if (!question) return;
  el.systemQuestionInput.value = "";
  appendSystemChat("user", question);
  appendSystemChat("system", uiText[language].systemThinking);
  try {
    const result = await askSystemWithModel(question);
    replaceLastSystemChat(result.ok ? result.text : createSystemReply(question));
  } catch {
    replaceLastSystemChat(createSystemReply(question));
  }
}

function appendSystemChat(role, content) {
  systemHistory.push({ role: role === "user" ? "user" : "assistant", content });
  const row = document.createElement("div");
  row.className = `system-chat-row ${role === "user" ? "user" : "system"}`;
  const label = document.createElement("span");
  label.textContent = role === "user" ? (language === "en" ? "Host" : "宿主") : language === "en" ? "System" : "系统";
  const text = document.createElement("p");
  text.textContent = content;
  row.append(label, text);
  el.systemLog.append(row);
  el.systemLog.scrollTop = el.systemLog.scrollHeight;
}

function replaceLastSystemChat(content) {
  const last = [...el.systemLog.querySelectorAll(".system-chat-row.system")].at(-1);
  if (last) last.querySelector("p").textContent = content;
  const lastHistory = systemHistory.at(-1);
  if (lastHistory?.role === "assistant") lastHistory.content = content;
}

async function askSystemWithModel(question) {
  if (window.location.protocol === "file:" || !modelState.configured) {
    return { ok: false };
  }

  const response = await fetch("/api/system/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      stage: {
        id: currentStage().id,
        title: currentStage().title,
        time: currentClock()
      },
      values: { ...state.values },
      value_meanings: {
        Trust: "黛玉有多相信玩家/宿主",
        Awareness: "黛玉有多认清自己是小说人物、循环为何发生",
        Agency: "黛玉有多想面对并打破这一切"
      },
      status: statusLine(),
      inner_insight: state.innerInsight,
      system_history: systemHistory.slice(-8),
      language,
      model_config: getModelConfig()
    })
  });
  return response.json();
}

function createSystemReply(question) {
  const stage = currentStage();
  const breath = state.values.Breath;
  if (language === "en") {
    if (/why|what|task|meaning|do/i.test(question)) {
      return `Host, you are here because Daiyu is the one waking inside the loop, and you are the first outsider she can see. If you quit, I can drop the binding, but your real-world body is not exactly in great shape.`;
    }
    if (/save|escape|revive|change|wedding/i.test(question)) {
      return "No, you cannot brute-force the wedding or drag her out. This run still ends in death; what you can change is whether she understands the loop and what happens after.";
    }
    return "Short version: you are new to the book, Daiyu is waking up inside it, and everyone else is still following the old plot. Keep up, Host.";
  }
  if (/干什么|做什么|目标|任务|意义/.test(question)) {
    return `问得好，宿主。你要是不干也行，我现在就把你踢出绑定流程，顺便提醒一下：你现实里的真身状态非常不乐观。当前 ${stage.title}，你存在的意义就是把她从“我是不是疯了”的孤立里拉出来。`;
  }
  if (/救|改命|带走|逃|复活/.test(question)) {
    return "想直接救走？宿主，你可真会挑最容易炸系统的按钮按。本轮死亡节点锁死，强拆婚礼因果我会先装死，然后你也大概率一起完蛋。";
  }
  if (/内心|想什么|黛玉|她/.test(question)) {
    return `她现在气息 ${breath}/100，不是很适合听你长篇大论，宿主。她已经察觉“这一切不对”，但还没敢承认自己可能是书中人。`;
  }
  if (/时间|多久|剩余/.test(question)) {
    return `当前 ${statusLine()}。时间在走，气息在掉，我也不是很想加班，所以宿主你最好别把每一轮都拿来问废话。`;
  }
  return "宿主，你的问题我听见了，但我选择先不完全回答。简单说：你第一次进书，她第一次快醒，其他人还在照剧情转，懂了就继续干活。";
}

function init() {
  applyLanguage();
  el.input.disabled = true;
  el.send.disabled = true;
  addMessage(
    "world",
    "玩家信息",
    playerOpeningText()
  );
  renderStatus();
  loadSavedModelSettings();
  loadModelInfo();
  window.setTimeout(playBootSequence, 4200);

  el.send.addEventListener("click", handlePlayerInput);
  el.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handlePlayerInput();
    }
  });
  el.systemButton.addEventListener("click", openPanel);
  el.settingsButton?.addEventListener("click", openSettingsPanel);
  el.languageButton.addEventListener("click", toggleLanguage);
  el.closePanel.addEventListener("click", closePanel);
  el.closeSettingsPanel.addEventListener("click", closeSettingsPanel);
  el.dismissIntro.addEventListener("click", dismissIntro);
  el.askSystemButton.addEventListener("click", askSystem);
  el.systemQuestionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      askSystem();
    }
  });
  el.continueChapter.addEventListener("click", closeChapterModal);
  el.modal.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeChapterModal();
    }
  });
  el.modelForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveModelSettings();
  });
  el.clearModelSettings.addEventListener("click", clearModelSettings);
  el.testModelSettings.addEventListener("click", testModelSettings);
}

async function loadModelInfo() {
  if (window.location.protocol === "file:") {
    modelState.provider = "openai-compatible";
    modelState.configured = Boolean(el.apiKeyInput.value.trim());
    renderStatus();
    return;
  }

  try {
    const response = await fetch("/api/daiyu/model");
    const data = await response.json();
    modelState.provider = data.provider || "openai-compatible";
    modelState.baseUrl = el.baseUrlInput.value.trim() || data.baseUrl || "https://api.deepseek.com";
    modelState.model = el.modelInput.value.trim() || data.model || "deepseek-chat";
    modelState.configured = Boolean(el.apiKeyInput.value.trim() || data.configured);
    if (!el.baseUrlInput.value.trim()) el.baseUrlInput.value = modelState.baseUrl;
    if (!el.modelInput.value.trim()) el.modelInput.value = modelState.model;
    renderStatus();
  } catch {
    modelState.provider = "openai-compatible";
    modelState.configured = false;
    renderStatus();
  }
}

function loadSavedModelSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(modelSettingsKey) || "{}");
    el.baseUrlInput.value = saved.baseUrl || "https://api.deepseek.com";
    el.modelInput.value = saved.model || "deepseek-chat";
    el.apiKeyInput.value = saved.apiKey || "";
    modelState.baseUrl = el.baseUrlInput.value.trim() || modelState.baseUrl;
    modelState.model = el.modelInput.value.trim() || modelState.model;
    modelState.configured = Boolean(el.apiKeyInput.value.trim());
  } catch {
    el.baseUrlInput.value = "https://api.deepseek.com";
    el.modelInput.value = "deepseek-chat";
  }
}

function saveModelSettings() {
  const config = getModelConfig();
  localStorage.setItem(modelSettingsKey, JSON.stringify(config));
  modelState.provider = "openai-compatible";
  modelState.baseUrl = config.baseUrl || "https://api.deepseek.com";
  modelState.model = config.model || "deepseek-chat";
  modelState.configured = Boolean(config.apiKey);
  modelState.lastError = modelState.configured ? "" : uiText[language].modelMissingKey;
  modelState.testMessage = "";
  renderStatus();
}

function clearModelSettings() {
  localStorage.removeItem(modelSettingsKey);
  el.baseUrlInput.value = "https://api.deepseek.com";
  el.modelInput.value = "deepseek-chat";
  el.apiKeyInput.value = "";
  modelState.baseUrl = el.baseUrlInput.value;
  modelState.model = el.modelInput.value;
  modelState.configured = false;
  modelState.lastError = "";
  modelState.testMessage = "";
  renderStatus();
}

async function testModelSettings() {
  saveModelSettings();
  if (window.location.protocol === "file:") {
    modelState.lastError = uiText[language].modelFileProtocol;
    modelState.testMessage = modelState.lastError;
    renderStatus();
    return;
  }

  el.testModelSettings.disabled = true;
  try {
    const response = await fetch("/api/daiyu/test-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, model_config: getModelConfig() })
    });
    const data = await response.json();
    if (data.ok) {
      modelState.configured = true;
      modelState.lastError = "";
      modelState.testMessage = `${uiText[language].modelTestSuccess}: ${data.model}`;
    } else {
      modelState.configured = false;
      modelState.lastError = `${uiText[language].modelTestError} ${data.status || ""}`.trim();
      modelState.testMessage = `${uiText[language].modelTestFailed}: ${data.status || uiText[language].modelTestNotSent} | ${data.error}`;
    }
  } catch (error) {
    modelState.configured = false;
    modelState.lastError = error instanceof Error ? error.message : uiText[language].modelRequestFailed;
    modelState.testMessage = `${uiText[language].modelTestRequestFailed}: ${modelState.lastError}`;
  } finally {
    el.testModelSettings.disabled = false;
    renderStatus();
  }
}

init();
