(() => {
  const registry = window.__ccxEstimatorRegistry;
  if (!registry) return;

  function estimateTokensWithTokenizer(text, tokenizer) {
    if (!tokenizer || typeof tokenizer.encode !== "function") return null;
    try {
      const encoded = tokenizer.encode(text);
      return Array.isArray(encoded) ? encoded.length : null;
    } catch {
      return null;
    }
  }

  registry.registerEstimator({
    id: "precise",
    label: "Precise (tokenizer)",
    estimate({ text, tokenizer }) {
      const safeText = typeof text === "string" ? text : "";
      return { chatTokens: estimateTokensWithTokenizer(safeText, tokenizer) };
    }
  });
})();

