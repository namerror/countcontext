(() => {
  const registry = window.__ccxEstimatorRegistry;
  if (!registry) return;

  function estimateTokensHeuristic(text) {
    const chars = text.length;
    let charsPerToken = 4;
    const tokens = Math.ceil(chars / charsPerToken);
    return Math.max(tokens, 0);
  }

  registry.registerEstimator({
    id: "fast",
    label: "Fast estimation",
    estimate({ text }) {
      const safeText = typeof text === "string" ? text : "";
      return { chatTokens: estimateTokensHeuristic(safeText) };
    }
  });
})();
