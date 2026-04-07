(() => {
  const config = window.__ccxConfig || {};
  const DEFAULT_SETTINGS = config.DEFAULT_SETTINGS || {
    modelOverride: "",
    planTier: "",
    showPerMessageUsage: true,
    customContextSize: 8000,
    modelContextOverrides: {},
    overlayPosition: {
      right: 16,
      bottom: 16
    },
    perAttachmentTokens: 200,
    overheadTokens: 500,
    virtualizationStrategy: "USER_GUIDED",
    estimationMethod: "fast"
  };
  const PLAN_OPTIONS = config.PLAN_OPTIONS || [];
  const MODEL_DEFS = config.MODEL_DEFS || [];
  const LEGACY_MODEL_IDS = config.LEGACY_MODEL_IDS || new Set();
  const content = window.__ccxContent || {};

  const attachOverlayDrag = content.ui?.attachOverlayDrag;
  const createOverlayView = content.ui?.createOverlayView;
  const readPageContext = content.core?.readPageContext;
  const calculateEstimate = content.core?.calculateEstimate;
  const buildMethodOptionsFromRegistry = content.core?.buildMethodOptions;
  const buildModelOptionsFromConfig = content.core?.buildModelOptions;
  const createScheduler = content.core?.createScheduler;
  const observeDom = content.core?.observeDom;
  const observeNavigation = content.core?.observeNavigation;

  if (
    typeof attachOverlayDrag !== "function" ||
    typeof createOverlayView !== "function" ||
    typeof readPageContext !== "function" ||
    typeof calculateEstimate !== "function" ||
    typeof buildMethodOptionsFromRegistry !== "function" ||
    typeof buildModelOptionsFromConfig !== "function" ||
    typeof createScheduler !== "function" ||
    typeof observeDom !== "function" ||
    typeof observeNavigation !== "function"
  ) {
    console.error("CCX content modules failed to load");
    return;
  }

  const STORAGE_KEY = "ccx_settings";
  const DEBOUNCE_MS = 500;
  const DRAG_THRESHOLD_PX = 6;
  const PRECISE_MAX_CHARS = 250000;
  const URL_POLL_MS = 1000;
  const CCX_USAGE_SELECTOR = ".ccx-message-usage, [data-ccx-message-usage='true']";

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    ui: null,
    dragController: null,
    modelLabel: "",
    modelId: "",
    pageSupport: "supported_regular_chat",
    pageWarning: "",
    contextSize: DEFAULT_SETTINGS.customContextSize,
    estimate: {
      chatTokens: 0,
      overheadTokens: DEFAULT_SETTINGS.overheadTokens,
      totalTokens: 0
    },
    perMessageUsage: [],
    isIncomplete: false,
    preciseSkipped: false
  };

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

  function persistSettings() {
    safeStorageSet(state.settings);
  }

  function normalizeOverlayPosition(position) {
    const fallback = DEFAULT_SETTINGS.overlayPosition || { right: 16, bottom: 16 };
    const right = Number.isFinite(position?.right) && position.right >= 0 ? position.right : fallback.right;
    const bottom = Number.isFinite(position?.bottom) && position.bottom >= 0 ? position.bottom : fallback.bottom;
    return { right, bottom };
  }

  function clampOffset(value, max) {
    return Math.min(Math.max(0, value), Math.max(0, max));
  }

  function getOverlayPosition() {
    const normalized = normalizeOverlayPosition(state.settings.overlayPosition);
    state.settings.overlayPosition = normalized;
    return normalized;
  }

  function getOverlayMetrics() {
    const root = state.ui?.refs?.root;
    const collapsed = state.ui?.refs?.collapsed;
    if (!root || !collapsed) {
      return {
        rootWidth: 0,
        rootHeight: 0,
        collapsedWidth: 0,
        collapsedHeight: 0,
        anchorOffsetRight: 0,
        anchorOffsetBottom: 0
      };
    }

    const rootRect = root.getBoundingClientRect();
    const collapsedRect = collapsed.getBoundingClientRect();

    return {
      rootWidth: rootRect.width,
      rootHeight: rootRect.height,
      collapsedWidth: collapsedRect.width,
      collapsedHeight: collapsedRect.height,
      anchorOffsetRight: Math.max(0, rootRect.right - collapsedRect.right),
      anchorOffsetBottom: Math.max(0, rootRect.bottom - collapsedRect.bottom)
    };
  }

  function clampOverlayAnchor(position) {
    const normalized = normalizeOverlayPosition(position);
    const metrics = getOverlayMetrics();

    return {
      right: clampOffset(normalized.right, window.innerWidth - metrics.collapsedWidth),
      bottom: clampOffset(normalized.bottom, window.innerHeight - metrics.collapsedHeight)
    };
  }

  function getRenderedOverlayPosition(anchorPosition) {
    const metrics = getOverlayMetrics();
    const anchor = normalizeOverlayPosition(anchorPosition);

    return {
      right: clampOffset(anchor.right - metrics.anchorOffsetRight, window.innerWidth - metrics.rootWidth),
      bottom: clampOffset(anchor.bottom - metrics.anchorOffsetBottom, window.innerHeight - metrics.rootHeight)
    };
  }

  function applyOverlayPosition(position) {
    const root = state.ui?.refs?.root;
    if (!root) return normalizeOverlayPosition(position);

    // Persist the collapsed bar anchor while rendering the full overlay around it.
    const anchor = clampOverlayAnchor(position);
    const rendered = getRenderedOverlayPosition(anchor);

    root.style.right = `${Math.round(rendered.right)}px`;
    root.style.bottom = `${Math.round(rendered.bottom)}px`;
    state.settings.overlayPosition = anchor;
    return anchor;
  }

  function persistOverlayPosition(position) {
    state.settings.overlayPosition = clampOverlayAnchor(position);
    persistSettings();
  }

  function getEstimatorRegistry() {
    return window.__ccxEstimatorRegistry || null;
  }

  function buildModelOptions(planTier) {
    return buildModelOptionsFromConfig({
      planTier,
      modelDefs: MODEL_DEFS,
      legacyModelIds: LEGACY_MODEL_IDS
    });
  }

  function buildMethodOptions() {
    return buildMethodOptionsFromRegistry({
      estimatorRegistry: getEstimatorRegistry()
    });
  }

  function sanitizeSettings() {
    state.settings.overlayPosition = normalizeOverlayPosition(state.settings.overlayPosition);
    state.settings.showPerMessageUsage = Boolean(state.settings.showPerMessageUsage);

    if (!PLAN_OPTIONS.some((option) => option.id === state.settings.planTier)) {
      state.settings.planTier = "";
    }

    const modelOptions = buildModelOptions(state.settings.planTier);
    if (!modelOptions.some((option) => option.id === state.settings.modelOverride)) {
      state.settings.modelOverride = "";
    }

    const methodOptions = buildMethodOptions();
    if (!methodOptions.some((option) => option.id === state.settings.estimationMethod)) {
      state.settings.estimationMethod = DEFAULT_SETTINGS.estimationMethod || "fast";
    }
  }

  function applyUnsupportedState(pageContext) {
    state.pageSupport = pageContext.supportStatus;
    state.pageWarning = pageContext.warning;
    state.modelLabel = "Unsupported";
    state.modelId = "";
    state.contextSize = 0;
    state.estimate = {
      chatTokens: 0,
      overheadTokens: 0,
      totalTokens: 0
    };
    state.perMessageUsage = [];
    state.isIncomplete = false;
    state.preciseSkipped = false;
  }

  function applyEstimateState(pageContext) {
    const result = calculateEstimate({
      settings: state.settings,
      pageContext,
      estimatorRegistry: getEstimatorRegistry(),
      tokenizer: window.__ccxTokenizer,
      config: {
        DEFAULT_SETTINGS,
        MODEL_DEFS,
        LEGACY_MODEL_IDS,
        PRECISE_MAX_CHARS
      }
    });

    state.pageSupport = pageContext.supportStatus;
    state.pageWarning = pageContext.warning;
    state.modelLabel = result.modelLabel;
    state.modelId = result.modelId;
    state.contextSize = result.contextSize;
    state.estimate = result.estimate;
    state.perMessageUsage = result.perMessageUsage || [];
    state.isIncomplete = pageContext.isIncomplete;
    state.preciseSkipped = result.preciseSkipped;
  }

  function refreshFromPageState() {
    sanitizeSettings();

    const pageContext = readPageContext();
    if (pageContext.supportStatus !== "supported_regular_chat") {
      applyUnsupportedState(pageContext);
      render();
      return;
    }

    applyEstimateState(pageContext);
    render();
  }

  function formatNumber(value) {
    return new Intl.NumberFormat().format(value);
  }

  function formatPercent(value) {
    const precision = value >= 1 ? 1 : 2;
    return `${value.toFixed(precision)}%`;
  }

  function normalizeMessageRole(role) {
    const normalized = String(role || "").toLowerCase();
    if (normalized === "user" || normalized === "assistant") {
      return normalized;
    }
    return "";
  }

  function resolveMessageRole(messageUsage, node, messageIndex) {
    const usageRole = normalizeMessageRole(messageUsage?.role);
    if (usageRole) return usageRole;

    const nodeRole = normalizeMessageRole(node?.getAttribute("data-message-author-role"));
    if (nodeRole) return nodeRole;

    return messageIndex % 2 === 0 ? "user" : "assistant";
  }

  function normalizeMessageText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function withUsageBadgesHidden(node, readText) {
    const badges = Array.from(node.querySelectorAll(CCX_USAGE_SELECTOR));
    if (!badges.length) {
      return readText();
    }

    const previousDisplays = badges.map((badge) => badge.style.display);
    for (const badge of badges) {
      badge.style.display = "none";
    }

    try {
      return readText();
    } finally {
      badges.forEach((badge, index) => {
        badge.style.display = previousDisplays[index];
      });
    }
  }

  function getRenderableMessageText(node) {
    return normalizeMessageText(withUsageBadgesHidden(node, () => node.innerText || ""));
  }

  function findMessageNodes() {
    const nodes = Array.from(document.querySelectorAll("[data-message-author-role]"));
    if (nodes.length) return nodes;
    return Array.from(document.querySelectorAll("[data-testid='conversation-turn']"));
  }

  function findRenderableMessageNodes() {
    return findMessageNodes().filter((node) => getRenderableMessageText(node).length > 0);
  }

  function clearPerMessageUsageBadges() {
    for (const node of findMessageNodes()) {
      for (const badge of Array.from(node.querySelectorAll(".ccx-message-usage"))) {
        badge.remove();
      }
    }
  }

  function renderPerMessageUsageBadges() {
    const isSupported = state.pageSupport === "supported_regular_chat";
    const isReady = Boolean(state.settings.planTier && state.settings.modelOverride);
    if (!state.settings.showPerMessageUsage || !isSupported || !isReady) {
      clearPerMessageUsageBadges();
      return;
    }

    const messageNodes = findRenderableMessageNodes();
    const usage = state.perMessageUsage || [];
    const count = Math.min(messageNodes.length, usage.length);
    const activeNodes = new Set();

    for (let messageIndex = 0; messageIndex < count; messageIndex += 1) {
      const node = messageNodes[messageIndex];
      const messageUsage = usage[messageIndex];
      if (!node || !messageUsage || !Number.isFinite(messageUsage.tokens)) continue;

      const nextText = `${formatNumber(messageUsage.tokens)} tokens, ${formatPercent(messageUsage.contextPercent || 0)}`;
      let badge = node.querySelector(".ccx-message-usage");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "ccx-message-usage";
        badge.dataset.ccxMessageUsage = "true";
        node.appendChild(badge);
      }
      if (badge.textContent !== nextText) {
        badge.textContent = nextText;
      }

      const role = resolveMessageRole(messageUsage, node, messageIndex);
      badge.classList.remove("ccx-message-usage-user", "ccx-message-usage-assistant");
      badge.classList.add(role === "user" ? "ccx-message-usage-user" : "ccx-message-usage-assistant");
      activeNodes.add(node);
    }

    for (const node of findMessageNodes()) {
      if (activeNodes.has(node)) continue;
      for (const badge of Array.from(node.querySelectorAll(".ccx-message-usage"))) {
        badge.remove();
      }
    }
  }

  function percentUsed() {
    if (!state.contextSize) return 0;
    return Math.min(100, Math.round((state.estimate.totalTokens / state.contextSize) * 100));
  }

  function getWarnings() {
    if (state.pageSupport !== "supported_regular_chat") {
      return state.pageWarning ? [state.pageWarning] : [];
    }

    const warnings = [];
    if (state.isIncomplete) {
      warnings.push("History may be incomplete. Scroll up to load more for a better estimate.");
    }
    if (state.preciseSkipped) {
      warnings.push("Precise tokenization skipped (chat too large); using Fast estimation.");
    }
    return warnings;
  }

  function buildViewModel() {
    const isSupported = state.pageSupport === "supported_regular_chat";
    const ready = Boolean(state.settings.planTier && state.settings.modelOverride);
    const percent = isSupported ? percentUsed() : 0;

    return {
      pageSupport: state.pageSupport,
      percentText: isSupported ? `${percent}% used` : "Unsupported",
      barFillPercent: percent,
      totalTokensText: isSupported
        ? ready
          ? formatNumber(state.estimate.totalTokens)
          : "—"
        : "Unsupported",
      chatTokensText: isSupported
        ? ready
          ? formatNumber(state.estimate.chatTokens)
          : "—"
        : "Unsupported",
      overheadTokensText: isSupported
        ? ready
          ? formatNumber(state.estimate.overheadTokens)
          : "—"
        : "Unsupported",
      modelLabelText: isSupported
        ? ready
          ? state.modelLabel || "Unknown"
          : "Not selected"
        : "Unsupported",
      contextSizeText: isSupported
        ? ready
          ? formatNumber(state.contextSize)
          : "—"
        : "Unsupported",
      warnings: getWarnings(),
      selections: {
        planTier: state.settings.planTier,
        modelOverride: state.settings.modelOverride,
        estimationMethod: state.settings.estimationMethod,
        showPerMessageUsage: state.settings.showPerMessageUsage
      }
    };
  }

  function render() {
    state.ui?.render(buildViewModel());
    renderPerMessageUsageBadges();
  }

  function handleLearn() {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "ccx-open-learn" });
      return;
    }

    const url = chrome?.runtime?.getURL ? chrome.runtime.getURL("learn.html") : "learn.html";
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handlePlanChange(planTier) {
    state.settings.planTier = PLAN_OPTIONS.some((option) => option.id === planTier) ? planTier : "";

    const modelOptions = buildModelOptions(state.settings.planTier);
    if (!modelOptions.some((option) => option.id === state.settings.modelOverride)) {
      state.settings.modelOverride = "";
    }

    persistSettings();
    refreshFromPageState();
  }

  function handleModelChange(modelId) {
    state.settings.modelOverride = modelId;
    persistSettings();
    refreshFromPageState();
  }

  function handleMethodChange(methodId) {
    const methodOptions = buildMethodOptions();
    state.settings.estimationMethod = methodOptions.some((option) => option.id === methodId)
      ? methodId
      : DEFAULT_SETTINGS.estimationMethod || "fast";

    persistSettings();
    refreshFromPageState();
  }

  function handlePerMessageUsageChange(enabled) {
    state.settings.showPerMessageUsage = Boolean(enabled);
    persistSettings();
    refreshFromPageState();
  }

  async function init() {
    state.settings = await safeStorageGet();
    sanitizeSettings();

    state.ui = createOverlayView({
      planOptions: PLAN_OPTIONS,
      getModelOptions: buildModelOptions,
      getMethodOptions: buildMethodOptions,
      onRefresh: refreshFromPageState,
      onLearn: handleLearn,
      onPlanChange: handlePlanChange,
      onModelChange: handleModelChange,
      onMethodChange: handleMethodChange,
      onPerMessageUsageChange: handlePerMessageUsageChange
    });

    state.dragController = attachOverlayDrag({
      root: state.ui.refs.root,
      handle: state.ui.refs.collapsed,
      thresholdPx: DRAG_THRESHOLD_PX,
      getPosition: getOverlayPosition,
      applyPosition: applyOverlayPosition,
      persistPosition: persistOverlayPosition
    });

    state.ui.refs.root.addEventListener("ccx:overlaylayoutchange", () => {
      state.dragController?.syncToViewport(false);
    });

    const scheduler = createScheduler({
      delayMs: DEBOUNCE_MS,
      onRun: refreshFromPageState
    });
    const domObserver = observeDom({
      onChange: () => scheduler.schedule()
    });
    const navigationObserver = observeNavigation({
      onChange: () => scheduler.schedule(),
      pollMs: URL_POLL_MS
    });

    window.addEventListener("beforeunload", () => {
      state.dragController?.destroy();
      scheduler.destroy();
      domObserver.disconnect();
      navigationObserver.disconnect();
    }, { once: true });

    refreshFromPageState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
