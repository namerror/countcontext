(() => {
  const content = window.__ccxContent;
  if (!content) return;

  function setSelectOptions(select, options, selectedValue) {
    select.replaceChildren();

    for (const optionData of options) {
      const option = document.createElement("option");
      option.value = optionData.id;
      option.textContent = optionData.label;
      if (optionData.disabled) option.disabled = true;
      select.appendChild(option);
    }

    select.value = selectedValue || "";
    if (select.value !== (selectedValue || "")) {
      select.value = "";
    }
  }

  function renderWarningMessages(container, warnings) {
    container.replaceChildren();
    container.style.display = warnings.length ? "block" : "none";

    for (const warning of warnings) {
      const row = document.createElement("div");
      row.textContent = warning;
      container.appendChild(row);
    }
  }

  function createOverlayView({
    planOptions,
    getModelOptions,
    getMethodOptions,
    onRefresh,
    onLearn,
    onPlanChange,
    onModelChange,
    onMethodChange,
    onPerMessageUsageChange
  }) {
    const existingRoot = document.getElementById("ccx-root");
    if (existingRoot) {
      existingRoot.remove();
    }

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
        </div>
        <div class="ccx-row"><span class="ccx-muted">Total tokens</span><strong id="ccx-total">0</strong></div>
        <div class="ccx-row"><span class="ccx-muted">Chat text</span><span id="ccx-chat">0</span></div>
        <div class="ccx-row"><span class="ccx-muted">Attachments</span><span id="ccx-attach">Not implemented</span></div>
        <div class="ccx-row"><span class="ccx-muted">Overhead</span><span id="ccx-overhead">0</span></div>
        <div class="ccx-row"><span class="ccx-muted">Model detected</span><span id="ccx-model">Unknown</span></div>
        <div class="ccx-row"><span class="ccx-muted">Context size</span><span id="ccx-context">0</span></div>
        <div id="ccx-warning"></div>

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
          <div class="ccx-control">
            <label for="ccx-method-select">Estimation</label>
            <select id="ccx-method-select"></select>
          </div>
          <div class="ccx-control">
            <label for="ccx-message-usage-toggle">Per-message usage</label>
            <input type="checkbox" id="ccx-message-usage-toggle" />
          </div>
        </div>

        <div id="ccx-actions">
          <button class="ccx-button" id="ccx-refresh">Recalculate</button>
          <button class="ccx-button secondary" id="ccx-minimize">Minimize</button>
        </div>
        <div id="ccx-footer">
          <button class="ccx-link" id="ccx-learn">Learn how it works</button>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    const refs = {
      root,
      panel: root.querySelector("#ccx-panel"),
      collapsed: root.querySelector("#ccx-collapsed"),
      percent: root.querySelector("#ccx-percent"),
      barFill: root.querySelector("#ccx-bar-fill"),
      totalTokens: root.querySelector("#ccx-total"),
      chatTokens: root.querySelector("#ccx-chat"),
      overheadTokens: root.querySelector("#ccx-overhead"),
      modelLabel: root.querySelector("#ccx-model"),
      contextSize: root.querySelector("#ccx-context"),
      warning: root.querySelector("#ccx-warning"),
      planSelect: root.querySelector("#ccx-plan-select"),
      modelSelect: root.querySelector("#ccx-model-select"),
      methodSelect: root.querySelector("#ccx-method-select"),
      messageUsageToggle: root.querySelector("#ccx-message-usage-toggle"),
      refreshButton: root.querySelector("#ccx-refresh"),
      minimizeButton: root.querySelector("#ccx-minimize"),
      learnButton: root.querySelector("#ccx-learn")
    };

    const emitLayoutChange = () => {
      refs.root.dispatchEvent(new CustomEvent("ccx:overlaylayoutchange"));
    };

    refs.collapsed.addEventListener("click", () => {
      refs.panel.classList.toggle("ccx-open");
      requestAnimationFrame(emitLayoutChange);
    });

    refs.minimizeButton.addEventListener("click", () => {
      refs.panel.classList.remove("ccx-open");
      requestAnimationFrame(emitLayoutChange);
    });

    refs.refreshButton.addEventListener("click", () => {
      onRefresh?.();
    });

    refs.learnButton.addEventListener("click", () => {
      onLearn?.();
    });

    refs.planSelect.addEventListener("change", (event) => {
      onPlanChange?.(event.target.value);
    });

    refs.modelSelect.addEventListener("change", (event) => {
      onModelChange?.(event.target.value);
    });

    refs.methodSelect.addEventListener("change", (event) => {
      onMethodChange?.(event.target.value);
    });

    refs.messageUsageToggle.addEventListener("change", (event) => {
      onPerMessageUsageChange?.(event.target.checked);
    });

    const render = (viewModel) => {
      const nextPlanOptions = [
        { id: "", label: "Select plan", disabled: true },
        ...(planOptions || [])
      ];
      const nextModelOptions = getModelOptions?.(viewModel.selections.planTier) || [];
      const nextMethodOptions = getMethodOptions?.() || [];

      refs.percent.textContent = viewModel.percentText;
      refs.barFill.style.width = `${viewModel.barFillPercent}%`;
      refs.totalTokens.textContent = viewModel.totalTokensText;
      refs.chatTokens.textContent = viewModel.chatTokensText;
      refs.overheadTokens.textContent = viewModel.overheadTokensText;
      refs.modelLabel.textContent = viewModel.modelLabelText;
      refs.contextSize.textContent = viewModel.contextSizeText;

      renderWarningMessages(refs.warning, viewModel.warnings || []);
      setSelectOptions(refs.planSelect, nextPlanOptions, viewModel.selections.planTier);
      setSelectOptions(refs.modelSelect, nextModelOptions, viewModel.selections.modelOverride);
      setSelectOptions(refs.methodSelect, nextMethodOptions, viewModel.selections.estimationMethod);
      refs.messageUsageToggle.checked = Boolean(viewModel.selections.showPerMessageUsage);
    };

    return { refs, render };
  }

  content.ui.createOverlayView = createOverlayView;
})();
