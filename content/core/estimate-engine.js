(() => {
  const content = window.__ccxContent;
  if (!content) return;

  function getModelDef(modelDefs, modelId) {
    return modelDefs.find((model) => model.id === modelId) || null;
  }

  function getPlanCap(modelDefs, modelId, planTier) {
    const model = getModelDef(modelDefs, modelId);
    if (!model) return null;
    if (model.caps && model.caps[planTier]) return model.caps[planTier];
    if (model.contextWindow) return model.contextWindow;
    return null;
  }

  function getContextSize({ settings, modelId, config }) {
    const defaultSettings = config.DEFAULT_SETTINGS || {};
    if (modelId === "custom") {
      return settings.customContextSize || defaultSettings.customContextSize || 0;
    }

    const overrides = settings.modelContextOverrides || {};
    const override = overrides[modelId];
    if (Number.isFinite(override) && override > 0) {
      return override;
    }

    const planCap = getPlanCap(config.MODEL_DEFS || [], modelId, settings.planTier);
    if (Number.isFinite(planCap) && planCap > 0) {
      return planCap;
    }

    return settings.customContextSize || defaultSettings.customContextSize || 0;
  }

  function detectModelLabel() {
    return "";
  }

  function getEstimator(estimatorRegistry, estimatorId) {
    return estimatorRegistry?.getEstimator?.(estimatorId) || null;
  }

  function estimateTokensWithFallback({ text, estimator, estimatorRegistry, modelId, tokenizer, settings }) {
    const estimatorInput = {
      text,
      modelId,
      tokenizer,
      settings
    };
    const result = estimator?.estimate?.(estimatorInput) || { chatTokens: null };
    let chatTokens = Number.isFinite(result.chatTokens) ? result.chatTokens : null;

    if (chatTokens === null && estimator?.id !== "fast") {
      const fallback = getEstimator(estimatorRegistry, "fast");
      const fallbackResult = fallback?.estimate?.(estimatorInput) || { chatTokens: 0 };
      chatTokens = Number.isFinite(fallbackResult.chatTokens) ? fallbackResult.chatTokens : 0;
    }

    if (chatTokens === null) {
      chatTokens = 0;
    }

    return chatTokens;
  }

  function buildMethodOptions({ estimatorRegistry }) {
    const estimators = estimatorRegistry?.listEstimators?.() || [];
    if (!estimators.length) {
      return [
        { id: "fast", label: "Fast estimation" },
        { id: "precise", label: "Precise (tokenizer)" }
      ];
    }

    return estimators.map((estimator) => ({
      id: estimator.id,
      label: estimator.label || estimator.id
    }));
  }

  function buildModelOptions({ planTier, modelDefs, legacyModelIds }) {
    if (!planTier) {
      return [{ id: "", label: "Select model" }];
    }

    const allowedIds = new Set();
    if (planTier === "Free" || planTier === "Go") {
      allowedIds.add("gpt-5.3-instant");
    } else if (planTier === "Plus") {
      allowedIds.add("gpt-5.3-instant");
      allowedIds.add("gpt-5.4-thinking");
      allowedIds.add("gpt-5.4-pro");

      if (legacyModelIds instanceof Set) {
        legacyModelIds.forEach((id) => allowedIds.add(id));
      } else if (Array.isArray(legacyModelIds)) {
        for (const id of legacyModelIds) {
          allowedIds.add(id);
        }
      }
    } else {
      for (const model of modelDefs || []) {
        allowedIds.add(model.id);
      }
    }

    const allowedModels = (modelDefs || [])
      .filter((model) => allowedIds.has(model.id))
      .map((model) => ({
        id: model.id,
        label: model.label
      }));

    return [{ id: "", label: "Select model" }, ...allowedModels];
  }

  function calculateEstimate({
    settings,
    pageContext,
    estimatorRegistry,
    tokenizer,
    config
  }) {
    const defaultSettings = config.DEFAULT_SETTINGS || {};
    const isReady = Boolean(settings.planTier && settings.modelOverride);

    if (!isReady) {
      return {
        isReady: false,
        modelLabel: "Not selected",
        modelId: "",
        contextSize: 0,
        estimate: {
          chatTokens: 0,
          overheadTokens: 0,
          totalTokens: 0
        },
        preciseSkipped: false,
        perMessageUsage: []
      };
    }

    const chatText = (pageContext.messages || []).map((message) => message.text).join("\n\n");
    const selectedMethod = settings.estimationMethod || defaultSettings.estimationMethod || "fast";
    const preciseLimit = Number.isFinite(config.PRECISE_MAX_CHARS) ? config.PRECISE_MAX_CHARS : 250000;
    const preciseSkipped = selectedMethod === "precise" && chatText.length > preciseLimit;
    const estimatorId = preciseSkipped ? "fast" : selectedMethod;
    const estimator = getEstimator(estimatorRegistry, estimatorId) || getEstimator(estimatorRegistry, "fast");
    const chatTokens = estimateTokensWithFallback({
      text: chatText,
      estimator,
      estimatorRegistry,
      modelId: settings.modelOverride,
      tokenizer,
      settings
    });

    const overheadTokens = Number.isFinite(settings.overheadTokens)
      ? settings.overheadTokens
      : defaultSettings.overheadTokens || 0;

    const contextSize = getContextSize({
      settings,
      modelId: settings.modelOverride,
      config
    });
    const perMessageUsage = settings.showPerMessageUsage
      ? (() => {
          const tokenCache = new Map();
          return (pageContext.messages || []).map((message) => {
            const messageText = message.text || "";
            let tokens = tokenCache.get(messageText);
            if (!Number.isFinite(tokens)) {
              tokens = estimateTokensWithFallback({
                text: messageText,
                estimator,
                estimatorRegistry,
                modelId: settings.modelOverride,
                tokenizer,
                settings
              });
              tokenCache.set(messageText, tokens);
            }

            const contextPercent = contextSize > 0 ? (tokens / contextSize) * 100 : 0;
            return {
              tokens,
              contextPercent,
              role: message.role || "unknown"
            };
          });
        })()
      : [];

    return {
      isReady: true,
      modelLabel: detectModelLabel() || "Manual selection",
      modelId: settings.modelOverride,
      contextSize,
      estimate: {
        chatTokens,
        overheadTokens,
        totalTokens: chatTokens + overheadTokens
      },
      preciseSkipped,
      perMessageUsage
    };
  }

  content.core.buildMethodOptions = buildMethodOptions;
  content.core.buildModelOptions = buildModelOptions;
  content.core.calculateEstimate = calculateEstimate;
})();
