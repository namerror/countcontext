chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "ccx-open-learn") return;
  const url = chrome.runtime.getURL("learn.html");
  chrome.tabs.create({ url });
  sendResponse({ ok: true });
  return true;
});
