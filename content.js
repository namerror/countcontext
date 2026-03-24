(() => {
  const DEFAULT_SETTINGS = {
    modelOverride: "gpt-5.3-instant",
    planTier: "Plus",
    customContextSize: 8000,
    modelContextOverrides: {},
    perAttachmentTokens: 200,
    overheadTokens: 500,
    virtualizationStrategy: "USER_GUIDED"
  };

  const PLAN_OPTIONS = [
    { id: "Free", label: "Free" },
    { id: "Go", label: "Go" },
    { id: "Plus", label: "Plus" },
    { id: "Pro", label: "Pro" },
    { id: "Business", label: "Business" },
    { id: "Enterprise", label: "Enterprise" }
  ];

  const MODEL_DEFS = [
    {
      id: "gpt-5.3-instant",
      label: "GPT-5.3 Instant",
      caps: {
        Free: 16000,
        Go: 32000,
        Plus: 32000,
        Pro: 128000,
        Business: 32000,
        Enterprise: 128000
      }
    },
    {
      id: "gpt-5.4-thinking",
      label: "GPT-5.4 Thinking",
      caps: {
        Plus: 196000,
        Pro: 196000,
        Business: 196000,
        Enterprise: 196000
      }
    },
    {
      id: "gpt-5.4-pro",
      label: "GPT-5.4 Pro",
      caps: {
        Plus: 196000,
        Pro: 196000,
        Business: 196000,
        Enterprise: 196000
      }
    },
    {
      id: "gpt-5.2-instant",
      label: "GPT-5.2 Instant (Legacy)",
      contextWindow: 400000
    },
    {
      id: "gpt-5.2-thinking",
      label: "GPT-5.2 Thinking (Legacy)",
      contextWindow: 400000
    },
    {
      id: "gpt-5-mini",
      label: "GPT-5 mini",
      contextWindow: 400000
    },
    {
      id: "o3",
      label: "o3",
      contextWindow: 200000
    }
  ];

  const LEGACY_MODEL_IDS = new Set(["gpt-5.2-instant", "gpt-5.2-thinking"]);

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    ui: {},
    modelLabel: "",
    modelId: "",
    contextSize: DEFAULT_SETTINGS.customContextSize,
    estimate: {
      chatTokens: 0,
      attachmentTokens: 0,
      overheadTokens: DEFAULT_SETTINGS.overheadTokens,
      totalTokens: 0
    },
    isIncomplete: false
  };

  const STORAGE_KEY = "ccx_settings";
  const DEBOUNCE_MS = 500;
  let recalcTimer = null;

  function safeStorageGet() {
    return new Promise((resolve) => {
      if (!chrome?.storage?.local) {
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve({ ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY] || {}) });
      });
    });
  }

  function safeStorageSet(next) {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.set({ [STORAGE_KEY]: next });
  }

  function detectModelLabel() {
    const candidates = [];
    const buttons = Array.from(document.querySelectorAll("button, [data-testid], [aria-label]"));
    for (const el of buttons) {
      const text = (el.textContent || "").trim();
      const aria = (el.getAttribute("aria-label") || "").trim();
      const combined = `${text} ${aria}`.trim();
      if (!combined) continue;
      if (/gpt|o\d|model/i.test(combined)) {
        candidates.push(combined);
      }
    }

    const match = candidates.find((value) => /gpt|o\d/i.test(value));
    if (!match) return "";
    return match.split("\n")[0].trim();
  }

  function normalizeModelId(label) {
    const l = label.toLowerCase();
    if (/\bo3\b/.test(l)) return "o3";
    if (l.includes("gpt-5 mini") || l.includes("gpt-5-mini") || l.includes("5 mini")) return "gpt-5-mini";
    if (l.includes("5.4") && l.includes("pro")) return "gpt-5.4-pro";
    if (l.includes("5.4")) return "gpt-5.4-thinking";
    if (l.includes("5.3") || (l.includes("instant") && l.includes("5"))) return "gpt-5.3-instant";
    if (l.includes("5.2") && l.includes("instant")) return "gpt-5.2-instant";
    if (l.includes("5.2") && (l.includes("thinking") || l.includes("pro"))) return "gpt-5.2-thinking";
    if (l.includes("4o")) return "gpt-4o";
    if (l.includes("4.1 mini") || l.includes("4.1-mini")) return "gpt-4.1-mini";
    if (l.includes("4.1")) return "gpt-4.1";
    if (l.includes("4o mini") || l.includes("4o-mini")) return "gpt-4o-mini";
    if (l.includes("4 32") || l.includes("4-32")) return "gpt-4-32k";
    if (l.includes("gpt-4") || l.includes("4")) return "gpt-4";
    if (l.includes("3.5") || l.includes("gpt-3")) return "gpt-3.5";
    return "unknown";
  }

  function getModelDef(modelId) {
    return MODEL_DEFS.find((model) => model.id === modelId) || null;
  }

  function getPlanCap(modelId, planTier) {
    const model = getModelDef(modelId);
    if (!model) return null;
    if (model.caps && model.caps[planTier]) return model.caps[planTier];
    if (model.contextWindow) return model.contextWindow;
    return null;
  }

  function getOverrideTargetId() {
    if (state.settings.modelOverride === "custom") return "custom";
    if (state.settings.modelOverride === "auto") {
      return state.modelId && state.modelId !== "unknown" ? state.modelId : null;
    }
    return state.settings.modelOverride;
  }

  function getContextSize(modelId) {
    if (modelId === "custom") return state.settings.customContextSize || DEFAULT_SETTINGS.customContextSize;
    const overrides = state.settings.modelContextOverrides || {};
    const override = overrides[modelId];
    if (Number.isFinite(override) && override > 0) return override;
    const planCap = getPlanCap(modelId, state.settings.planTier);
    if (Number.isFinite(planCap) && planCap > 0) return planCap;
    return state.settings.customContextSize || DEFAULT_SETTINGS.customContextSize;
  }

  function estimateTokensHeuristic(text, modelId) {
    const chars = text.length;
    let charsPerToken = 4;
    if (modelId.startsWith("gpt-4")) charsPerToken = 3.8;
    if (modelId.startsWith("gpt-3")) charsPerToken = 4;
    const tokens = Math.ceil(chars / charsPerToken);
    return Math.max(tokens, 0);
  }

  function estimateTokensPrecise(text) {
    const tokenizer = window.__ccxTokenizer;
    if (!tokenizer || typeof tokenizer.encode !== "function") return null;
    try {
      return tokenizer.encode(text).length;
    } catch {
      return null;
    }
  }

  function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function findMessageNodes() {
    const nodes = Array.from(document.querySelectorAll("[data-message-author-role]"));
    if (nodes.length) return nodes;
    return Array.from(document.querySelectorAll("[data-testid='conversation-turn']"));
  }

  function countAttachmentsInNode(node) {
    const attachmentSelectors = [
      "[data-testid*='attachment']",
      "[data-testid*='file']",
      "[aria-label*='attachment']",
      "[aria-label*='file']",
      "a[href*='file']",
      "img[alt*='attachment']"
    ];
    let count = 0;
    for (const selector of attachmentSelectors) {
      count += node.querySelectorAll(selector).length;
    }
    return count;
  }

  function parseConversation() {
    const messageNodes = findMessageNodes();
    const messages = [];
    let attachmentCount = 0;

    for (const node of messageNodes) {
      const role = node.getAttribute("data-message-author-role") || "unknown";
      const text = normalizeText(node.innerText || "");
      if (!text) continue;
      messages.push({ role, text });
      attachmentCount += countAttachmentsInNode(node);
    }

    return { messages, attachmentCount };
  }

  function findScrollContainer() {
    const main = document.querySelector("main");
    if (!main) return null;
    const candidates = Array.from(main.querySelectorAll("div"));
    let best = null;
    for (const el of candidates) {
      if (el.scrollHeight > el.clientHeight + 200) {
        best = el;
        break;
      }
    }
    return best;
  }

  function detectIncompleteHistory() {
    const container = findScrollContainer();
    if (container && container.scrollTop > 50) return true;

    const loadButtons = Array.from(document.querySelectorAll("button, a"));
    const hasLoadMore = loadButtons.some((el) => /load more|show more|scroll/i.test((el.textContent || "").toLowerCase()));
    if (hasLoadMore) return true;

    return false;
  }

  function calculateEstimate() {
    const { messages, attachmentCount } = parseConversation();
    const chatText = messages.map((m) => m.text).join("\n\n");

    const detectedLabel = detectModelLabel();
    state.modelLabel = detectedLabel;

    const detectedId = detectedLabel ? normalizeModelId(detectedLabel) : "unknown";
    const override = state.settings.modelOverride;
    state.modelId = override === "auto" ? detectedId : override;

    state.contextSize = getContextSize(state.modelId);

    let chatTokens = estimateTokensHeuristic(chatText, state.modelId);
    const precise = estimateTokensPrecise(chatText);
    if (typeof precise === "number") chatTokens = precise;

    const attachmentTokens = attachmentCount * state.settings.perAttachmentTokens;
    const overheadTokens = state.settings.overheadTokens;
    const totalTokens = chatTokens + attachmentTokens + overheadTokens;

    state.estimate = {
      chatTokens,
      attachmentTokens,
      overheadTokens,
      totalTokens
    };

    state.isIncomplete = detectIncompleteHistory();
  }

  function formatNumber(value) {
    return new Intl.NumberFormat().format(value);
  }

  function percentUsed() {
    if (!state.contextSize) return 0;
    return Math.min(100, Math.round((state.estimate.totalTokens / state.contextSize) * 100));
  }

  function updateUI() {
    if (!state.ui.root) return;

    const percent = percentUsed();
    state.ui.percent.textContent = `${percent}% used`;
    state.ui.barFill.style.width = `${percent}%`;

    state.ui.totalTokens.textContent = formatNumber(state.estimate.totalTokens);
    state.ui.chatTokens.textContent = formatNumber(state.estimate.chatTokens);
    state.ui.attachmentTokens.textContent = formatNumber(state.estimate.attachmentTokens);
    state.ui.overheadTokens.textContent = formatNumber(state.estimate.overheadTokens);
    state.ui.modelLabel.textContent = state.modelLabel || "Unknown";
    state.ui.contextSize.textContent = formatNumber(state.contextSize);

    state.ui.warning.style.display = state.isIncomplete ? "block" : "none";

    updateModelSelect();
  }

  function updateModelSelect() {
    const select = state.ui.modelSelect;
    if (!select) return;
    if (!PLAN_OPTIONS.some((opt) => opt.id === state.settings.planTier)) {
      state.settings.planTier = DEFAULT_SETTINGS.planTier;
      safeStorageSet(state.settings);
    }
    if (state.ui.planSelect) state.ui.planSelect.value = state.settings.planTier;
    const nextOptions = buildModelOptions(state.settings.planTier);
    select.innerHTML = nextOptions.map((opt) => `<option value="${opt.id}">${opt.label}</option>`).join("");
    if (!nextOptions.some((opt) => opt.id === state.settings.modelOverride)) {
      state.settings.modelOverride = DEFAULT_SETTINGS.modelOverride;
      safeStorageSet(state.settings);
    }
    select.value = state.settings.modelOverride;

    state.ui.customContextRow.style.display = "flex";
    const targetId = getOverrideTargetId();
    if (!targetId) {
      state.ui.customContextInput.value = "";
      state.ui.customContextInput.placeholder = "";
      state.ui.customContextInput.disabled = true;
      state.ui.customContextLabel.textContent = "Context cap (override)";
    } else if (targetId === "custom") {
      state.ui.customContextInput.disabled = false;
      state.ui.customContextLabel.textContent = "Context size";
      state.ui.customContextInput.value = state.settings.customContextSize;
      state.ui.customContextInput.placeholder = "";
    } else {
      state.ui.customContextInput.disabled = false;
      state.ui.customContextLabel.textContent = "Context cap (override)";
      const overrides = state.settings.modelContextOverrides || {};
      const override = overrides[targetId];
      state.ui.customContextInput.value = Number.isFinite(override) ? override : "";
      const planCap = getPlanCap(targetId, state.settings.planTier);
      state.ui.customContextInput.placeholder = Number.isFinite(planCap) ? String(planCap) : "";
    }

    state.ui.attachmentInput.value = state.settings.perAttachmentTokens;
  }

  function scheduleRecalc() {
    if (recalcTimer) clearTimeout(recalcTimer);
    recalcTimer = setTimeout(() => {
      calculateEstimate();
      updateUI();
    }, DEBOUNCE_MS);
  }

  function buildOverlay() {
    if (document.getElementById("ccx-root")) return;
    const root = document.createElement("div");
    root.id = "ccx-root";

    root.innerHTML = `
      <div id="ccx-collapsed">
        <div id="ccx-percent">0% used</div>
        <div id="ccx-bar"><div id="ccx-bar-fill"></div></div>
      </div>
      <div id="ccx-panel">
        <div class="ccx-title">
          <span>Context Estimate</span>
          <span id="ccx-close">Close</span>
        </div>
        <div class="ccx-row"><span class="ccx-muted">Total tokens</span><strong id="ccx-total">0</strong></div>
        <div class="ccx-row"><span class="ccx-muted">Chat text</span><span id="ccx-chat">0</span></div>
        <div class="ccx-row"><span class="ccx-muted">Attachments</span><span id="ccx-attach">0</span></div>
        <div class="ccx-row"><span class="ccx-muted">Overhead</span><span id="ccx-overhead">0</span></div>
        <div class="ccx-row"><span class="ccx-muted">Model detected</span><span id="ccx-model">Unknown</span></div>
        <div class="ccx-row"><span class="ccx-muted">Context size</span><span id="ccx-context">0</span></div>
        <div id="ccx-warning">History may be incomplete. Scroll up to load more for a better estimate.</div>

        <div class="ccx-section">
          <div class="ccx-tag">Overrides</div>
          <div class="ccx-control">
            <label for="ccx-plan-select">Plan</label>
            <select id="ccx-plan-select"></select>
          </div>
          <div class="ccx-control">
            <label for="ccx-model-select">Model</label>
            <select id="ccx-model-select"></select>
          </div>
          <div class="ccx-control" id="ccx-custom-row">
            <label for="ccx-custom-context" id="ccx-custom-label">Context cap (override)</label>
            <input id="ccx-custom-context" type="number" min="1000" step="100" />
          </div>
          <div class="ccx-control">
            <label for="ccx-attach-input">Tokens / attachment</label>
            <input id="ccx-attach-input" type="number" min="0" step="10" />
          </div>
        </div>

        <div id="ccx-actions">
          <button class="ccx-button" id="ccx-refresh">Recalculate</button>
          <button class="ccx-button secondary" id="ccx-minimize">Minimize</button>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    const panel = root.querySelector("#ccx-panel");
    const collapsed = root.querySelector("#ccx-collapsed");

    collapsed.addEventListener("click", () => panel.classList.toggle("ccx-open"));
    root.querySelector("#ccx-close").addEventListener("click", () => panel.classList.remove("ccx-open"));
    root.querySelector("#ccx-minimize").addEventListener("click", () => panel.classList.remove("ccx-open"));

    root.querySelector("#ccx-refresh").addEventListener("click", () => {
      calculateEstimate();
      updateUI();
    });

    const planSelect = root.querySelector("#ccx-plan-select");
    planSelect.innerHTML = PLAN_OPTIONS.map((opt) => `<option value="${opt.id}">${opt.label}</option>`).join("");
    planSelect.addEventListener("change", (event) => {
      state.settings.planTier = event.target.value;
      safeStorageSet(state.settings);
      updateModelSelect();
      calculateEstimate();
      updateUI();
    });

    const modelSelect = root.querySelector("#ccx-model-select");
    modelSelect.innerHTML = buildModelOptions(state.settings.planTier)
      .map((opt) => `<option value="${opt.id}">${opt.label}</option>`)
      .join("");
    modelSelect.addEventListener("change", (event) => {
      state.settings.modelOverride = event.target.value;
      safeStorageSet(state.settings);
      calculateEstimate();
      updateUI();
    });

    const customInput = root.querySelector("#ccx-custom-context");
    customInput.addEventListener("change", (event) => {
      const raw = event.target.value.trim();
      const targetId = getOverrideTargetId();
      if (!targetId) return;
      if (!raw) {
        if (targetId === "custom") return;
        if (state.settings.modelContextOverrides && state.settings.modelContextOverrides[targetId]) {
          delete state.settings.modelContextOverrides[targetId];
          safeStorageSet(state.settings);
          calculateEstimate();
          updateUI();
        }
        return;
      }
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0) {
        if (targetId === "custom") {
          state.settings.customContextSize = value;
        } else {
          state.settings.modelContextOverrides = {
            ...(state.settings.modelContextOverrides || {}),
            [targetId]: value
          };
        }
        safeStorageSet(state.settings);
        calculateEstimate();
        updateUI();
      }
    });

    const attachmentInput = root.querySelector("#ccx-attach-input");
    attachmentInput.addEventListener("change", (event) => {
      const value = Number(event.target.value);
      if (Number.isFinite(value) && value >= 0) {
        state.settings.perAttachmentTokens = value;
        safeStorageSet(state.settings);
        calculateEstimate();
        updateUI();
      }
    });

    state.ui = {
      root,
      percent: root.querySelector("#ccx-percent"),
      barFill: root.querySelector("#ccx-bar-fill"),
      totalTokens: root.querySelector("#ccx-total"),
      chatTokens: root.querySelector("#ccx-chat"),
      attachmentTokens: root.querySelector("#ccx-attach"),
      overheadTokens: root.querySelector("#ccx-overhead"),
      modelLabel: root.querySelector("#ccx-model"),
      contextSize: root.querySelector("#ccx-context"),
      warning: root.querySelector("#ccx-warning"),
      planSelect,
      modelSelect,
      customContextRow: root.querySelector("#ccx-custom-row"),
      customContextLabel: root.querySelector("#ccx-custom-label"),
      customContextInput: customInput,
      attachmentInput
    };
  }

  function buildModelOptions(planTier) {
    const allowedIds = new Set();
    if (planTier === "Free" || planTier === "Go") {
      allowedIds.add("gpt-5.3-instant");
    } else if (planTier === "Plus") {
      allowedIds.add("gpt-5.3-instant");
      allowedIds.add("gpt-5.4-thinking");
      allowedIds.add("gpt-5.4-pro");
      LEGACY_MODEL_IDS.forEach((id) => allowedIds.add(id));
    } else {
      MODEL_DEFS.forEach((model) => allowedIds.add(model.id));
    }

    const allowedModels = MODEL_DEFS.filter((model) => allowedIds.has(model.id)).map((model) => ({
      id: model.id,
      label: model.label
    }));

    return [
      { id: "auto", label: "Auto-detect" },
      ...allowedModels,
      { id: "custom", label: "Custom" }
    ];
  }

  function observeDom() {
    const container = document.querySelector("main") || document.body;
    const observer = new MutationObserver(() => scheduleRecalc());
    observer.observe(container, { childList: true, subtree: true, characterData: true });
  }

  async function init() {
    state.settings = await safeStorageGet();
    buildOverlay();
    calculateEstimate();
    updateUI();
    observeDom();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
