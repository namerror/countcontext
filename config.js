(() => {
  if (window.__ccxConfig) return;

  const DEFAULT_SETTINGS = {
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

  window.__ccxConfig = {
    DEFAULT_SETTINGS,
    PLAN_OPTIONS,
    MODEL_DEFS,
    LEGACY_MODEL_IDS
  };
})();
