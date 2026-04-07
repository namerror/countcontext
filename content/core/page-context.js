(() => {
  const content = window.__ccxContent;
  if (!content) return;
  const CCX_USAGE_SELECTOR = ".ccx-message-usage, [data-ccx-message-usage='true']";

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function readNodeTextWithoutUsage(node) {
    const usageNodes = Array.from(node.querySelectorAll(CCX_USAGE_SELECTOR));
    if (!usageNodes.length) {
      return normalizeText(node.innerText || "");
    }

    const previousDisplays = usageNodes.map((usageNode) => usageNode.style.display);
    for (const usageNode of usageNodes) {
      usageNode.style.display = "none";
    }

    try {
      return normalizeText(node.innerText || "");
    } finally {
      usageNodes.forEach((usageNode, index) => {
        usageNode.style.display = previousDisplays[index];
      });
    }
  }

  function findMessageNodes() {
    const nodes = Array.from(document.querySelectorAll("[data-message-author-role]"));
    if (nodes.length) return nodes;
    return Array.from(document.querySelectorAll("[data-testid='conversation-turn']"));
  }

  function parseConversation() {
    const messages = [];

    for (const node of findMessageNodes()) {
      const role = node.getAttribute("data-message-author-role") || "unknown";
      const text = readNodeTextWithoutUsage(node);
      if (!text) continue;
      messages.push({ role, text });
    }

    return { messages };
  }

  function findScrollContainer() {
    const main = document.querySelector("main");
    if (!main) return null;

    for (const element of Array.from(main.querySelectorAll("div"))) {
      if (element.scrollHeight > element.clientHeight + 200) {
        return element;
      }
    }

    return null;
  }

  function detectIncompleteHistory() {
    const scrollContainer = findScrollContainer();
    if (scrollContainer && scrollContainer.scrollTop > 50) {
      return true;
    }

    const loadButtons = Array.from(document.querySelectorAll("button, a"));
    return loadButtons.some((element) => /load more|show more|scroll/i.test((element.textContent || "").toLowerCase()));
  }

  function isCanonicalChatPath(pathname) {
    return /^\/c\/[^/]+\/?$/.test(pathname);
  }

  function isNewChatPath(pathname) {
    return pathname === "/";
  }

  function hasRegularChatSignals() {
    if (findMessageNodes().length > 0) return true;
    if (document.querySelector("#prompt-textarea")) return true;
    if (document.querySelector("main form textarea, main form [contenteditable='true']")) return true;
    return false;
  }

  function detectPageSupport() {
    const { pathname } = window.location;
    const pathLooksSupported = isCanonicalChatPath(pathname) || isNewChatPath(pathname);

    if (!pathLooksSupported) {
      return {
        supportStatus: "unsupported_project_or_nonchat",
        warning: "Unsupported page. Context Counter works on regular ChatGPT chats only (including new chat)."
      };
    }

    if (!hasRegularChatSignals()) {
      return {
        supportStatus: "unsupported_unknown_layout",
        warning: "Unsupported chat layout. Open a regular chat tab to estimate context."
      };
    }

    return {
      supportStatus: "supported_regular_chat",
      warning: ""
    };
  }

  function readPageContext() {
    const support = detectPageSupport();
    if (support.supportStatus !== "supported_regular_chat") {
      return {
        supportStatus: support.supportStatus,
        warning: support.warning,
        messages: [],
        isIncomplete: false
      };
    }

    return {
      supportStatus: support.supportStatus,
      warning: support.warning,
      messages: parseConversation().messages,
      isIncomplete: detectIncompleteHistory()
    };
  }

  content.core.readPageContext = readPageContext;
})();
